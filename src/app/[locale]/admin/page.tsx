"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Newspaper, MessageSquare, Tags, Eye, } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

export default function AdminDashboardPage() {
  const { t } = useLanguage();

  const stats = [
    {
      title: t.admin.stats.totalPosts,
      value: "24",
      description: t.admin.stats.totalPostsDescription,
      icon: Newspaper,
    },
    {
      title: t.admin.stats.comments,
      value: "156",
      description: t.admin.stats.commentsDescription,
      icon: MessageSquare,
    },
    {
      title: t.admin.stats.views,
      value: "12.5K",
      description: t.admin.stats.viewsDescription,
      icon: Eye,
    },
    {
      title: t.admin.stats.topics,
      value: "8",
      description: t.admin.stats.topicsDescription,
      icon: Tags,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t.admin.dashboardTitle}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t.admin.dashboardDescription}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.admin.recentPostsTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t.admin.recentPostsEmpty}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.admin.activityTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {t.admin.activityEmpty}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
