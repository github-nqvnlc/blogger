"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useDeleteDoc, useFileUpload } from "@/hooks";
import { useLanguage } from "@/hooks/useLanguage";
import {
  isSupportedImageUrl,
  normalizeBlogMediaUrl,
  parseVideoMediaUrl,
  restoreEmbeddedMediaHtml,
} from "@/lib/blog-posts";
import { getBaseUrl } from "@/lib/utils";
import { Extension, Node } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableRow } from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Grid3x3,
  Heading2,
  Heading3,
  Highlighter,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link2,
  List,
  ListOrdered,
  Merge,
  Minus,
  Palette,
  Plus,
  Quote,
  Redo2,
  SplitSquareHorizontal,
  Table2,
  Trash2,
  Type,
  UnderlineIcon,
  Undo2,
  Upload,
  Video,
  WandSparkles,
} from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

type MediaDialogKind = "link" | "image" | "video";

type BlogEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onTransientImageUpload?: (fileName: string) => void;
  onTransientUploadsChange?: (hasUploads: boolean) => void;
  disabled?: boolean;
};

export type BlogEditorHandle = {
  cleanupUploadedImages: () => Promise<void>;
  hasUploadedImages: () => boolean;
};

type TextAlignValue = "left" | "center" | "right" | "justify";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontFamily: {
      setFontFamily: (fontFamily: string) => ReturnType;
      unsetFontFamily: () => ReturnType;
    };
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
    indent: {
      setIndent: (level: number) => ReturnType;
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

const DEFAULT_EDITOR_STATE = {
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isHeading2: false,
  isHeading3: false,
  isBulletList: false,
  isOrderedList: false,
  isBlockquote: false,
  isCodeBlock: false,
  isTable: false,
  canUndo: false,
  canRedo: false,
  textAlign: "left" as TextAlignValue,
  fontFamily: "",
  fontSize: "",
  textColor: "",
  highlightColor: "",
  indent: 0,
};

const FONT_FAMILY_OPTIONS = [
  { label: "Sans", value: "Arial, Helvetica, sans-serif" },
  { label: "Serif", value: "Georgia, 'Times New Roman', serif" },
  { label: "Monospace", value: "'Courier New', monospace" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Trebuchet", value: "'Trebuchet MS', sans-serif" },
];
const FONT_SIZE_OPTIONS = ["12px", "14px", "16px", "18px", "24px", "32px"];
const INDENT_NODE_TYPES = ["paragraph", "heading", "blockquote", "codeBlock"];
const DEFAULT_TEXT_COLOR = "#111827";
const DEFAULT_HIGHLIGHT_COLOR = "#fef08a";

function formatCode(code: string): string {
  const indentUnit = "  ";
  let indentLevel = 0;
  const output: string[] = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      output.push("");
      continue;
    }

    const closesBlock = /^[}\])]/.test(trimmed);
    if (closesBlock && indentLevel > 0) {
      indentLevel--;
    }

    output.push(indentUnit.repeat(indentLevel) + trimmed);

    const opensBlock = /[{[(\[]\s*$/.test(trimmed) || /\{\s*$/.test(trimmed);
    if (opensBlock && !trimmed.endsWith("}") && !trimmed.endsWith("]") && !trimmed.endsWith(")")) {
      indentLevel++;
    }

    const isSingleLineBlock = /^if|^for|^while|^switch|^function|^class|^const|^let|^var|^import|^export|^return/.test(trimmed) && trimmed.endsWith("{");
    if (isSingleLineBlock) {
      indentLevel--;
    }

    if (trimmed.endsWith("{")) {
      indentLevel++;
    }
  }

  return output.join("\n");
}

const CODE_BLOCK_LANGUAGES = [
  { value: "plaintext", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "bash", label: "Bash" },
  { value: "powershell", label: "PowerShell" },
];

const lowlight = createLowlight(common);

function clampIndent(value: number): number {
  return Math.max(0, Math.min(5, value));
}

function getActiveBlockAttributes(editor: {
  isActive: (name: string, attributes?: Record<string, unknown>) => boolean;
  getAttributes: (name: string) => Record<string, unknown>;
}) {
  if (editor.isActive("heading")) {
    return editor.getAttributes("heading");
  }

  if (editor.isActive("blockquote")) {
    return editor.getAttributes("blockquote");
  }

  if (editor.isActive("codeBlock")) {
    return editor.getAttributes("codeBlock");
  }

  return editor.getAttributes("paragraph");
}

const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => (element as HTMLElement).style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
          ({ chain }) =>
            chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
          ({ chain }) =>
            chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

const FontFamily = Extension.create({
  name: "fontFamily",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: element => (element as HTMLElement).style.fontFamily || null,
            renderHTML: attributes => {
              if (!attributes.fontFamily) {
                return {};
              }

              return {
                style: `font-family: ${attributes.fontFamily}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontFamily:
        (fontFamily: string) =>
          ({ chain }) =>
            chain().setMark("textStyle", { fontFamily }).run(),
      unsetFontFamily:
        () =>
          ({ chain }) =>
            chain().setMark("textStyle", { fontFamily: null }).removeEmptyTextStyle().run(),
    };
  },
});

const Indent = Extension.create({
  name: "indent",

  addGlobalAttributes() {
    return [
      {
        types: INDENT_NODE_TYPES,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const value = (element as HTMLElement).getAttribute("data-indent");
              const parsed = value ? Number(value) : 0;
              return Number.isFinite(parsed) ? clampIndent(parsed) : 0;
            },
            renderHTML: attributes => {
              const level =
                typeof attributes.indent === "number" ? clampIndent(attributes.indent) : 0;

              if (level <= 0) {
                return {};
              }

              return {
                "data-indent": String(level),
                style: `margin-left: ${level * 2}rem;`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setIndent:
        (level: number) =>
          ({ editor, commands }) => {
            const nextLevel = clampIndent(level);
            for (const type of INDENT_NODE_TYPES) {
              if (editor.isActive(type)) {
                return commands.updateAttributes(type, {
                  indent: nextLevel,
                });
              }
            }

            return commands.updateAttributes("paragraph", {
              indent: nextLevel,
            });
          },
      indent:
        () =>
          ({ editor }) => {
            const currentIndent = Number(getActiveBlockAttributes(editor).indent ?? 0);
            return editor.commands.setIndent(currentIndent + 1);
          },
      outdent:
        () =>
          ({ editor }) => {
            const currentIndent = Number(getActiveBlockAttributes(editor).indent ?? 0);
            return editor.commands.setIndent(currentIndent - 1);
          },
    };
  },
});

const EmbeddedMedia = Node.create({
  name: "embeddedMedia",
  group: "block",
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: {
        default: "",
      },
      provider: {
        default: "file",
      },
      kind: {
        default: "file",
      },
      title: {
        default: "Embedded media",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-blog-media]",
        getAttrs: element => {
          const figure = element as HTMLElement;
          const iframe = figure.querySelector("iframe");
          const video = figure.querySelector("video");
          const src =
            iframe?.getAttribute("src") ||
            iframe?.getAttribute("data-src") ||
            video?.getAttribute("src") ||
            video?.getAttribute("data-src") ||
            "";

          if (!src) {
            return false;
          }

          const inferredKind =
            figure.dataset.kind ||
            (iframe ? "embed" : video ? "file" : undefined) ||
            (figure.dataset.provider === "youtube" || figure.dataset.provider === "vimeo"
              ? "embed"
              : "file");

          return {
            src,
            provider: figure.dataset.provider ?? "file",
            kind: inferredKind,
            title:
              figure.dataset.title ||
              iframe?.getAttribute("title") ||
              video?.getAttribute("title") ||
              figure.getAttribute("title") ||
              "Embedded media",
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src || "";
    const kind = HTMLAttributes.kind || (src.includes("youtube.com/embed") || src.includes("player.vimeo") ? "embed" : "file");
    const isEmbed = kind === "embed";

    return [
      "figure",
      {
        "data-blog-media": "true",
        class: "my-6 overflow-hidden rounded-xl",
      },
      [
        isEmbed ? "iframe" : "video",
        {
          src,
          title: HTMLAttributes.title || (isEmbed ? "Embedded video" : "Video file"),
          ...(isEmbed
            ? {
              allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
              allowfullscreen: "true",
              frameborder: "0",
              class: "aspect-video w-full rounded-xl border-0",
            }
            : {
              controls: "true",
              playsinline: "true",
              preload: "metadata",
              class: "w-full rounded-xl",
            }),
        },
      ],
    ];
  },
});

function normalizeEditorHtml(value?: string | null): string {
  const trimmed = value?.trim() ?? "";

  if (!trimmed || trimmed === "<p></p>") {
    return "";
  }

  return trimmed;
}

type ToolbarButtonProps = {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
};

function ToolbarButton({ active, disabled, onClick, title, children }: ToolbarButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className="min-w-9"
    >
      {children}
    </Button>
  );
}

export const TiptapEditor = forwardRef<BlogEditorHandle, BlogEditorProps>(
  ({ value, onChange, onTransientImageUpload, onTransientUploadsChange, disabled }, ref) => {
    const { t } = useLanguage();
    const msg = t.blogEditor.editor;
    const msgDialog = msg.dialog;
    const uploadImageInputRef = useRef<HTMLInputElement | null>(null);
    const inlineUpload = useFileUpload();
    const deleteFile = useDeleteDoc("File");
    const [dialogKind, setDialogKind] = useState<MediaDialogKind | null>(null);
    const [dialogValue, setDialogValue] = useState("");
    const [dialogCaption, setDialogCaption] = useState("");
    const [dialogError, setDialogError] = useState<string | null>(null);
    const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
    const [inlineUploadError, setInlineUploadError] = useState<string | null>(null);
    const [uploadedImageNames, setUploadedImageNames] = useState<string[]>([]);

    useImperativeHandle(ref, () => ({
      async cleanupUploadedImages() {
        for (const name of uploadedImageNames) {
          try {
            await deleteFile.deleteDoc(name);
          } catch { }
        }
        setUploadedImageNames([]);
      },
      hasUploadedImages() {
        return uploadedImageNames.length > 0;
      },
    }));

    useEffect(() => {
      onTransientUploadsChange?.(uploadedImageNames.length > 0);
    }, [onTransientUploadsChange, uploadedImageNames]);

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [2, 3],
          },
          codeBlock: false,
        }),
        TextStyle,
        Color,
        FontFamily,
        Highlight.configure({
          multicolor: true,
        }),
        FontSize,
        Indent,
        TextAlign.configure({
          types: ["heading", "paragraph", "blockquote", "codeBlock"],
        }),
        Image.configure({
          HTMLAttributes: {
            class: "rounded-xl",
          },
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableCell,
        TableHeader,
        EmbeddedMedia,
        CodeBlockLowlight.configure({
          lowlight,
          HTMLAttributes: {
            class: "rounded-xl bg-neutral-900 p-4 overflow-x-auto",
          },
        }),
      ],
      content: normalizeEditorHtml(restoreEmbeddedMediaHtml(value)),
      editable: !disabled,
      editorProps: {
        attributes: {
          class:
            "min-h-72 px-4 py-3 focus:outline-none [&_.ProseMirror-selectednode]:ring-2 [&_.ProseMirror-selectednode]:ring-primary [&_a]:cursor-pointer [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l [&_blockquote]:pl-4 [&_blockquote]:italic [&_figure]:my-6 [&_iframe]:aspect-video [&_iframe]:w-full [&_iframe]:rounded-xl [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:text-[10px] [&_pre]:font-mono [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-neutral-900 [&_pre]:p-4 [&_ul]:list-disc [&_ul]:pl-6 [&_video]:w-full [&_video]:rounded-xl [&_table]:border-collapse [&_table]:w-full [&_table]:my-4 [&_table_td]:border [&_table_td]:border-border [&_table_td]:p-2 [&_table_th]:border [&_table_th]:border-border [&_table_th]:bg-muted [&_table_th]:p-2 [&_table_th]:font-semibold [&_table_tr]:border [&_table_tr]:border-border",
        },
      },
      onUpdate({ editor: currentEditor }) {
        const html = normalizeEditorHtml(currentEditor.getHTML());
        onChange(html);
      },
    });

    useEffect(() => {
      if (!editor) {
        return;
      }

      editor.setEditable(!disabled);
    }, [disabled, editor]);

    useEffect(() => {
      if (!editor) {
        return;
      }

      const decodedValue = value ?? "";
      const currentValue = normalizeEditorHtml(editor.getHTML());
      const nextValue = normalizeEditorHtml(restoreEmbeddedMediaHtml(decodedValue));

      if (currentValue !== nextValue) {
        editor.commands.setContent(nextValue || "", {
          emitUpdate: false,
        });
      }
    }, [editor, value]);

    const editorState =
      useEditorState({
        editor,
        selector: ({ editor: currentEditor }) => {
          if (!currentEditor) {
            return DEFAULT_EDITOR_STATE;
          }

          const blockAttributes = getActiveBlockAttributes(currentEditor);
          const textStyleAttributes = currentEditor.getAttributes("textStyle");
          const highlightAttributes = currentEditor.getAttributes("highlight");

          return {
            isBold: currentEditor.isActive("bold"),
            isItalic: currentEditor.isActive("italic"),
            isUnderline: currentEditor.isActive("underline"),
            isHeading2: currentEditor.isActive("heading", { level: 2 }),
            isHeading3: currentEditor.isActive("heading", { level: 3 }),
            isBulletList: currentEditor.isActive("bulletList"),
            isOrderedList: currentEditor.isActive("orderedList"),
            isBlockquote: currentEditor.isActive("blockquote"),
            isCodeBlock: currentEditor.isActive("codeBlock"),
            isTable: currentEditor.isActive("table"),
            canUndo: currentEditor.can().undo(),
            canRedo: currentEditor.can().redo(),
            textAlign: (blockAttributes.textAlign as TextAlignValue) || "left",
            fontFamily: (textStyleAttributes.fontFamily as string) || "",
            fontSize: (textStyleAttributes.fontSize as string) || "",
            textColor: (textStyleAttributes.color as string) || "",
            highlightColor: (highlightAttributes.color as string) || "",
            indent: Number(blockAttributes.indent ?? 0),
          };
        },
      }) ?? DEFAULT_EDITOR_STATE;

    const dialogText = useMemo(() => {
      if (pendingImageUrl) {
        return {
          title: msgDialog.image.title,
          description: msgDialog.image.description,
          label: msgDialog.image.label,
          placeholder: msgDialog.image.placeholder,
          captionLabel: msgDialog.image.caption,
          captionPlaceholder: msgDialog.image.captionPlaceholder,
          submitLabel: msgDialog.image.submit,
        };
      }

      switch (dialogKind) {
        case "link":
          return {
            title: msgDialog.link.title,
            description: msgDialog.link.description,
            label: msgDialog.link.label,
            placeholder: msgDialog.link.placeholder,
            submitLabel: msgDialog.link.submit,
          };
        case "image":
          return {
            title: msgDialog.image.title,
            description: msgDialog.image.description,
            label: msgDialog.image.label,
            placeholder: msgDialog.image.placeholder,
            captionLabel: msgDialog.image.caption,
            captionPlaceholder: msgDialog.image.captionPlaceholder,
            submitLabel: msgDialog.image.submit,
          };
        case "video":
          return {
            title: msgDialog.video.title,
            description: msgDialog.video.description,
            label: msgDialog.video.label,
            placeholder: msgDialog.video.placeholder,
            submitLabel: msgDialog.video.submit,
          };
        default:
          return null;
      }
    }, [dialogKind, msgDialog, pendingImageUrl]);

    function openDialog(kind: MediaDialogKind) {
      setDialogKind(kind);
      setDialogValue("");
      setDialogCaption("");
      setDialogError(null);
    }

    function closeDialog() {
      setDialogKind(null);
      setDialogValue("");
      setDialogCaption("");
      setDialogError(null);
    }

    function insertLink() {
      if (!editor) {
        return;
      }

      const normalized = normalizeBlogMediaUrl(dialogValue);
      if (!normalized) {
        setDialogError(msg.error.invalidLinkUrl);
        return;
      }

      if (!/^https?:\/\//i.test(normalized) && !normalized.startsWith("/")) {
        setDialogError(msg.error.invalidLinkProtocol);
        return;
      }

      const { empty } = editor.state.selection;
      const linkAttributes = {
        href: normalized,
        target: "_blank",
        rel: "noopener noreferrer",
      };

      if (empty) {
        editor
          .chain()
          .focus()
          .insertContent({
            type: "text",
            text: normalized,
            marks: [
              {
                type: "link",
                attrs: linkAttributes,
              },
            ],
          })
          .run();
      } else {
        editor.chain().focus().extendMarkRange("link").setLink(linkAttributes).run();
      }

      closeDialog();
    }

    function insertImageFromUrl() {
      if (!editor) {
        return;
      }

      const normalized = normalizeBlogMediaUrl(dialogValue);
      if (!normalized || !isSupportedImageUrl(normalized)) {
        setDialogError(msg.error.invalidImageUrl);
        return;
      }

      const caption = dialogCaption.trim();
      if (caption) {
        editor.chain().focus().insertContent([
          { type: "image", attrs: { src: normalized } },
          {
            type: "paragraph",
            attrs: { textAlign: "center" },
            content: [{ type: "text", text: caption, marks: [{ type: "italic" }] }],
          },
          { type: "paragraph" },
        ]).run();
      } else {
        editor.chain().focus().setImage({ src: normalized }).run();
      }
      closeDialog();
    }

    function insertVideoFromUrl() {
      if (!editor) {
        return;
      }

      const parsed = parseVideoMediaUrl(dialogValue);
      if (!parsed) {
        setDialogError(msg.error.invalidVideoUrl);
        return;
      }

      editor
        .chain()
        .focus()
        .insertContent({
          type: "embeddedMedia",
          attrs: parsed,
        })
        .run();
      closeDialog();
    }

    function handleDialogSubmit(event: React.FormEvent<HTMLFormElement>) {
      event.preventDefault();

      if (pendingImageUrl) {
        if (!editor) {
          return;
        }

        const caption = dialogCaption.trim();
        if (caption) {
          editor.chain().focus().insertContent([
            { type: "image", attrs: { src: pendingImageUrl } },
            {
              type: "paragraph",
              attrs: { textAlign: "center" },
              content: [{ type: "text", text: caption, marks: [{ type: "italic" }] }],
            },
            { type: "paragraph" },
          ]).run();
        } else {
          editor.chain().focus().setImage({ src: pendingImageUrl }).run();
        }
        setPendingImageUrl(null);
        closeDialog();
        return;
      }

      if (dialogKind === "link") {
        insertLink();
        return;
      }

      if (dialogKind === "image") {
        insertImageFromUrl();
        return;
      }

      if (dialogKind === "video") {
        insertVideoFromUrl();
      }
    }

    async function handleInlineImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!editor || !file) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        setInlineUploadError(msg.error.invalidImageType);
        return;
      }

      setInlineUploadError(null);

      try {
        const uploaded = await inlineUpload.upload(file, {
          isPrivate: false,
        });

        if (uploaded.name) {
          setUploadedImageNames(prev => [...prev, uploaded.name]);
          onTransientImageUpload?.(uploaded.name);
        }

        setPendingImageUrl(uploaded.file_url);
        setDialogCaption("");
        setDialogError(null);
      } catch (error) {
        setInlineUploadError(error instanceof Error ? error.message : msg.error.uploadFailed);
      }
    }

    const mediaPreview = useMemo(() => {
      if (pendingImageUrl) {
        return (
          <div className="overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingImageUrl.includes("https") ? pendingImageUrl : `${getBaseUrl()}${pendingImageUrl}`} alt="Image preview" className="max-h-60 w-full object-cover" />
          </div>
        );
      }

      if (!dialogKind || dialogKind === "link") {
        return null;
      }

      if (dialogKind === "image") {
        const normalized = normalizeBlogMediaUrl(dialogValue);
        if (!normalized || !isSupportedImageUrl(normalized)) {
          return null;
        }

        return (
          <div className="overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={normalized} alt="Image preview" className="max-h-60 w-full object-cover" />
          </div>
        );
      }

      const parsed = parseVideoMediaUrl(dialogValue);
      if (!parsed) {
        return null;
      }

      if (parsed.kind === "embed") {
        return (
          <div className="overflow-hidden rounded-xl border">
            <iframe
              src={parsed.src}
              title={parsed.title}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        );
      }

      return (
        <div className="overflow-hidden rounded-xl border">
          <video src={parsed.src} controls playsInline preload="metadata" className="w-full" />
        </div>
      );
    }, [dialogKind, dialogValue, pendingImageUrl]);

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-3">
          {/* Heading2 Button */}
          <ToolbarButton
            active={editorState.isHeading2}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            title={msg.toolbar.heading2}
          >
            <Heading2 />
          </ToolbarButton>

          {/* Heading3 Button */}
          <ToolbarButton
            active={editorState.isHeading3}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            title={msg.toolbar.heading3}
          >
            <Heading3 />
          </ToolbarButton>

          {/* Bold Button */}
          <ToolbarButton
            active={editorState.isBold}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            title={msg.toolbar.bold}
          >
            <Bold />
          </ToolbarButton>

          {/* Italic Button */}
          <ToolbarButton
            active={editorState.isItalic}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            title={msg.toolbar.italic}
          >
            <Italic />
          </ToolbarButton>

          {/* Underline Button */}
          <ToolbarButton
            active={editorState.isUnderline}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
            title={msg.toolbar.underline}
          >
            <UnderlineIcon />
          </ToolbarButton>

          {/* Align Left Button */}
          <ToolbarButton
            active={editorState.textAlign === "left"}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().setTextAlign("left").run()}
            title={msg.toolbar.alignLeft}
          >
            <AlignLeft />
          </ToolbarButton>

          {/* Align Center Button */}
          <ToolbarButton
            active={editorState.textAlign === "center"}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().setTextAlign("center").run()}
            title={msg.toolbar.alignCenter}
          >
            <AlignCenter />
          </ToolbarButton>

          {/* Align Right Button */}
          <ToolbarButton
            active={editorState.textAlign === "right"}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().setTextAlign("right").run()}
            title={msg.toolbar.alignRight}
          >
            <AlignRight />
          </ToolbarButton>

          {/* Align Justify Button */}
          <ToolbarButton
            active={editorState.textAlign === "justify"}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().setTextAlign("justify").run()}
            title={msg.toolbar.alignJustify}
          >
            <AlignJustify />
          </ToolbarButton>

          {/* Outdent Button */}
          <ToolbarButton
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().outdent().run()}
            title={msg.toolbar.outdent}
          >
            <IndentDecrease />
          </ToolbarButton>

          {/* Indent Button */}
          <ToolbarButton
            disabled={!editor || disabled || editorState.indent >= 5}
            onClick={() => editor?.chain().focus().indent().run()}
            title={msg.toolbar.indent}
          >
            <IndentIncrease />
          </ToolbarButton>

          {/* Font Family Select */}
          <label className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm text-muted-foreground">
            <Type className="size-4" />
            <select
              className="max-w-28 bg-transparent text-sm outline-none"
              disabled={!editor || disabled}
              value={editorState.fontFamily}
              onChange={event => {
                const nextValue = event.target.value;
                if (!editor) {
                  return;
                }

                if (!nextValue) {
                  editor.chain().focus().unsetFontFamily().run();
                  return;
                }

                editor.chain().focus().setFontFamily(nextValue).run();
              }}
            >
              <option value="">{msg.toolbar.fontFamily}</option>
              {FONT_FAMILY_OPTIONS.map(fontFamily => (
                <option key={fontFamily.value} value={fontFamily.value}>
                  {fontFamily.label}
                </option>
              ))}
            </select>
          </label>

          {/* Font Size Select */}
          <label className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm text-muted-foreground">
            <Type className="size-4" />
            <select
              className="bg-transparent text-sm outline-none"
              disabled={!editor || disabled}
              value={editorState.fontSize}
              onChange={event => {
                const nextValue = event.target.value;
                if (!editor) {
                  return;
                }

                if (!nextValue) {
                  editor.chain().focus().unsetFontSize().run();
                  return;
                }

                editor.chain().focus().setFontSize(nextValue).run();
              }}
            >
              <option value="">{msg.toolbar.fontSize}</option>
              {FONT_SIZE_OPTIONS.map(fontSize => (
                <option key={fontSize} value={fontSize}>
                  {fontSize.replace("px", "")}
                </option>
              ))}
            </select>
          </label>

          {/* Text Color Picker */}
          <label className="flex items-center gap-2 rounded-md border bg-background px-2 py-0 text-sm text-muted-foreground">
            <Palette className="size-4" />
            <input
              type="color"
              title={msg.toolbar.textColor}
              disabled={!editor || disabled}
              value={editorState.textColor || DEFAULT_TEXT_COLOR}
              onChange={event => editor?.chain().focus().setColor(event.target.value).run()}
              className="h-8 w-10 rounded border-0 bg-transparent p-0"
            />
          </label>

          {/* Highlight Color Picker */}
          <label className="flex items-center gap-2 rounded-md border bg-background px-2 py-0 text-sm text-muted-foreground">
            <Highlighter className="size-4" />
            <input
              type="color"
              title={msg.toolbar.highlightColor}
              disabled={!editor || disabled}
              value={editorState.highlightColor || DEFAULT_HIGHLIGHT_COLOR}
              onChange={event =>
                editor?.chain().focus().setHighlight({ color: event.target.value }).run()
              }
              className="h-8 w-10 rounded border-0 bg-transparent p-0"
            />
          </label>

          {/* Bullet List Button */}
          <ToolbarButton
            active={editorState.isBulletList}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            title={msg.toolbar.bulletList}
          >
            <List />
          </ToolbarButton>

          {/* Ordered List Button */}
          <ToolbarButton
            active={editorState.isOrderedList}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            title={msg.toolbar.orderedList}
          >
            <ListOrdered />
          </ToolbarButton>

          {/* Blockquote Button */}
          <ToolbarButton
            active={editorState.isBlockquote}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            title={msg.toolbar.blockquote}
          >
            <Quote />
          </ToolbarButton>

          {/* Code Block Button */}
          <Select
            value={
              editorState.isCodeBlock
                ? (editor?.getAttributes("codeBlock").language as string) || "plaintext"
                : ""
            }
            onValueChange={(language) => {
              if (!editor) return;
              if (editorState.isCodeBlock) {
                editor.chain().focus().updateAttributes("codeBlock", { language }).run();
              } else {
                editor.chain().focus().toggleCodeBlock({ language }).run();
              }
            }}
          >
            <SelectTrigger
              size="sm"
              className="min-w-9"
              disabled={!editor || disabled}
              title={msg.toolbar.codeBlock}
            >
              <SelectValue placeholder={<Code2 className="size-4" />} />
            </SelectTrigger>
            <SelectContent>
              {CODE_BLOCK_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Format Code Button */}
          <ToolbarButton
            disabled={!editor || disabled || !editorState.isCodeBlock}
            onClick={() => {
              if (!editor) return;
              const { $from } = editor.state.selection;

              let codeBlock = null;
              let codeBlockStart = 0;

              for (let depth = $from.depth; depth >= 0; depth--) {
                const node = $from.node(depth);
                if (node.type.name === "codeBlock" || node.type.name === "codeBlockCode") {
                  codeBlock = node;
                  codeBlockStart = $from.start(depth);
                  break;
                }
              }

              if (codeBlock) {
                let content = "";
                if (codeBlock.textContent) {
                  content = codeBlock.textContent;
                } else if (codeBlock.content && codeBlock.content.size > 0) {
                  codeBlock.content.forEach((child) => {
                    content += child.text || "";
                  });
                }

                if (!content || !content.trim()) return;

                const formatted = formatCode(content);
                const from = codeBlockStart + 1;
                const to = codeBlockStart + codeBlock.nodeSize - 1;

                editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, formatted).run();
              }
            }}
            title={msg.toolbar.formatCode || "Format Code"}
          >
            <WandSparkles className="size-4" />
          </ToolbarButton>

          {/* Insert Link Button */}
          <ToolbarButton
            disabled={!editor || disabled}
            onClick={() => openDialog("link")}
            title={msg.toolbar.insertLink}
          >
            <Link2 />
          </ToolbarButton>

          {/* Insert Image Button */}
          <ToolbarButton
            disabled={!editor || disabled}
            onClick={() => openDialog("image")}
            title={msg.toolbar.insertImageUrl}
          >
            <ImagePlus />
          </ToolbarButton>

          {/* Upload Image Button */}
          <ToolbarButton
            disabled={!editor || disabled || inlineUpload.loading}
            onClick={() => uploadImageInputRef.current?.click()}
            title={msg.toolbar.uploadImage}
          >
            {inlineUpload.loading ? <Spinner /> : <Upload />}
          </ToolbarButton>

          {/* Insert Video Button */}
          <ToolbarButton
            disabled={!editor || disabled}
            onClick={() => openDialog("video")}
            title={msg.toolbar.insertVideoUrl}
          >
            <Video />
          </ToolbarButton>

          {/* Table Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant={editorState.isTable ? "default" : "outline"}
                disabled={!editor || disabled}
                title={msg.toolbar.insertTable}
                className="min-w-9"
              >
                <Table2 />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={() =>
                  editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
                }
              >
                <Grid3x3 className="mr-2 size-4" />
                {msg.toolbar.insertTableDropdown.insertTable} (3x3)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!editorState.isTable}
                onClick={() => editor?.chain().focus().addRowBefore().run()}
              >
                <Plus className="mr-2 size-4" />
                {msg.toolbar.insertTableDropdown.addRowBefore}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!editorState.isTable}
                onClick={() => editor?.chain().focus().addRowAfter().run()}
              >
                <Plus className="mr-2 size-4" />
                {msg.toolbar.insertTableDropdown.addRowAfter}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!editorState.isTable}
                onClick={() => editor?.chain().focus().deleteRow().run()}
              >
                <Minus className="mr-2 size-4" />
                {msg.toolbar.insertTableDropdown.deleteRow}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!editorState.isTable}
                onClick={() => editor?.chain().focus().addColumnBefore().run()}
              >
                <Plus className="mr-2 size-4" />
                {msg.toolbar.insertTableDropdown.addColBefore}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!editorState.isTable}
                onClick={() => editor?.chain().focus().addColumnAfter().run()}
              >
                <Plus className="mr-2 size-4" />
                {msg.toolbar.insertTableDropdown.addColAfter}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!editorState.isTable}
                onClick={() => editor?.chain().focus().deleteColumn().run()}
              >
                <Minus className="mr-2 size-4" />
                {msg.toolbar.insertTableDropdown.deleteCol}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!editorState.isTable}
                onClick={() => editor?.chain().focus().mergeCells().run()}
              >
                <Merge className="mr-2 size-4" />
                {msg.toolbar.insertTableDropdown.mergeCells}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!editorState.isTable}
                onClick={() => editor?.chain().focus().splitCell().run()}
              >
                <SplitSquareHorizontal className="mr-2 size-4" />
                {msg.toolbar.insertTableDropdown.splitCell}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={!editorState.isTable}
                variant="destructive"
                onClick={() => editor?.chain().focus().deleteTable().run()}
              >
                <Trash2 className="mr-2 size-4" />
                {msg.toolbar.insertTableDropdown.deleteTable}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Undo Button */}
          <ToolbarButton
            disabled={!editor || disabled || !editorState.canUndo}
            onClick={() => editor?.chain().focus().undo().run()}
            title={msg.toolbar.undo}
          >
            <Undo2 />
          </ToolbarButton>

          {/* Redo Button */}
          <ToolbarButton
            disabled={!editor || disabled || !editorState.canRedo}
            onClick={() => editor?.chain().focus().redo().run()}
            title={msg.toolbar.redo}
          >
            <Redo2 />
          </ToolbarButton>

          <input
            ref={uploadImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInlineImageUpload}
          />
        </div>

        {inlineUpload.loading && (
          <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              <span>{msg.uploading}</span>
            </div>
            <Progress value={inlineUpload.progress} />
          </div>
        )}

        {(inlineUploadError || inlineUpload.error) && (
          <Alert variant="destructive">
            <AlertDescription>{inlineUploadError || inlineUpload.error?.message}</AlertDescription>
          </Alert>
        )}

        <div className="overflow-hidden min-h-[calc(100vh-510px)] rounded-xl border bg-background">
          <EditorContent editor={editor} />
        </div>

        <Dialog
          open={dialogKind !== null || pendingImageUrl !== null}
          onOpenChange={open => {
            if (!open) {
              setPendingImageUrl(null);
              closeDialog();
            }
          }}
        >
          <DialogContent>
            {dialogText && (
              <form className="space-y-4" onSubmit={handleDialogSubmit}>
                <DialogHeader>
                  <DialogTitle>{dialogText.title}</DialogTitle>
                  <DialogDescription>{dialogText.description}</DialogDescription>
                </DialogHeader>

                {!pendingImageUrl && (
                  <div className="space-y-2">
                    <Label htmlFor="media-url">{dialogText.label}</Label>
                    <Input
                      id="media-url"
                      value={dialogValue}
                      onChange={event => setDialogValue(event.target.value)}
                      placeholder={dialogText.placeholder}
                      autoFocus
                    />
                  </div>
                )}

                {mediaPreview}

                {(pendingImageUrl || dialogKind === "image") && (
                  <div className="space-y-2">
                    <Label htmlFor="media-caption">{dialogText.captionLabel}</Label>
                    <Input
                      id="media-caption"
                      value={dialogCaption}
                      onChange={event => setDialogCaption(event.target.value)}
                      placeholder={dialogText.captionPlaceholder}
                      autoFocus={!!pendingImageUrl}
                    />
                  </div>
                )}

                {dialogError && (
                  <Alert variant="destructive">
                    <AlertDescription>{dialogError}</AlertDescription>
                  </Alert>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setPendingImageUrl(null);
                    closeDialog();
                  }}>
                    {msgDialog.cancel}
                  </Button>
                  <Button type="submit">{dialogText.submitLabel}</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

TiptapEditor.displayName = "TiptapEditor";
