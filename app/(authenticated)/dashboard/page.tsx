"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCardPremium, MetricCardSkeleton } from "@/components/dashboard/metric-card-premium";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { EmptyStatePremium } from "@/components/ui/empty-state-premium";
import { 
  DollarSign, 
  FileText, 
  Clock, 
  AlertCircle,
  Briefcase,
  Users,
  TrendingUp,
  Calendar,
  BarChart3,
  Activity
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface DashboardMetrics {
  revenue: {
    current_month: number;
    last_month: number;
    year_to_date: number;
    outstanding: number;
    trend: number;
  };
  matters: {
    active: number;
    new_this_month: number;
  };
  time: {
    billable_hours: number;
    utilization_rate: number;
  };
  clients: {
    total: number;
    new_this_month: number;
  };
}

const CHART_COLORS = {
  primary: "hsl(221, 83%, 53%)",
  success: "hsl(142, 76%, 36%)",
  warning: "hsl(38, 92%, 50%)",
  danger: "hsl(0, 72%, 51%)",
  muted: "hsl(215, 16%, 47%)",
};

export default function DashboardPremium() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");

  useEffect(() => {
    fetchMetrics();
  }, [timeRange]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/metrics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setTimeout(() => setLoading(false), 600);
    }
  };

  // Mock data
  const mockMetrics: DashboardMetrics = {
    revenue: {
      current_month: 125000,
      last_month: 110000,
      year_to_date: 980000,
      outstanding: 45000,
      trend: 13.6
    },
    matters: {
      active: 47,
      new_this_month: 8,
    },
    time: {
      billable_hours: 342,
      utilization_rate: 81.4,
    },
    clients: {
      total: 89,
      new_this_month: 6,
    }
  };

  const displayMetrics = metrics || mockMetrics;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const revenueData = [
    { month: 'Jan', revenue: 95000, target: 100000 },
    { month: 'Feb', revenue: 102000, target: 100000 },
    { month: 'Mar', revenue: 118000, target: 110000 },
    { month: 'Apr', revenue: 110000, target: 110000 },
    { month: 'May', revenue: 125000, target: 120000 }
  ];

  const mattersByStatus = [
    { name: 'Active', value: 47, color: CHART_COLORS.primary },
    { name: 'Pending', value: 12, color: CHART_COLORS.warning },
    { name: 'On Hold', value: 5, color: CHART_COLORS.muted },
  ];

  return (
    <div className="container-page space-y-8 animate-fade-in pb-12">
      {/* Premium Header */}
      <DashboardHeader
        userName="Harris"
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onExport={() => console.log('Export')}
      />

      {/* Key Metrics Grid - Premium Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : (
          <>
            <MetricCardPremium
              title="Revenue This Month"
              value={formatCurrency(displayMetrics.revenue.current_month)}
              subtitle={`Target: ${formatCurrency(120000)}`}
              change={displayMetrics.revenue.trend}
              changeLabel="from last month"
              icon={DollarSign}
              variant="default"
              trend={displayMetrics.revenue.trend > 0 ? "up" : "down"}
            />
            
            <MetricCardPremium
              title="Active Matters"
              value={displayMetrics.matters.active}
              subtitle={`${displayMetrics.matters.new_this_month} new this month`}
              change={displayMetrics.matters.new_this_month}
              changeLabel="new matters"
              icon={Briefcase}
              variant="success"
              trend="up"
            />
            
            <MetricCardPremium
              title="Utilization Rate"
              value={`${displayMetrics.time.utilization_rate}%`}
              subtitle={`${displayMetrics.time.billable_hours}h billable`}
              change={2.3}
              changeLabel="vs last month"
              icon={Clock}
              variant="purple"
              trend="up"
            />
            
            <MetricCardPremium
              title="Outstanding"
              value={formatCurrency(displayMetrics.revenue.outstanding)}
              subtitle="Awaiting payment"
              change={-5.2}
              changeLabel="improvement"
              icon={AlertCircle}
              variant="warning"
              trend="up"
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Trend - Larger */}
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-h4">Revenue Trend</CardTitle>
                <CardDescription className="mt-1.5 text-body-sm">
                  Monthly performance vs target
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Revenue</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-gray-300" />
                  <span className="text-muted-foreground">Target</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 13 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 13 }}
                  tickFormatter={(value) => `£${value / 1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="revenue" fill={CHART_COLORS.primary} radius={[8, 8, 0, 0]} />
                <Bar dataKey="target" fill="#e5e7eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Matters by Status - Donut */}
        <Card className="rounded-2xl border-0 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-h4">Matters Overview</CardTitle>
            <CardDescription className="mt-1.5 text-body-sm">
              By current status
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={mattersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {mattersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} matters`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              {mattersByStatus.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">
                    {item.name} <span className="font-semibold text-gray-900">({item.value})</span>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="rounded-2xl border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-h4">Recent Activity</CardTitle>
              <CardDescription className="mt-1.5 text-body-sm">
                Latest updates across your practice
              </CardDescription>
            </div>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <EmptyStatePremium
            icon={Activity}
            title="No recent activity"
            description="Activity from your team will appear here once you start using the platform."
            variant="muted"
            action={{
              label: "Create First Matter",
              onClick: () => window.location.href = '/cases',
              icon: Briefcase
            }}
            tips={[
              "Activity is tracked automatically as you work",
              "See who's working on what in real-time",
              "Filter by team member or matter"
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
