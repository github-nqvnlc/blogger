"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { useCreateDoc, useGetDoc, useGetList, useUpdateDoc } from "@/hooks";
import { useAuth } from "@/hooks/useAuth";
import { BlogDepartment, Topic, TopicFormValues } from "@/types/blogs";
import { DepartmentForm } from "@/components/blogs/departments/DepartmentForm";
import { showCrudError, showCrudSuccess } from "@/lib/crud-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/hooks/useLanguage";
import { cn } from "@/lib/utils";
import { Filter } from "@/types/hooks";

interface TopicFormProps {
  topic: Topic | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface UserRole {
  role: string;
}

interface UserWithRoles {
  roles?: UserRole[];
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

export function TopicForm({ topic, onSuccess, onCancel }: TopicFormProps) {
  const isEditing = !!topic;
  const { currentUser } = useAuth();
  const { t } = useLanguage();
  const copy = t.blogTopics.form;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TopicFormValues>({
    defaultValues: {
      topic: "",
      department: "",
      desc: "",
      slug: "",
      is_active: true,
    },
  });

  const watchIsActive = watch("is_active");
  const selectedDepartment = watch("department");
  const [departmentSearch, setDepartmentSearch] = React.useState("");
  const [departmentOpen, setDepartmentOpen] = React.useState(false);
  const [isDepartmentDialogOpen, setIsDepartmentDialogOpen] =
    React.useState(false);
  const deferredDepartmentSearch = React.useDeferredValue(departmentSearch);

  const departmentSearchFilters = React.useMemo<Filter[]>(() => {
    const keyword = deferredDepartmentSearch.trim();
    if (!keyword) return [];

    return [
      ["department_name", "like", `%${keyword}%`],
      ["department_code", "like", `%${keyword}%`],
    ];
  }, [deferredDepartmentSearch]);

  const { data: departments, mutate: refetchDepartments } =
    useGetList<BlogDepartment>("blog_departments", {
      fields: ["name", "department_name", "department_code", "is_active"],
      orFilters: departmentSearchFilters,
      orderBy: { field: "department_name", order: "asc" },
      limit: 20,
    });

  const { data: selectedDepartmentDoc } = useGetDoc<BlogDepartment>(
    "blog_departments",
    selectedDepartment || null,
    {
      enabled: !!selectedDepartment,
    },
  );

  const { data: userProfile } = useGetDoc<UserWithRoles>("User", currentUser);

  const selectedDepartmentLabel = React.useMemo(() => {
    const matched = (departments ?? []).find(
      (department) => department.name === selectedDepartment,
    );
    return (
      matched?.department_name ?? selectedDepartmentDoc?.department_name ?? ""
    );
  }, [departments, selectedDepartment, selectedDepartmentDoc?.department_name]);

  const canCreateDepartment = React.useMemo(
    () =>
      (userProfile?.roles ?? []).some((item) => item.role === "Admin Blogs"),
    [userProfile?.roles],
  );

  const { createDoc, loading: isCreating } = useCreateDoc<Topic>("topics");
  const { updateDoc, loading: isUpdating } = useUpdateDoc<Topic>("topics");
  const isLoading = isCreating || isUpdating;

  React.useEffect(() => {
    if (topic) {
      reset({
        topic: topic.topic ?? "",
        department:
          typeof topic.department === "string"
            ? topic.department
            : (topic.department?.name ?? ""),
        desc: topic.desc ?? "",
        slug: topic.slug ?? "",
        is_active: topic.is_active === 1,
      });
      return;
    }

    reset({
      topic: "",
      department: "",
      desc: "",
      slug: "",
      is_active: true,
    });
  }, [topic, reset]);

  React.useEffect(() => {
    if (!departmentOpen) {
      setDepartmentSearch("");
    }
  }, [departmentOpen]);

  const onSubmit = async (values: TopicFormValues) => {
    try {
      const payload = {
        topic: values.topic.trim(),
        department: values.department,
        desc: values.desc.trim(),
        slug: values.slug.trim(),
        is_active: values.is_active ? 1 : 0,
      };

      if (isEditing && topic) {
        await updateDoc(topic.name, payload);
        showCrudSuccess(
          copy.updateSuccess,
          `${copy.updateSuccessPrefix}: "${values.topic}"`,
        );
      } else {
        await createDoc(payload);
        showCrudSuccess(
          copy.createSuccess,
          `${copy.createSuccessPrefix}: "${values.topic}"`,
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
    const name = watch("topic");
    if (!name) return;
    setValue("slug", slugify(name), { shouldValidate: true });
  };

  const handleDepartmentCreated = React.useCallback(
    async (department: BlogDepartment) => {
      await refetchDepartments();
      setValue("department", department.name, { shouldValidate: true });
      setIsDepartmentDialogOpen(false);
      setDepartmentOpen(false);
      setDepartmentSearch("");
    },
    [refetchDepartments, setValue],
  );

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="department">
            {copy.department} <span className="text-destructive">*</span>
          </Label>
          <Popover open={departmentOpen} onOpenChange={setDepartmentOpen}>
            <PopoverTrigger asChild>
              <Button
                id="department"
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={departmentOpen}
                disabled={isLoading}
                className={cn(
                  "w-full justify-between font-normal",
                  !selectedDepartmentLabel && "text-muted-foreground",
                  errors.department && "border-destructive",
                )}
              >
                {selectedDepartmentLabel || copy.departmentPlaceholder}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
              <div className="border-b p-2">
                <Input
                  value={departmentSearch}
                  onChange={(e) => setDepartmentSearch(e.target.value)}
                  placeholder={copy.departmentPlaceholder}
                  autoFocus
                />
              </div>
              <div
                className="max-h-64 overflow-y-auto overscroll-contain p-1"
                onWheel={(event) => event.stopPropagation()}
              >
                {(departments ?? []).length > 0 ? (
                  (departments ?? []).map((department) => {
                    const isSelected = selectedDepartment === department.name;

                    return (
                      <button
                        key={department.name}
                        type="button"
                        className={cn(
                          "hover:bg-accent hover:text-accent-foreground flex w-full items-center justify-between rounded-sm px-2 py-2 text-left text-sm",
                          isSelected && "bg-accent/50",
                        )}
                        onClick={() => {
                          setValue("department", department.name, {
                            shouldValidate: true,
                          });
                          setDepartmentOpen(false);
                        }}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {department.department_name}
                          </p>
                        </div>
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4 shrink-0",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </button>
                    );
                  })
                ) : (
                  <div className="space-y-2 px-2 py-3">
                    <p className="text-sm text-muted-foreground">
                      No matching department found.
                    </p>
                    {canCreateDepartment ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setDepartmentOpen(false);
                          setIsDepartmentDialogOpen(true);
                        }}
                      >
                        Create a new content department
                      </Button>
                    ) : null}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <input
            type="hidden"
            {...register("department", {
              required: copy.departmentRequired,
            })}
          />
          {errors.department && (
            <p className="text-sm text-destructive">
              {errors.department.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">
            {copy.name} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="topic"
            placeholder={copy.namePlaceholder}
            {...register("topic", {
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
          {errors.topic && (
            <p className="text-sm text-destructive">{errors.topic.message}</p>
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
              disabled={!watch("topic")}
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
          <Label htmlFor="desc">{copy.description}</Label>
          <Textarea
            id="desc"
            placeholder={copy.descriptionPlaceholder}
            rows={3}
            {...register("desc", {
              maxLength: {
                value: 500,
                message: copy.descriptionMax,
              },
            })}
          />
          {errors.desc && (
            <p className="text-sm text-destructive">{errors.desc.message}</p>
          )}
          <p className="text-right text-xs text-muted-foreground">
            {(watch("desc") ?? "").length}/500
          </p>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="is_active" className="cursor-pointer">
              {copy.activeStatus}
            </Label>
            <p className="text-sm text-muted-foreground">
              {watchIsActive
                ? copy.activeDescription
                : copy.inactiveDescription}
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

      <Dialog
        open={isDepartmentDialogOpen}
        onOpenChange={setIsDepartmentDialogOpen}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t.blogDepartments.addDepartmentTitle}</DialogTitle>
          </DialogHeader>
          <DepartmentForm
            department={null}
            onSuccess={handleDepartmentCreated}
            onCancel={() => setIsDepartmentDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
