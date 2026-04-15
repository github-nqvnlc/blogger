# Tiptap Editor Component

## Tổng quan

`TiptapEditor` là một trình soạn thảo nội dung rich text mạnh mẽ được xây dựng dựa trên [TipTap](https://tiptap.dev/), được thiết kế đặc biệt cho việc soạn thảo blog posts với hỗ trợ đa dạng định dạng văn bản, media, và các tính năng định dạng nâng cao.

## Các tính năng

### 1. Định dạng văn bản cơ bản

- **Bold** (`<strong>`) - In đậm văn bản
- **Italic** (`<em>`) - In nghiêng văn bản
- **Underline** (`<u>`) - Gạch chân văn bản

### 2. Cấu trúc tiêu đề

- **Heading Level 2** (`<h2>`) - Tiêu đề cấp 2
- **Heading Level 3** (`<h3>`) - Tiêu đề cấp 3

### 3. Căn chỉnh văn bản

- **Căn trái** (`text-align: left`)
- **Căn giữa** (`text-align: center`)
- **Căn phải** (`text-align: right`)
- **Căn đều** (`text-align: justify`)

Căn chỉnh áp dụng cho: heading, paragraph, blockquote, codeBlock.

### 4. Cỡ chữ (Font Size)

- Lựa chọn cỡ chữ: 12px, 14px, 16px, 18px, 24px, 32px
- Có thể đặt lại về mặc định
- Extension tùy chỉnh `FontSize` để hỗ trợ

### 5. Màu sắc

- **Màu chữ** (Text Color) - Color picker với màu mặc định `#111827`
- **Màu nền chữ** (Highlight) - Color picker với màu mặc định `#fef08a`, hỗ trợ multicolor

### 6. Thụt đầu dòng (Indent)

- **Giảm thụt** (Outdent) - Giảm mức thụt đầu dòng
- **Tăng thụt** (Indent) - Tăng mức thụt đầu dòng
- Mức thụt từ 0 đến 5 (clamped)
- Áp dụng cho: paragraph, heading, blockquote, codeBlock
- Extension tùy chỉnh `Indent` với `data-indent` attribute và CSS `margin-left`

### 7. Danh sách

- **Bullet List** (`<ul>`) - Danh sách không thứ tự
- **Ordered List** (`<ol>`) - Danh sách có thứ tự

### 8. Đoạn mã (Code Block)

- Code block với syntax highlighting (được xử lý bởi StarterKit)
- Styling: nền màu `bg-muted`, rounded corners, overflow-x-auto

### 9. Trích dẫn (Blockquote)

- Blockquote với border trái, padding, và italic style

### 10. Liên kết (Links)

- Chèn liên kết từ URL
- Tự động mở trong tab mới (`target="_blank"`)
- Rel attributes: `noopener noreferrer`
- Có thể áp dụng lên vùng text đã chọn hoặc insert khi không có selection
- Protocol mặc định: `https`

### 11. Hình ảnh (Images)

**Hai cách chèn ảnh:**

1. **URL trực tiếp**: Nhập URL ảnh hợp lệ
2. **Upload trực tiếp**: Upload file ảnh từ máy tính

**Tính năng upload:**

- Sử dụng hook `useFileUpload`
- Progress bar hiển thị tiến độ upload
- Validation: chỉ chấp nhận file ảnh
- Error handling với thông báo lỗi rõ ràng
- Ảnh được style với `rounded-xl`

**URL validation:**

Hỗ trợ các định dạng ảnh thông qua `isSupportedImageUrl()`

### 12. Video (Videos)

**Hỗ trợ nhiều nguồn video:**

1. **YouTube & Vimeo** - Embedded via iframe
2. **File video trực tiếp** - `.mp4`, `.webm`, `.ogg`

**EmbeddedMedia Node tùy chỉnh:**

- `provider`: 'file', 'youtube', 'vimeo'
- `kind`: 'embed' (cho YouTube/Vimeo), 'file' (cho video file)
- `title`: Tiêu đề video
- Render HTML với `aspect-video` cho responsive
- iframe có các permissions: accelerometer, autoplay, clipboard-write, encrypted-media, gyroscope, picture-in-picture, web-share
- Video file có controls, playsinline, preload="metadata"

**Preview:** Hiển thị preview trước khi chèn

### 13. Undo/Redo

- **Undo** - Hoàn tác thao tác (chỉ active khi `canUndo` là true)
- **Redo** - Làm lại thao tác (chỉ active khi `canRedo` là true)

## Custom Extensions

### FontSize Extension

Custom TipTap extension để hỗ trợ font size inline:

- Global attribute trên `textStyle`
- Commands: `setFontSize`, `unsetFontSize`
- Render HTML với inline style `font-size`

### Indent Extension

Custom TipTap extension cho thụt đầu dòng:

- Attribute `data-indent` trên các block nodes
- Commands: `setIndent`, `indent`, `outdent`
- Clamp indent level từ 0-5
- Render CSS `margin-left: ${level * 2}rem`

### EmbeddedMedia Node

Custom block node cho media nhúng:

- `group: 'block'`, `atom: true`, `draggable: true`, `selectable: true`
- Parse HTML từ `<figure data-blog-media>` với iframe/video con
- Render:
  - Nếu `kind === 'embed'`: iframe với aspect ratio
  - Nếu là file: `<video>` element với controls
- Attributes: `src`, `provider`, `kind`, `title`

## UI/UX Features

### Toolbar

- Toolbar responsive với flex-wrap
- Các nút có states: active (highlighted), disabled (khi editor không có hoặc component disabled)
- Tooltips với `title` attribute
- Consistent styling với `min-w-9`

### Dialogs

Dialog modal cho việc nhập URL media:

**Link Dialog:**

- Tiêu đề: "Chèn liên kết"
- Input URL
- Validation: phải là URL http(s) hoặc đường dẫn nội bộ
- Preview: không có

**Image Dialog:**

- Tiêu đề: "Chèn ảnh từ URL"
- Input Image URL
- Preview: hiển thị ảnh với `max-h-60`, `object-cover`
- Validation: URL ảnh hợp lệ

**Video Dialog:**

- Tiêu đề: "Chèn video từ URL"
- Input Video URL
- Preview: iframe (embed) hoặc video element (file)
- Validation: chỉ hỗ trợ YouTube, Vimeo, mp4, webm, ogg

**Dialog Features:**

- Auto-focus input
- Error alerts với variant "destructive"
- Cancel/Submit buttons
- Preview cập nhật real-time

### Loading States

- Upload progress bar với component `Progress`
- Spinner khi đang upload
- Text mô tả trạng thái

### Error Handling

- Inline upload errors
- Dialog validation errors
- Alert component với variant destructive
- Error messages rõ ràng bằng tiếng Việt

### Accessibility

- Proper `title` attributes cho buttons
- Labels cho inputs
- Dialog với proper semantics
- Color pickers có `title` attribute

## Props Interface

```typescript
type BlogEditorProps = {
  value: string; // HTML content
  onChange: (value: string) => void; // Callback khi content thay đổi
  disabled?: boolean; // Optional: disable editor
};
```

## Editor State

State được theo dõi qua `useEditorState`:

```typescript
type EditorState = {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isHeading2: boolean;
  isHeading3: boolean;
  isBulletList: boolean;
  isOrderedList: boolean;
  isBlockquote: boolean;
  isCodeBlock: boolean;
  canUndo: boolean;
  canRedo: boolean;
  textAlign: "left" | "center" | "right" | "justify";
  fontSize: string;
  textColor: string;
  highlightColor: string;
  indent: number;
};
```

## Content Normalization

Hàm `normalizeEditorHtml()` được sử dụng để:

- Trim whitespace
- Loại bỏ empty paragraph (`<p></p>`)
- Convert về empty string khi không có nội dung

## Media URL Normalization

Sử dụng các helper từ `@/lib/blog`:

- `normalizeBlogMediaUrl()` - normalize URL
- `parseVideoMediaUrl()` - Parse video URL và trích xuất provider/kind/src
- `restoreEmbeddedMediaHtml()` - Restore embedded media từ HTML
- `isSupportedImageUrl()` - Validate image URL

## Styling

Editor sử dụng Tailwind CSS v��i các classes:

- Editor content: `min-h-72 px-4 py-3` với nhiều utility classes cho ProseMirror elements
- Toolbar: `flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-3`
- Container: `space-y-3`

**ProseMirror styles:**

- Selected node: `ring-2 ring-primary`
- Links: `cursor-pointer text-primary underline`
- Blockquote: `border-l pl-4 italic`
- Figures: `my-6 overflow-hidden`
- Iframe: `aspect-video w-full rounded-xl border-0`
- Lists: `pl-6` với `list-disc` hoặc `list-decimal`
- Code blocks: `overflow-x-auto rounded-xl bg-muted p-4`
- Videos: `w-full rounded-xl`

## Dependencies

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/core": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-link": "^2.x",
  "@tiptap/extension-image": "^2.x",
  "@tiptap/extension-underline": "^2.x",
  "@tiptap/extension-text-align": "^2.x",
  "@tiptap/extension-text-style": "^2.x",
  "@tiptap/extension-color": "^2.x",
  "@tiptap/extension-highlight": "^2.x",
  "lucide-react": "^0.x"
}
```

## Hooks Sử Dụng

- `useFileUpload` từ `@/hooks` - cho upload ảnh
- `useEditor` từ `@tiptap/react` - TipTap editor instance
- `useEditorState` từ `@tiptap/react` - Track editor state
- `useRef` - cho file input
- `useState` - cho dialog state
- `useEffect` - sync editor với props

## UI Components Sử Dụng

- `@/components/ui/button`
- `@/components/ui/dialog`
- `@/components/ui/input`
- `@/components/ui/label`
- `@/components/ui/progress`
- `@/components/ui/alert`
- `@/components/ui/spinner`

## Integration

Component được sử dụng trong:

- `src/app/blogs/new/page.tsx` - Tạo blog mới
- `src/app/blogs/[id]/edit/page.tsx` - Chỉnh sửa blog

## Notes

- Editor sử dụng `immediatelyRender: false` để tránh SSR issues
- Content được normalized trước khi lưu và hiển thị
- Embedded media được lưu dưới dạng custom node với `data-blog-media`
- Editor có thể bị disable qua prop `disabled`
- Sync hai chiều với parent component qua `value` và `onChange`
