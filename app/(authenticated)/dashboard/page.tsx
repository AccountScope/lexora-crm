"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist";
import { 
  DollarSign, 
  FileText, 
  Clock, 
  AlertCircle,
  Briefcase,
  PiggyBank,
  Users,
  TrendingUp,
  Plus,
  Calendar,
  Download
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
  Tooltip as RechartsTooltip, 
  Legend, 
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
    by_status: { status: string; count: number }[];
    by_practice_area: { area: string; count: number }[];
  };
  time: {
    billable_hours: number;
    non_billable_hours: number;
    utilization_rate: number;
    top_billers: { name: string; hours: number }[];
  };
  trust: {
    total_balance: number;
    unallocated: number;
    recent_transactions: any[];
  };
  clients: {
    total: number;
    new_this_month: number;
    top_by_revenue: { name: string; revenue: number }[];
  };
}

const CHART_COLORS = {
  primary: "#3b82f6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  pink: "#ec4899",
};

export default function ExecutiveDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');

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
      // Simulate loading for demo
      setTimeout(() => setLoading(false), 800);
    }
  };

  // Mock data for development
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
      by_status: [
        { status: 'Active', count: 47 },
        { status: 'Pending', count: 12 },
        { status: 'On Hold', count: 5 },
        { status: 'Closed', count: 156 }
      ],
      by_practice_area: [
        { area: 'Corporate', count: 18 },
        { area: 'Litigation', count: 15 },
        { area: 'Real Estate', count: 10 },
        { area: 'Employment', count: 8 },
        { area: 'IP', count: 6 }
      ]
    },
    time: {
      billable_hours: 342,
      non_billable_hours: 78,
      utilization_rate: 81.4,
      top_billers: [
        { name: 'Sarah Johnson', hours: 85 },
        { name: 'Michael Chen', hours: 72 },
        { name: 'Emma Williams', hours: 68 },
        { name: 'James Brown', hours: 61 },
        { name: 'Lisa Anderson', hours: 56 }
      ]
    },
    trust: {
      total_balance: 450000,
      unallocated: 25000,
      recent_transactions: []
    },
    clients: {
      total: 89,
      new_this_month: 6,
      top_by_revenue: [
        { name: 'Acme Corp', revenue: 85000 },
        { name: 'TechStart Ltd', revenue: 67000 },
        { name: 'Global Industries', revenue: 54000 },
        { name: 'Finance Group', revenue: 48000 },
        { name: 'Property Partners', revenue: 42000 }
      ]
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

  const [showTour, setShowTour] = useState(false);

  return (
    <>
      <OnboardingModal />
      {showTour && <OnboardingTour onComplete={() => setShowTour(false)} onSkip={() => setShowTour(false)} />}
      
      <div className="space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's what's happening with your firm.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="quarter">Quarter</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Welcome Card (only show for new users) */}
        <WelcomeCard />

        {/* Onboarding Checklist */}
        <OnboardingChecklist />

        {/* Key Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Revenue This Month"
            value={formatCurrency(displayMetrics.revenue.current_month)}
            change={displayMetrics.revenue.trend}
            changeLabel="from last month"
            icon={DollarSign}
            variant="default"
            trend={displayMetrics.revenue.trend > 0 ? "up" : "down"}
            loading={loading}
          />
          
          <MetricCard
            title="Active Matters"
            value={displayMetrics.matters.active}
            change={displayMetrics.matters.new_this_month}
            changeLabel="new this month"
            icon={Briefcase}
            variant="success"
            trend="up"
            loading={loading}
          />
          
          <MetricCard
            title="Utilization Rate"
            value={`${displayMetrics.time.utilization_rate}%`}
            change={2.3}
            changeLabel="vs last month"
            icon={Clock}
            variant="warning"
            trend="up"
            loading={loading}
          />
          
          <MetricCard
            title="Outstanding"
            value={formatCurrency(displayMetrics.revenue.outstanding)}
            change={-5.2}
            changeLabel="from last week"
            icon={AlertCircle}
            variant="danger"
            trend="down"
            loading={loading}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Revenue Trend Chart - Larger */}
          <Card className="col-span-full lg:col-span-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue Trend</CardTitle>
                  <CardDescription className="mt-1.5">
                    Monthly revenue vs target over time
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Customize
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[350px] rounded-lg bg-muted animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `£${(value / 1000).toFixed(0)}k`}
                    />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any) => [formatCurrency(value), '']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke={CHART_COLORS.primary}
                      strokeWidth={3}
                      name="Actual Revenue"
                      dot={{ fill: CHART_COLORS.primary, r: 4 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="target" 
                      stroke={CHART_COLORS.success}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Matters by Status Pie Chart */}
          <Card className="col-span-full lg:col-span-3">
            <CardHeader>
              <CardTitle>Matters by Status</CardTitle>
              <CardDescription className="mt-1.5">
                Current matter distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[350px] rounded-lg bg-muted animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={displayMetrics.matters.by_status}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.status}: ${entry.count}`}
                      outerRadius={110}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {displayMetrics.matters.by_status.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={Object.values(CHART_COLORS)[index % Object.values(CHART_COLORS).length]} 
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Billers */}
          <Card className="col-span-full lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Top Billers</CardTitle>
              <CardDescription>
                Highest billable hours this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="h-10 w-2/3 rounded bg-muted animate-pulse" />
                      <div className="h-6 w-12 rounded bg-muted animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {displayMetrics.time.top_billers.map((biller, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                          {index + 1}
                        </div>
                        <span className="font-medium">{biller.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-muted-foreground">
                        {biller.hours}h
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Practice Areas Chart */}
          <Card className="col-span-full lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Practice Areas</CardTitle>
              <CardDescription>
                Matters by practice area
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[280px] rounded-lg bg-muted animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={displayMetrics.matters.by_practice_area} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis dataKey="area" type="category" fontSize={12} width={80} />
                    <RechartsTooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <ActivityFeed loading={loading} />
        </div>

        {/* Trust Account Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Trust Account Summary</CardTitle>
            <CardDescription className="mt-1.5">
              Current trust account balances and client overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex items-center gap-4 rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-sm">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-success/10">
                  <PiggyBank className="h-7 w-7 text-success" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatCurrency(displayMetrics.trust.total_balance)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 rounded-lg border p-4 transition-all hover:border-warning/50 hover:shadow-sm">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-warning/10">
                  <AlertCircle className="h-7 w-7 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unallocated</p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatCurrency(displayMetrics.trust.unallocated)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-sm">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                  <p className="mt-1 text-2xl font-bold">{displayMetrics.clients.total}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    +{displayMetrics.clients.new_this_month} this month
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
