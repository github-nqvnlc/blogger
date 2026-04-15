'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Newspaper, MessageSquare, Tags, Eye } from 'lucide-react';

const STATS = [
  {
    title: 'Tổng bài viết',
    value: '24',
    description: 'Tăng 12% so với tháng trước',
    icon: Newspaper,
  },
  {
    title: 'Bình luận',
    value: '156',
    description: '15 bình luận chưa duyệt',
    icon: MessageSquare,
  },
  {
    title: 'Lượt xem',
    value: '12.5K',
    description: 'Tăng 8% so với tuần trước',
    icon: Eye,
  },
  {
    title: 'Chủ đề',
    value: '8',
    description: 'Hoạt động',
    icon: Tags,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tổng quan</h1>
        <p className="text-muted-foreground mt-1">
          Chào mừng bạn đến với trang quản trị blog
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STATS.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
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
            <CardTitle>Bài viết gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Chưa có bài viết nào được xuất bản gần đây.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Không có hoạt động nào được ghi nhận.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
