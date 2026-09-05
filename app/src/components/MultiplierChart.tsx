"use client";

import React, { useEffect, useRef, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useGame } from "@/lib/GameContext";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const MAX_POINTS = 120;

export default function MultiplierChart() {
  const { currentMultiplierBps, round } = useGame();
  const historyRef = useRef<number[]>([10_000]);
  const labelsRef = useRef<string[]>(["0s"]);
  const chartRef = useRef<ChartJS<"line"> | null>(null);

  const hasCrashed =
    round?.status === "Settled" || round?.status === "Resolving";
  const crashPoint = round?.crashPointBps ?? 0;

  useEffect(() => {
    const m = currentMultiplierBps;
    historyRef.current = [...historyRef.current.slice(-MAX_POINTS + 1), m];
    const len = historyRef.current.length;
    labelsRef.current = historyRef.current.map((_, i) =>
      i % 20 === 0 ? `${((len - (len - i)) * 10) / 1000}s` : ""
    );

    const chart = chartRef.current;
    if (!chart) return;
    chart.data.labels = labelsRef.current;
    chart.data.datasets[0].data = historyRef.current.map((v) => v / 100);
    chart.update("none");
  }, [currentMultiplierBps]);

  const color = hasCrashed
    ? "rgba(239, 68, 68, 0.9)"
    : currentMultiplierBps > 500_00 / 10
    ? "rgba(251, 146, 60, 0.9)"
    : "rgba(52, 211, 153, 0.9)";

  const data = useMemo(
    () => ({
      labels: labelsRef.current,
      datasets: [
        {
          label: "Multiplier",
          data: historyRef.current.map((v) => v / 100),
          borderColor: color,
          backgroundColor: color.replace("0.9", "0.1"),
          borderWidth: 3,
          pointRadius: 0,
          fill: true,
          tension: 0.4,
        },
      ],
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    scales: {
      x: { display: false },
      y: {
        min: 1,
        grid: { color: "rgba(255,255,255,0.04)" },
        ticks: {
          color: "rgba(255,255,255,0.4)",
          callback: (v: number | string) => `${Number(v).toFixed(2)}×`,
        },
      },
    },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
  };

  return (
    <div className="chart-container">
      <Line ref={chartRef} data={data} options={options as any} />
      {hasCrashed && crashPoint > 0 && (
        <div className="crash-label">
          💥 RUGGED at {(crashPoint / 100).toFixed(2)}×
        </div>
      )}
    </div>
  );
}
