"use client";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardAnalyticsPayload } from "@/lib/api/analytics";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const palette = ["#312e81", "#4338ca", "#6366f1", "#a5b4fc", "#c7d2fe", "#34d399", "#fbbf24"];

interface Props {
  data?: DashboardAnalyticsPayload["charts"];
  isLoading?: boolean;
}

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        usePointStyle: true,
      },
    },
    tooltip: {
      backgroundColor: "#0f172a",
      bodyColor: "#f8fafc",
      titleColor: "#cbd5f5",
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: "#94a3b8" },
    },
    y: {
      grid: { color: "rgba(148,163,184,0.2)" },
      ticks: { color: "#94a3b8" },
    },
  },
};

export const DashboardCharts = ({ data, isLoading }: Props) => {
  const caseLabels = data?.casesByStatus?.labels ?? [];
  const caseValues = data?.casesByStatus?.values ?? [];
  const caseColors = caseValues.length
    ? caseValues.map((_, index) => palette[index % palette.length])
    : palette;

  const revenueLabels = data?.monthlyRevenue?.labels ?? [];
  const revenueValues = data?.monthlyRevenue?.values ?? [];

  const lawyerLabels = data?.timeByLawyer?.labels ?? [];
  const lawyerValues = data?.timeByLawyer?.values ?? [];

  const timelineLabels = data?.caseTimeline?.labels ?? [];
  const timelineValues = data?.caseTimeline?.values ?? [];

  const casesByStatusData = {
    labels: caseLabels,
    datasets: [
      {
        data: caseValues,
        backgroundColor: caseColors,
        borderWidth: 0,
      },
    ],
  };

  const monthlyRevenueData = {
    labels: revenueLabels,
    datasets: [
      {
        label: "Monthly revenue",
        data: revenueValues,
        backgroundColor: "rgba(79, 70, 229, 0.6)",
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const timeByLawyerData = {
    labels: lawyerLabels,
    datasets: [
      {
        label: "Hours logged",
        data: lawyerValues,
        backgroundColor: "rgba(45, 212, 191, 0.6)",
        borderRadius: 6,
        maxBarThickness: 32,
      },
    ],
  };

  const caseTimelineData = {
    labels: timelineLabels,
    datasets: [
      {
        label: "New cases",
        data: timelineValues,
        borderColor: "#f97316",
        backgroundColor: "rgba(249, 115, 22, 0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
      },
    ],
  };

  const loadingState = isLoading || !data;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Cases by status</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {loadingState ? <Skeleton className="h-full w-full" /> : <Doughnut data={casesByStatusData} />}
        </CardContent>
      </Card>
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Monthly revenue</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {loadingState ? <Skeleton className="h-full w-full" /> : <Bar options={baseOptions} data={monthlyRevenueData} />}
        </CardContent>
      </Card>
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Time logged by lawyer</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {loadingState ? <Skeleton className="h-full w-full" /> : <Bar options={baseOptions} data={timeByLawyerData} />}
        </CardContent>
      </Card>
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Case timeline</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {loadingState ? <Skeleton className="h-full w-full" /> : <Line options={baseOptions} data={caseTimelineData} />}
        </CardContent>
      </Card>
    </div>
  );
};
