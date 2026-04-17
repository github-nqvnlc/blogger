"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { useCreateDoc, useUpdateDoc } from "@/hooks";
import { Tag, TagFormValues } from "@/types/blogs";
import { showCrudError, showCrudSuccess } from "@/lib/crud-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";

interface TagFormProps {
  tag: Tag | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function TagForm({ tag, onSuccess, onCancel }: TagFormProps) {
  const isEditing = !!tag;
  const { t } = useLanguage();
  const copy = t.blogTags.form;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TagFormValues>({
    defaultValues: {
      tag_name: "",
      description: "",
      slug: "",
      is_active: true,
    },
  });

  const watchIsActive = watch("is_active");

  const { createDoc, loading: isCreating } = useCreateDoc<Tag>("tags");
  const { updateDoc, loading: isUpdating } = useUpdateDoc<Tag>("tags");
  const isLoading = isCreating || isUpdating;

  React.useEffect(() => {
    if (tag) {
      reset({
        tag_name: tag.tag_name ?? "",
        description: tag.description ?? "",
        slug: tag.slug ?? "",
        is_active: tag.is_active === 1,
      });
      return;
    }

    reset({
      tag_name: "",
      description: "",
      slug: "",
      is_active: true,
    });
  }, [tag, reset]);

  const onSubmit = async (values: TagFormValues) => {
    try {
      const payload = {
        tag_name: values.tag_name.trim(),
        description: values.description.trim(),
        slug: values.slug.trim(),
        is_active: values.is_active ? 1 : 0,
      };

      if (isEditing && tag) {
        await updateDoc(tag.name, payload);
        showCrudSuccess(
          copy.updateSuccess,
          `${copy.updateSuccessPrefix}: "${values.tag_name}"`,
        );
      } else {
        await createDoc(payload);
        showCrudSuccess(
          copy.createSuccess,
          `${copy.createSuccessPrefix}: "${values.tag_name}"`,
        );
      }

      onSuccess?.();
    } catch (err) {
      showCrudError(
        isEditing ? copy.updateFailure : copy.createFailure,
        err,
        copy.unknownError,
      );
    }
  };

  const generateSlug = () => {
    // eslint-disable-next-line react-hooks/incompatible-library
    const name = watch("tag_name");
    if (!name) return;
    setValue("slug", slugify(name), { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="tag_name">
          {copy.name} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="tag_name"
          placeholder={copy.namePlaceholder}
          {...register("tag_name", {
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
        {errors.tag_name && (
          <p className="text-sm text-destructive">{errors.tag_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="slug">{copy.slug}</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generateSlug}
            disabled={!watch("tag_name")}
            className="h-7 text-xs"
          >
            {copy.generateSlug}
          </Button>
        </div>
        <Input
          id="slug"
          placeholder={copy.slugPlaceholder}
          {...register("slug", {
            maxLength: {
              value: 140,
              message: copy.slugMax,
            },
            pattern: {
              value: /^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/,
              message: copy.slugPattern,
            },
            setValueAs: (value: string) => value?.trim().toLowerCase(),
          })}
        />
        {errors.slug && (
          <p className="text-sm text-destructive">{errors.slug.message}</p>
        )}
        <p className="text-xs text-muted-foreground">{copy.slugHelp}</p>
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
          <p className="text-sm text-destructive">
            {errors.description.message}
          </p>
        )}
        <p className="text-right text-xs text-muted-foreground">
          {(watch("description") ?? "").length}/500
        </p>
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
          onCheckedChange={(checked) => setValue("is_active", checked)}
        />
      </div>

      {!watchIsActive && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{copy.inactiveWarning}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-end gap-3 border-t pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          {copy.cancel}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Spinner className="mr-2 size-4" />}
          {isEditing ? copy.submitUpdate : copy.submitCreate}
        </Button>
      </div>
    </form>
  );
}
