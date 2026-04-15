'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  LayoutDashboard,
  Search,
  MessageSquare,
} from 'lucide-react';

export default function AdminNotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center size-20 rounded-full bg-muted">
              <span className="text-4xl font-bold text-muted-foreground">404</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Trang không tồn tại</h1>
          <p className="text-muted-foreground text-base">
            Trang bạn đang tìm kiếm trong khu vực quản trị không tồn tại hoặc đã bị di chuyển.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/admin">
              <LayoutDashboard className="size-4 mr-2" />
              Về Dashboard
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="size-4 mr-2" />
              Về trang chủ
            </Link>
          </Button>
        </div>

        <div className="border-t pt-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            Bạn có thể thử:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center justify-center gap-2">
              <Search className="size-3" />
              Truy cập từ menu sidebar
            </li>
            <li className="flex items-center justify-center gap-2">
              <ArrowLeft className="size-3" />
              Quay lại trang trước
            </li>
            <li className="flex items-center justify-center gap-2">
              <MessageSquare className="size-3" />
              Liên hệ hỗ trợ nếu vấn đề vẫn tiếp diễn
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
