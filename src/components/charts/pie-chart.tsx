"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

type DepartmentPostCountItem = {
  department_name: string;
  count: number;
};

type PostsDepartmentPieChartProps = {
  data?: DepartmentPostCountItem[];
};

export function PieChart({ data }: PostsDepartmentPieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const container = chartRef.current;
    const pieChart = echarts.init(container);
    const pieOption: echarts.EChartsOption = {
      tooltip: {
        trigger: "item",
        formatter: "{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        right: 0,
        top: "middle",
        textStyle: { color: "#71717a" },
      },
      series: [
        {
          name: "Posts",
          type: "pie",
          radius: ["45%", "72%"],
          center: ["35%", "50%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderColor: "#ffffff",
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              formatter: "{b}\n{c} posts",
              fontWeight: 600,
            },
          },
          data:
            data?.map(item => ({
              name: item.department_name,
              value: item.count,
            })) ?? [],
        },
      ],
    };

    pieChart.setOption(pieOption);
    pieChart.resize();
    const handleResize = () => pieChart.resize();
    window.addEventListener("resize", handleResize);
    const resizeObserver = new ResizeObserver(() => pieChart.resize());
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      pieChart.dispose();
    };
  }, [data]);

  return <div ref={chartRef} className="h-80 w-full" />;
}
