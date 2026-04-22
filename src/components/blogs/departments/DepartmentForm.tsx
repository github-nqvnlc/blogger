"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useCreateDoc, useUpdateDoc } from "@/hooks";
import { BlogDepartment, DepartmentFormValues } from "@/types/blogs";
import { showCrudError, showCrudSuccess } from "@/lib/crud-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

interface DepartmentFormProps {
  department: BlogDepartment | null;
  onSuccess?: (department: BlogDepartment) => void;
  onCancel?: () => void;
}

export function DepartmentForm({ department, onSuccess, onCancel }: DepartmentFormProps) {
  const isEditing = !!department;
  const { t } = useLanguage();
  const copy = t.blogDepartments.form;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    defaultValues: {
      department_name: "",
      department_code: "",
      description: "",
      is_active: true,
      sort_order: 0,
    },
  });

  const watchIsActive = watch("is_active");

  const { createDoc, loading: isCreating } = useCreateDoc<BlogDepartment>("blog_departments");
  const { updateDoc, loading: isUpdating } = useUpdateDoc<BlogDepartment>("blog_departments");
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (department) {
      reset({
        department_name: department.department_name ?? "",
        department_code: department.department_code ?? "",
        description: department.description ?? "",
        is_active: department.is_active === 1,
        sort_order: department.sort_order ?? 0,
      });
    } else {
      reset({
        department_name: "",
        department_code: "",
        description: "",
        is_active: true,
        sort_order: 0,
      });
    }
  }, [department, reset]);

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
        const updatedDepartment = await updateDoc(department.name, payload);
        showCrudSuccess(
          copy.updateSuccess,
          `${copy.updateSuccessPrefix}: "${values.department_name}"`
        );
        onSuccess?.(updatedDepartment);
      } else {
        const createdDepartment = await createDoc(payload);
        showCrudSuccess(
          copy.createSuccess,
          `${copy.createSuccessPrefix}: "${values.department_name}"`
        );
        onSuccess?.(createdDepartment);
      }
    } catch (err) {
      showCrudError(isEditing ? copy.updateFailure : copy.createFailure, err, copy.unknownError);
    }
  };

  const generateCode = () => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const name = watch("department_name");
    if (!name) return;
    const code = name
      .trim()
      .toUpperCase()
      .replace(/[^\w\s\u00C0-\u024F]/g, "")
      .split(/\s+/)
      .map(word => word.charAt(0))
      .join("")
      .slice(0, 10);
    setValue("department_code", code);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="department_name">
            {copy.name} <span className="text-destructive">*</span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateCode}
            disabled={!watch("department_name")}
            className="h-7 text-xs"
          >
            {copy.generateCode}
          </Button>
        </div>
        <Input
          id="department_name"
          placeholder={copy.namePlaceholder}
          {...register("department_name", {
            required: copy.nameRequired,
            minLength: {
              value: 2,
              message: copy.nameMin,
            },
            maxLength: {
              value: 100,
              message: copy.nameMax,
            },
          })}
        />
        {errors.department_name && (
          <p className="text-sm text-destructive">{errors.department_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="department_code">
          {copy.code} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="department_code"
          placeholder={copy.codePlaceholder}
          className="uppercase"
          maxLength={10}
          {...register("department_code", {
            required: copy.codeRequired,
            minLength: {
              value: 2,
              message: copy.codeMin,
            },
            maxLength: {
              value: 10,
              message: copy.codeMax,
            },
            pattern: {
              value: /^[A-Z0-9_]+$/,
              message: copy.codePattern,
            },
            setValueAs: v => v?.toUpperCase(),
          })}
        />
        {errors.department_code && (
          <p className="text-sm text-destructive">{errors.department_code.message}</p>
        )}
        <p className="text-xs text-muted-foreground">{copy.codeHelp}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{copy.description}</Label>
        <Textarea
          id="description"
          placeholder={copy.descriptionPlaceholder}
          rows={3}
          {...register("description", {
            maxLength: {
              value: 500,
              message: copy.descriptionMax,
            },
          })}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
        <p className="text-xs text-muted-foreground text-right">
          {(watch("description") ?? "").length}/500
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort_order">{copy.sortOrder}</Label>
        <Input
          id="sort_order"
          type="number"
          min={0}
          max={9999}
          {...register("sort_order", {
            valueAsNumber: true,
            min: {
              value: 0,
              message: copy.sortOrderMin,
            },
            max: {
              value: 9999,
              message: copy.sortOrderMax,
            },
          })}
        />
        {errors.sort_order && (
          <p className="text-sm text-destructive">{errors.sort_order.message}</p>
        )}
        <p className="text-xs text-muted-foreground">{copy.sortOrderHelp}</p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label htmlFor="is_active" className="cursor-pointer">
            {copy.activeStatus}
          </Label>
          <p className="text-sm text-muted-foreground">
            {watchIsActive ? copy.activeDescription : copy.inactiveDescription}
          </p>
        </div>
        <Switch
          id="is_active"
          checked={watchIsActive}
          onCheckedChange={checked => setValue("is_active", checked)}
        />
      </div>

      {!watchIsActive && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{copy.inactiveWarning}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {copy.cancel}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Spinner className="size-4 mr-2" />}
          {isEditing ? copy.submitUpdate : copy.submitCreate}
        </Button>
      </div>
    </form>
  );
}
