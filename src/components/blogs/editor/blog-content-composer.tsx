'use client';

import { useMemo, useState } from 'react';
import { Copy, Eye, FileCode2, PencilLine, WandSparkles } from 'lucide-react';
import { marked } from 'marked';
import { format as formatWithPrettier } from 'prettier/standalone';
import htmlPlugin from 'prettier/plugins/html';
import TurndownService from 'turndown';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { restoreEmbeddedMediaHtml, stripHtml } from '@/lib/blog-posts';
import { TiptapEditor } from './tiptap-editor';
import { RichContent } from './rich-content';

type ComposerView = 'editor' | 'html' | 'markdown' | 'preview';

type BlogContentComposerProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
};

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

turndownService.addRule('embedded-media-figure', {
  filter: (node) =>
    node instanceof HTMLElement &&
    node.tagName === 'FIGURE' &&
    node.dataset.blogMedia === 'true',
  replacement: (_content, node) => `\n\n${(node as HTMLElement).outerHTML}\n\n`,
});

function normalizeHtml(value?: string | null): string {
  return restoreEmbeddedMediaHtml(value ?? '').trim();
}

function htmlToMarkdown(value: string): string {
  const normalized = normalizeHtml(value);
  if (!normalized) {
    return '';
  }

  return turndownService.turndown(normalized).trim();
}

function markdownToHtml(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    return '';
  }

  const parsed = marked.parse(normalized, {
    async: false,
    breaks: true,
    gfm: true,
  });

  return (typeof parsed === 'string' ? parsed : '').trim();
}

async function copyTextToClipboard(
  value: string,
  label: string,
  messages: {
    success: string;
    empty: string;
    failed: string;
  },
) {
  if (!value.trim()) {
    toast.error(messages.empty);
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    toast.success(messages.success);
  } catch {
    toast.error(messages.failed);
  }
}

export function BlogContentComposer({
  id,
  value,
  onChange,
  disabled,
  invalid,
}: BlogContentComposerProps) {
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<ComposerView>('editor');
  const msg = t.blogEditor.composer;
  const msgToast = msg.toast;
  const normalizedValue = useMemo(() => normalizeHtml(value), [value]);
  const [htmlDraft, setHtmlDraft] = useState(normalizedValue);
  const [markdownDraft, setMarkdownDraft] = useState(() =>
    htmlToMarkdown(normalizedValue),
  );

  const previewText = useMemo(
    () => stripHtml(normalizedValue),
    [normalizedValue],
  );

  async function handleCopy() {
    switch (activeView) {
      case 'editor':
        await copyTextToClipboard(previewText, 'Editor', {
          success: msgToast.copied.replace('{tab}', msg.tabs.editor),
          empty: msgToast.copyEmpty.replace('{tab}', msg.tabs.editor),
          failed: msgToast.copyFailed.replace('{tab}', msg.tabs.editor),
        });
        return;
      case 'html':
        await copyTextToClipboard(htmlDraft, 'HTML', {
          success: msgToast.copied.replace('{tab}', msg.tabs.html),
          empty: msgToast.copyEmpty.replace('{tab}', msg.tabs.html),
          failed: msgToast.copyFailed.replace('{tab}', msg.tabs.html),
        });
        return;
      case 'markdown':
        await copyTextToClipboard(markdownDraft, 'Markdown', {
          success: msgToast.copied.replace('{tab}', msg.tabs.markdown),
          empty: msgToast.copyEmpty.replace('{tab}', msg.tabs.markdown),
          failed: msgToast.copyFailed.replace('{tab}', msg.tabs.markdown),
        });
        return;
      case 'preview':
        await copyTextToClipboard(previewText, 'Preview', {
          success: msgToast.copied.replace('{tab}', msg.tabs.preview),
          empty: msgToast.copyEmpty.replace('{tab}', msg.tabs.preview),
          failed: msgToast.copyFailed.replace('{tab}', msg.tabs.preview),
        });
        return;
      default:
        return;
    }
  }

  async function handleFormatHtml() {
    try {
      const formatted = await formatWithPrettier(htmlDraft, {
        parser: 'html',
        plugins: [htmlPlugin],
      });

      setHtmlDraft(formatted);
      onChange(formatted);
      toast.success(msgToast.htmlFormatted);
    } catch {
      toast.error(msgToast.htmlFormatFailed);
    }
  }

  function handleViewChange(nextView: string) {
    const typedView = nextView as ComposerView;
    setActiveView(typedView);

    if (typedView === 'html') {
      setHtmlDraft(normalizedValue);
    }

    if (typedView === 'markdown') {
      setMarkdownDraft(htmlToMarkdown(normalizedValue));
    }
  }

  function handleHtmlChange(nextValue: string) {
    setHtmlDraft(nextValue);
    onChange(nextValue);
  }

  function handleMarkdownChange(nextValue: string) {
    setMarkdownDraft(nextValue);
    onChange(markdownToHtml(nextValue));
  }

  const copySource =
    activeView === 'editor' || activeView === 'preview'
      ? previewText
      : activeView === 'html'
        ? htmlDraft
        : markdownDraft;

  return (
    <div
      id={id}
      data-blog-content-composer
      tabIndex={-1}
      className={cn(
        'rounded-2xl border bg-background p-4 outline-none',
        invalid && 'border-red-500 ring-2 ring-red-500/20',
      )}
    >
      <Tabs value={activeView} onValueChange={handleViewChange}>
        <div className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-4">
            <TabsTrigger value="editor" className="gap-2">
              <PencilLine className="size-4" />
              {msg.tabs.editor}
            </TabsTrigger>
            <TabsTrigger value="html" className="gap-2">
              <FileCode2 className="size-4" />
              {msg.tabs.html}
            </TabsTrigger>
            <TabsTrigger value="markdown" className="gap-2">
              <FileCode2 className="size-4" />
              {msg.tabs.markdown}
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="size-4" />
              {msg.tabs.preview}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center justify-end gap-2">
            {activeView === 'html' ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFormatHtml}
                disabled={disabled || !htmlDraft.trim()}
              >
                <WandSparkles className="size-4" />
                {msg.formatHtml}
              </Button>
            ) : null}

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              disabled={disabled || !copySource.trim()}
              title={msg.copyButton}
            >
              <Copy className="size-4" />
            </Button>
          </div>
        </div>

        <TabsContent value="editor" className="pt-4">
          <TiptapEditor
            value={normalizedValue}
            onChange={onChange}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="html" className="pt-4">
          <Textarea
            value={htmlDraft}
            onChange={(event) => handleHtmlChange(event.target.value)}
            disabled={disabled}
            className="min-h-[28rem] font-mono text-sm"
            spellCheck={false}
          />
        </TabsContent>

        <TabsContent value="markdown" className="pt-4">
          <Textarea
            value={markdownDraft}
            onChange={(event) => handleMarkdownChange(event.target.value)}
            disabled={disabled}
            className="min-h-[28rem] font-mono text-sm"
            spellCheck={false}
          />
        </TabsContent>

        <TabsContent value="preview" className="pt-4">
          <div className="min-h-[28rem] rounded-xl border bg-muted/10 p-4">
            <RichContent
              value={normalizedValue}
              emptyText={msg.emptyPreview}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
