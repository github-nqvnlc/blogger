'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Home,
  Search,
  MessageSquare,
} from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[100vh] items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="space-y-3">
          <div className="flex justify-center">
            <div className="inline-flex items-center justify-center size-20 rounded-full bg-muted">
              <span className="text-4xl font-bold text-muted-foreground">404</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Trang không tồn tại</h1>
          <p className="text-muted-foreground text-base">
            Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không khả dụng.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="size-4 mr-2" />
              Về trang chủ
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin">
              <ArrowLeft className="size-4 mr-2" />
              Về trang quản trị
            </Link>
          </Button>
        </div>

        <div className="border-t pt-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            Nếu bạn nghĩ đây là lỗi, hãy thử:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center justify-center gap-2">
              <Search className="size-3" />
              Kiểm tra lại URL
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
