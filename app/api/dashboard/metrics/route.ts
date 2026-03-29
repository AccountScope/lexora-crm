import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/metrics - Get executive dashboard metrics
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'month';

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Fetch metrics in parallel
    const [
      casesData,
      invoicesData,
      timeEntriesData,
      trustData,
    ] = await Promise.all([
      // Active cases count
      supabase
        .from('cases')
        .select('id, status, practice_area, created_at', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active'),

      // Invoices data (current month vs last month)
      supabase
        .from('invoices')
        .select('total, status, created_at')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startOfLastMonth.toISOString()),

      // Time entries (billable vs non-billable)
      supabase
        .from('time_entries')
        .select('billable, hours, user_id')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startOfMonth.toISOString()),

      // Trust account balance
      supabase
        .from('trust_accounts')
        .select('balance')
        .eq('organization_id', profile.organization_id),
    ]);

    // Process revenue metrics
    const currentMonthInvoices = invoicesData.data?.filter(
      inv => new Date(inv.created_at) >= startOfMonth
    ) || [];
    
    const lastMonthInvoices = invoicesData.data?.filter(
      inv => new Date(inv.created_at) >= startOfLastMonth && new Date(inv.created_at) <= endOfLastMonth
    ) || [];

    const currentMonthRevenue = currentMonthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const lastMonthRevenue = lastMonthInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const yearToDateRevenue = invoicesData.data?.filter(
      inv => new Date(inv.created_at) >= startOfYear
    ).reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

    const outstandingInvoices = invoicesData.data?.filter(
      inv => inv.status === 'pending' || inv.status === 'overdue'
    ).reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

    const revenueTrend = lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    // Process matters metrics
    const newMattersThisMonth = casesData.data?.filter(
      c => new Date(c.created_at) >= startOfMonth
    ).length || 0;

    const mattersByStatus = [
      { status: 'Active', count: casesData.count || 0 },
      // Add more status counts as needed
    ];

    const practiceAreas = casesData.data?.reduce((acc: any, matter: any) => {
      const area = matter.practice_area || 'Uncategorized';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {});

    const mattersByPracticeArea = Object.entries(practiceAreas || {}).map(([area, count]) => ({
      area,
      count: count as number
    }));

    // Process time metrics
    const billableHours = timeEntriesData.data?.filter(
      t => t.billable
    ).reduce((sum, t) => sum + (t.hours || 0), 0) || 0;

    const nonBillableHours = timeEntriesData.data?.filter(
      t => !t.billable
    ).reduce((sum, t) => sum + (t.hours || 0), 0) || 0;

    const utilizationRate = (billableHours + nonBillableHours) > 0
      ? (billableHours / (billableHours + nonBillableHours)) * 100
      : 0;

    // Top billers (group by user_id)
    const billerMap = timeEntriesData.data?.reduce((acc: any, entry: any) => {
      if (entry.billable) {
        acc[entry.user_id] = (acc[entry.user_id] || 0) + (entry.hours || 0);
      }
      return acc;
    }, {});

    const topBillers = Object.entries(billerMap || {})
      .map(([userId, hours]) => ({
        name: 'User ' + userId.slice(0, 8), // Replace with actual user names
        hours: hours as number
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Trust account metrics
    const totalTrustBalance = trustData.data?.reduce(
      (sum, acc) => sum + (acc.balance || 0), 0
    ) || 0;

    // Build response
    const metrics = {
      revenue: {
        current_month: Math.round(currentMonthRevenue),
        last_month: Math.round(lastMonthRevenue),
        year_to_date: Math.round(yearToDateRevenue),
        outstanding: Math.round(outstandingInvoices),
        trend: Math.round(revenueTrend * 10) / 10
      },
      matters: {
        active: casesData.count || 0,
        new_this_month: newMattersThisMonth,
        by_status: mattersByStatus,
        by_practice_area: mattersByPracticeArea
      },
      time: {
        billable_hours: Math.round(billableHours),
        non_billable_hours: Math.round(nonBillableHours),
        utilization_rate: Math.round(utilizationRate * 10) / 10,
        top_billers: topBillers
      },
      trust: {
        total_balance: Math.round(totalTrustBalance),
        unallocated: 0, // Calculate if needed
        recent_transactions: []
      },
      clients: {
        total: 0, // Add client count query if clients table exists
        new_this_month: 0,
        top_by_revenue: []
      }
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
