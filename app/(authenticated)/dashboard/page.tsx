"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/ui/page-header";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import { OnboardingModal } from "@/components/onboarding/onboarding-modal";
import { 
  DollarSign, 
  FileText, 
  Clock, 
  Users, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Briefcase,
  PiggyBank,
  Loader2
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
  Legend, 
  ResponsiveContainer 
} from "recharts";

interface DashboardMetrics {
  revenue: {
    current_month: number;
    last_month: number;
    year_to_date: number;
    outstanding: number;
    trend: number; // percentage change
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
      setLoading(false);
    }
  };

  // Mock data for development (remove when API is ready)
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

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        
        {/* Skeleton KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-24 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-full bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const revenueData = [
    { month: 'Jan', revenue: 95000 },
    { month: 'Feb', revenue: 102000 },
    { month: 'Mar', revenue: 118000 },
    { month: 'Apr', revenue: 110000 },
    { month: 'May', revenue: 125000 }
  ];

  return (
    <>
      <OnboardingModal />
      
      <div className="space-y-6">
        <PageHeader
          title="Executive Dashboard"
          description="Real-time insights into your firm's performance"
          action={
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
              <TabsList>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="quarter">Quarter</TabsTrigger>
                <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
          }
        />

        {/* Welcome Card */}
        <WelcomeCard />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (This Month)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(displayMetrics.revenue.current_month)}
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {displayMetrics.revenue.trend > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                  <span className="text-green-500">+{displayMetrics.revenue.trend}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3 text-red-500 mr-1" />
                  <span className="text-red-500">{displayMetrics.revenue.trend}%</span>
                </>
              )}
              <span className="ml-1">from last month</span>
            </p>
          </CardContent>
        </Card>

        {/* Active Matters Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Matters</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayMetrics.matters.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{displayMetrics.matters.new_this_month} new this month
            </p>
          </CardContent>
        </Card>

        {/* Utilization Rate Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayMetrics.time.utilization_rate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {displayMetrics.time.billable_hours} billable hours
            </p>
          </CardContent>
        </Card>

        {/* Outstanding Invoices Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(displayMetrics.revenue.outstanding)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Matters by Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Matters by Status</CardTitle>
            <CardDescription>Current matter distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={displayMetrics.matters.by_status}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.status}: ${entry.count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {displayMetrics.matters.by_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Billers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Billers</CardTitle>
            <CardDescription>Highest billable hours this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayMetrics.time.top_billers.map((biller, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <span className="font-medium">{biller.name}</span>
                  </div>
                  <span className="text-muted-foreground">{biller.hours}h</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Practice Areas */}
        <Card>
          <CardHeader>
            <CardTitle>Matters by Practice Area</CardTitle>
            <CardDescription>Current matter distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={displayMetrics.matters.by_practice_area}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="area" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card>
          <CardHeader>
            <CardTitle>Top Clients</CardTitle>
            <CardDescription>By revenue this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {displayMetrics.clients.top_by_revenue.map((client, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium">{client.name}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(client.revenue)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trust Account Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Trust Account Summary</CardTitle>
          <CardDescription>Current trust account balances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <PiggyBank className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(displayMetrics.trust.total_balance)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unallocated</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(displayMetrics.trust.unallocated)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clients</p>
                <p className="text-2xl font-bold">{displayMetrics.clients.total}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
