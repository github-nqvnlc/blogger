"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFileUpload } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import { getDictionary } from "@/i18n";
import { getPrivateFlag, isSupportedImageUrl, normalizePostFileDoc } from "@/lib/blog-posts";
import { cn, getBaseUrl } from "@/lib/utils";
import type { PostFileDoc, PostVisibilityOption } from "@/types/blogs";
import { ImagePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type CoverSource = "url" | "upload" | null;

interface CoverImageFieldProps {
  id: string;
  value: string;
  visibility: PostVisibilityOption;
  disabled?: boolean;
  invalid?: boolean;
  source: CoverSource;
  fileMeta: PostFileDoc | null;
  onChange: (value: string) => void;
  onSourceChange: (source: CoverSource) => void;
  onFileMetaChange: (file: PostFileDoc | null) => void;
  onBusyChange: (busy: boolean) => void;
}

export function CoverImageField({
  id,
  value,
  visibility,
  disabled,
  invalid,
  source,
  fileMeta,
  onChange,
  onSourceChange,
  onFileMetaChange,
  onBusyChange,
}: CoverImageFieldProps) {
  const { locale, t } = useLanguage();
  const copy = (t.blogPosts ?? getDictionary(locale).blogPosts).cover;
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { upload, loading, progress, error } = useFileUpload();
  const [urlTouched, setUrlTouched] = useState(false);

  useEffect(() => {
    onBusyChange(loading);
  }, [loading, onBusyChange]);

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const uploaded = await upload(file, {
        isPrivate: Boolean(getPrivateFlag(visibility)),
      });
      const normalizedFile = normalizePostFileDoc(uploaded);
      onFileMetaChange(normalizedFile);
      onChange(uploaded.file_url);
      onSourceChange("upload");
      setUrlTouched(false);
    } catch {
      onFileMetaChange(null);
    }
  }

  const shouldShowUrlError =
    source === "url" && urlTouched && value.trim() && !isSupportedImageUrl(value);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{copy.title}</Label>
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value.includes("https") ? value : `${getBaseUrl()}${value}`}
          alt={copy.previewAlt}
          className="max-h-80  w-full rounded-xl border object-contain"
        />
      ) : null}

      <Tabs
        value={source ?? "url"}
        onValueChange={nextValue => onSourceChange(nextValue as CoverSource)}
      >
        <TabsList className="border border-primary w-full">
          <TabsTrigger value="url">{copy.urlTab}</TabsTrigger>
          <TabsTrigger value="upload">{copy.uploadTab}</TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-3">
          <Input
            id={id}
            value={value}
            disabled={disabled}
            onBlur={() => setUrlTouched(true)}
            onChange={event => {
              onChange(event.target.value);
              onSourceChange("url");
              if (fileMeta) {
                onFileMetaChange(null);
              }
            }}
            placeholder={copy.urlPlaceholder}
            className={cn(invalid && "border-destructive")}
          />
          {shouldShowUrlError ? (
            <Alert variant="destructive">
              <AlertDescription>{copy.invalidUrl}</AlertDescription>
            </Alert>
          ) : null}
        </TabsContent>

        <TabsContent value="upload" className="space-y-3">
          <div className="rounded-xl border border-dashed border-primary p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="font-medium">{copy.uploadTab}</p>
                <p className="text-sm text-muted-foreground">{copy.uploadHint}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={disabled || loading}
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary text-primary-foreground dark:bg-primary/90 dark:text-primary-foreground/90 border-0"
              >
                <ImagePlus className="mr-2 size-4" />
                {fileMeta ? copy.changeFile : copy.chooseFile}
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            <div className="mt-4 space-y-3">
              {loading ? (
                <>
                  <Progress value={progress} />
                  <p className="text-sm text-muted-foreground">{copy.uploadBusy}</p>
                </>
              ) : (
                <p className="text-sm text-primary dark:text-primary/80">
                  {fileMeta?.file_name || copy.uploadIdle}
                </p>
              )}

              {fileMeta ? (
                <Badge variant="secondary">
                  {fileMeta.is_private ? copy.privateFile : copy.publicFile}
                </Badge>
              ) : null}

              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{copy.uploadError}</AlertDescription>
                </Alert>
              ) : null}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
