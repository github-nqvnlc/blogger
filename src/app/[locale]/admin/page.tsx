"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Tags, FileText, MessageSquare, Eye, Lightbulb, FolderOpen } from "lucide-react";
import { useGetMethod } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { useState } from "react";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format, startOfMonth } from "date-fns";
import { LineChart } from "@/components/charts/line-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { formatDate } from "@/helper/format-time";

type MasterCounts = {
  blog_departments: number;
  categories: number;
  topics: number;
  tags: number;
  posts: number;
  comments: number;
  view_count: number;
};

type PostCreationChartData = {
  period: string;
  unit: "day" | "week" | "month";
  from_date: string;
  to_date: string;
  total: number;
  points: Array<{ date: string; count: number }>;
};

type DepartmentPostCountItem = {
  department: string;
  department_name: string;
  count: number;
};

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const dateFilterParams =
    dateRange?.from && dateRange?.to
      ? {
          start_date: format(dateRange.from, "yyyy-MM-dd"),
          end_date: format(dateRange.to, "yyyy-MM-dd"),
        }
      : undefined;

  const { data: counts } = useGetMethod<MasterCounts>("get_master_counts", dateFilterParams);
  const { data: chartData, isLoading: isChartLoading } = useGetMethod<PostCreationChartData>(
    "get_post_creation_chart",
    dateFilterParams
  );
  const { data: departmentPostCounts, isLoading: isDepartmentChartLoading } = useGetMethod<
    DepartmentPostCountItem[]
  >("get_post_count_by_department", dateFilterParams);
  const selectedTrendData = chartData;

  const stats = [
    {
      title: t.admin.breadcrumbs["blog-departments"],
      value: String(counts?.blog_departments ?? 0),
      icon: Building2,
    },
    {
      title: t.admin.breadcrumbs.categories,
      value: String(counts?.categories ?? 0),
      icon: FolderOpen,
    },
    {
      title: t.admin.breadcrumbs.topics,
      value: String(counts?.topics ?? 0),
      icon: Lightbulb,
    },
    {
      title: t.admin.breadcrumbs.tags,
      value: String(counts?.tags ?? 0),
      icon: Tags,
    },
    {
      title: t.admin.breadcrumbs.posts,
      value: String(counts?.posts ?? 0),
      icon: FileText,
    },
    {
      title: t.admin.breadcrumbs.comments,
      value: String(counts?.comments ?? 0),
      icon: MessageSquare,
    },
    {
      title: t.admin.stats.views,
      value: String(counts?.view_count ?? 0),
      icon: Eye,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.admin.dashboardTitle}</h1>
          <p className="text-muted-foreground mt-1">{t.admin.dashboardDescription}</p>
        </div>
        <DatePickerWithRange value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(stat => (
          <Card
            key={stat.title}
            className="group relative overflow-hidden border-border/60 bg-linear-to-br from-background to-muted/30 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="rounded-lg border border-border/60 bg-background/80 p-2 backdrop-blur-sm transition-colors group-hover:bg-primary/10">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid w-full gap-4 md:grid-cols-2">
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Posts trend</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{`Range: ${formatDate(dateFilterParams?.start_date ?? "-")} -> ${formatDate(dateFilterParams?.end_date ?? "-")}`}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                Total: {isChartLoading ? "..." : (selectedTrendData?.total ?? 0)}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <LineChart unit={selectedTrendData?.unit} points={selectedTrendData?.points} />
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Posts by department</CardTitle>
            <p className="text-sm text-muted-foreground">
              {isDepartmentChartLoading
                ? "Loading..."
                : `Distribution of posts across departments (${formatDate(dateFilterParams?.start_date ?? "-")} -> ${formatDate(dateFilterParams?.end_date ?? "-")})`}
            </p>
          </CardHeader>
          <CardContent>
            <PieChart data={departmentPostCounts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
