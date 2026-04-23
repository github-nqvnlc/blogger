"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
import { formatDate } from "@/helper/format-time";

type PostPoint = {
  date: string;
  count: number;
};

type PostsTrendLineChartProps = {
  unit?: "day" | "week" | "month";
  points?: PostPoint[];
};

export function LineChart({ unit, points }: PostsTrendLineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const container = chartRef.current;
    const chart = echarts.init(container);

    const lineChartOption: echarts.EChartsOption = {
      tooltip: {
        trigger: "axis",
        valueFormatter: value => `${value ?? 0} posts`,
      },
      grid: {
        left: 24,
        right: 16,
        top: 20,
        bottom: 24,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: points?.map(point => formatDate(point.date, unit)) ?? [],
        axisLine: { lineStyle: { color: "#d4d4d8" } },
        axisLabel: { color: "#71717a" },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLine: { show: false },
        splitLine: { lineStyle: { color: "#e4e4e7" } },
        axisLabel: { color: "#71717a" },
      },
      series: [
        {
          name: "Posts",
          type: "line",
          smooth: true,
          data: points?.map(point => point.count) ?? [],
          symbol: "circle",
          symbolSize: 8,
          lineStyle: {
            width: 3,
            color: "oklch(0.6487 0.1538 150.3071)",
          },
          itemStyle: {
            color: "oklch(0.6487 0.1538 150.3071)",
            borderColor: "#ffffff",
            borderWidth: 2,
          },
          areaStyle: {
            color: "#ffffff",
          },
        },
      ],
    };

    chart.setOption(lineChartOption);
    chart.resize();

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(() => chart.resize());
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [points, unit]);

  return <div ref={chartRef} className="h-80 w-full" />;
}
