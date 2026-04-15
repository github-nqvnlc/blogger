'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCreateDoc, useUpdateDoc } from '@/hooks';
import { BlogDepartment, DepartmentFormValues } from '@/types/blogs';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { AlertCircle } from 'lucide-react';

/** Props cho DepartmentForm */
interface DepartmentFormProps {
  /** Department đang chỉnh sửa. Null = tạo mới */
  department: BlogDepartment | null;
  /** Callback khi form thành công */
  onSuccess?: () => void;
  /** Callback khi cancel */
  onCancel?: () => void;
}

export function DepartmentForm({ department, onSuccess, onCancel }: DepartmentFormProps) {
  const isEditing = !!department;

  // ─── Form Setup ────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    defaultValues: {
      department_name: '',
      department_code: '',
      description: '',
      is_active: true,
      sort_order: 0,
    },
  });

  // Watch values for controlled inputs
  const watchIsActive = watch('is_active');

  // ─── Mutations ─────────────────────────────────────────────
  const { createDoc, loading: isCreating } = useCreateDoc<BlogDepartment>('blog_departments');
  const { updateDoc, loading: isUpdating } = useUpdateDoc<BlogDepartment>('blog_departments');

  const isLoading = isCreating || isUpdating;

  // ─── Load Data khi Edit ────────────────────────────────────
  useEffect(() => {
    if (department) {
      reset({
        department_name: department.department_name ?? '',
        department_code: department.department_code ?? '',
        description: department.description ?? '',
        is_active: department.is_active === 1,
        sort_order: department.sort_order ?? 0,
      });
    } else {
      reset({
        department_name: '',
        department_code: '',
        description: '',
        is_active: true,
        sort_order: 0,
      });
    }
  }, [department, reset]);

  // ─── Submit Handler ────────────────────────────────────────
  const onSubmit = async (values: DepartmentFormValues) => {
    try {
      const payload = {
        department_name: values.department_name.trim(),
        department_code: values.department_code.trim().toUpperCase(),
        description: values.description.trim(),
        is_active: values.is_active ? 1 : 0,
        sort_order: Number(values.sort_order) || 0,
      };

      if (isEditing && department) {
        await updateDoc(department.name, payload);
        toast.success('Cập nhật thành công', {
          description: `Đã cập nhật bộ phận nội dung: "${values.department_name}"`,
        });
      } else {
        await createDoc(payload);
        toast.success('Tạo mới thành công', {
          description: `Đã tạo bộ phận nội dung: "${values.department_name}"`,
        });
      }

      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định';
      toast.error(isEditing ? 'Cập nhật thất bại' : 'Tạo mới thất bại', {
        description: message,
      });
    }
  };

  // ─── Validation Helpers ────────────────────────────────────

  /** Generate department_code from department_name */
  const generateCode = () => {
    const name = watch('department_name');
    if (!name) return;
    const code = name
      .trim()
      .toUpperCase()
      .replace(/[^\w\s\u00C0-\u024F]/g, '') // loại bỏ ký tự đặc biệt
      .split(/\s+/)
      .map(word => word.charAt(0))
      .join('')
      .slice(0, 10);
    setValue('department_code', code);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ─── Department Name ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="department_name">
            Tên bộ phận nội dung <span className="text-destructive">*</span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateCode}
            disabled={!watch('department_name')}
            className="h-7 text-xs"
          >
            Tự động tạo mã
          </Button>
        </div>
        <Input
          id="department_name"
          placeholder="Công nghệ thông tin"
          {...register('department_name', {
            required: 'Tên bộ phận nội dung là bắt buộc',
            minLength: {
              value: 2,
              message: 'Tên bộ phận nội dung phải có ít nhất 2 ký tự',
            },
            maxLength: {
              value: 100,
              message: 'Tên bộ phận nội dung không được vượt quá 100 ký tự',
            },
          })}
        />
        {errors.department_name && (
          <p className="text-sm text-destructive">{errors.department_name.message}</p>
        )}
      </div>

      {/* ─── Department Code ─── */}
      <div className="space-y-2">
        <Label htmlFor="department_code">
          Mã bộ phận <span className="text-destructive">*</span>
        </Label>
        <Input
          id="department_code"
          placeholder="Ví dụ: CNTT, HCTH, KHTC"
          className="uppercase"
          maxLength={10}
          {...register('department_code', {
            required: 'Mã bộ phận nội dung là bắt buộc',
            minLength: {
              value: 2,
              message: 'Mã bộ phận nội dung phải có ít nhất 2 ký tự',
            },
            maxLength: {
              value: 10,
              message: 'Mã bộ phận nội dung không được vượt quá 10 ký tự',
            },
            pattern: {
              value: /^[A-Z0-9_]+$/,
              message: 'Mã bộ phận nội dung chỉ được chứa chữ hoa, số và dấu gạch dưới',
            },
            setValueAs: v => v?.toUpperCase(),
          })}
        />
        {errors.department_code && (
          <p className="text-sm text-destructive">{errors.department_code.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Mã bộ phận nội dung phải là duy nhất, viết HOA, không dấu. Ví dụ: CNTT, HCTH, KHTC.
        </p>
      </div>

      {/* ─── Description ─── */}
      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          placeholder="Mô tả ngắn về department (tối đa 500 ký tự)"
          rows={3}
          {...register('description', {
            maxLength: {
              value: 500,
              message: 'Mô tả không được vượt quá 500 ký tự',
            },
          })}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
        <p className="text-xs text-muted-foreground text-right">
          {(watch('description') ?? '').length}/500
        </p>
      </div>

      {/* ─── Sort Order ─── */}
      <div className="space-y-2">
        <Label htmlFor="sort_order">Thứ tự ưu tiên</Label>
        <Input
          id="sort_order"
          type="number"
          min={0}
          max={9999}
          {...register('sort_order', {
            valueAsNumber: true,
            min: {
              value: 0,
              message: 'Thứ tự phải lớn hơn hoặc bằng 0',
            },
            max: {
              value: 9999,
              message: 'Thứ tự không được vượt quá 9999',
            },
          })}
        />
        {errors.sort_order && (
          <p className="text-sm text-destructive">{errors.sort_order.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Số nhỏ hơn sẽ hiển thị trước. Mặc định: 0
        </p>
      </div>

      {/* ─── Active Status ─── */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="is_active" className="cursor-pointer">
            Trạng thái hoạt động
          </Label>
          <p className="text-sm text-muted-foreground">
            {watchIsActive
              ? 'Department có thể được sử dụng trong bài viết'
              : 'Department bị vô hiệu hóa và không hiển thị'}
          </p>
        </div>
        <Switch
          id="is_active"
          checked={watchIsActive}
          onCheckedChange={checked => setValue('is_active', checked)}
        />
      </div>

      {/* ─── Warnings ─── */}
      {!watchIsActive && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Department đang bị vô hiệu hóa. Bài viết sử dụng department này vẫn hoạt động
            bình thường nhưng department sẽ không xuất hiện trong danh sách chọn.
          </AlertDescription>
        </Alert>
      )}

      {/* ─── Form Actions ─── */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Spinner className="size-4 mr-2" />}
          {isEditing ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
}
