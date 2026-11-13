"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

type Datum = { period: string; revenue: number };

export default function RevenueChart({ data }: { data: Datum[] }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `Rp ${ctx.parsed.y.toLocaleString("id-ID")}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v: any) => `Rp ${v}` },
      },
    },
  };

  return (
    <Bar
      data={{
        labels: data.map((d) => d.period),
        datasets: [
          {
            label: "Pendapatan (Rp)",
            data: data.map((d) => d.revenue),
            backgroundColor: "rgba(13, 110, 253, 0.7)",
            borderColor: "#0d6efd",
            borderWidth: 0,
            borderRadius: 6,
          },
        ],
      }}
      options={options as unknown as never}
    />
  );
}
