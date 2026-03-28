"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line, Pie } from "react-chartjs-2";
import type { ReportChartConfig } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend);

const palette = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

interface ReportChartProps {
  chart?: ReportChartConfig;
}

export const ReportChart = ({ chart }: ReportChartProps) => {
  if (!chart || !chart.labels.length || !chart.datasets.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Run a preview with grouping enabled to unlock charts.</p>
        </CardContent>
      </Card>
    );
  }

  const data = {
    labels: chart.labels,
    datasets: chart.datasets.map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: palette[index % palette.length],
      borderColor: palette[index % palette.length],
      borderWidth: 1,
      fill: chart.type === "line",
    })),
  };

  const commonOptions = {
    responsive: true,
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed?.y ?? context.raw;
            if (chart.prefix) return `${chart.prefix}${value}`;
            if (chart.suffix) return `${value}${chart.suffix}`;
            return value;
          },
        },
      },
    },
  };

  let renderedChart: JSX.Element;
  if (chart.type === "pie") {
    renderedChart = <Pie data={data} />;
  } else if (chart.type === "line") {
    renderedChart = <Line data={data} options={commonOptions} />;
  } else {
    renderedChart = <Bar data={data} options={commonOptions} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visualization</CardTitle>
      </CardHeader>
      <CardContent>{renderedChart}</CardContent>
    </Card>
  );
};
