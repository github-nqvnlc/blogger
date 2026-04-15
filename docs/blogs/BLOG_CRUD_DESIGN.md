# Blogs Module — CRUDS Design Specification

Tài liệu này trình bày chi tiết phân tích nghiệp vụ, mô hình dữ liệu, thiết kế API, kiến trúc UI components, và các trang CRUDS cho module quản lý Blogs. Mọi implementation phải tuân theo tài liệu này.

---

## 1. Tổng Quan Nghiệp Vụ

### 1.1. Phạm vi module

Module `Blogs` quản lý toàn bộ nội dung bài viết trong hệ thống, bao gồm:

- **Blog Departments**: bộ phận quản lý nội dung
- **Categories**: danh mục chính của bài viết
- **Topics**: nhóm chủ đề nội bộ theo từng department
- **Tags**: nhãn tự do dùng chung toàn hệ thống
- **Posts**: thực thể trung tâm của bài viết
- **Comments**: bình luận trên bài viết (hỗ trợ reply tree)

### 1.2. Phân biệt Category / Topic / Tag

| Khái niệm   | Phạm vi           | Số lượng / bài viết | Ràng buộc Department |
| ----------- | ------------------ | ------------------- | --------------------- |
| `Category`  | Toàn hệ thống     | 1 bài = 1 category  | Có                    |
| `Topic`     | Nội bộ department  | 1 bài = nhiều topic | Có (bắt buộc cùng dept) |
| `Tag`       | Global             | 1 bài = nhiều tag   | Không                 |

### 1.3. Trạng thái bài viết

| Field      | Giá trị              | Ý nghĩa                              |
| ---------- | -------------------- | ------------------------------------ |
| `status`   | `Draft`              | Bài nháp, chưa publish               |
| `status`   | `Published`          | Đã xuất bản                         |
| `status`   | `Archived`           | Đã lưu trữ                          |
| `visibility` | `Public`           | Hiển thị công khai                  |
| `visibility` | `Internal`         | Chỉ nội bộ                          |

---

## 2. Mô Hình Dữ Liệu (TypeScript Types)

File định nghĩa: `src/types/blogs.ts`

```ts
// ─── Core Entities ──────────────────────────────────────────

export interface BlogDepartment {
  name: string;
  department_name: string;
  department_code: string;
  description: string;
  is_active: number; // 1 = active, 0 = inactive
}

export interface Category {
  name: string;
  category: string;
  department: string;
  description: string;
  is_active: number;
  sort_order: number;
  slug: string;
}

export interface Topic {
  name: string;
  topic: string;
  department: string;
  desc: string;
  is_active: number;
  slug: string;
}

export interface Tag {
  name: string;
  tag_name: string;
  slug: string;
  description: string;
  is_active: number;
}

// ─── Post ──────────────────────────────────────────────────

export type PostStatus = "Draft" | "Published" | "Archived";
export type PostVisibility = "Public" | "Internal";

export interface Post {
  name: string;
  title: string;
  department: string;
  category: string;
  slug: string;
  author: string;
  published_at: string;
  thumb: string;
  thumb_desc: string;
  excerpt: string;
  status: PostStatus;
  visibility: PostVisibility;
  view_count: number;
  content: string;
}

// ─── Junction Tables ───────────────────────────────────────

export interface PostTopic {
  name: string;
  post: string;
  topic: string;
}

export interface PostTag {
  name: string;
  post: string;
  tag: string;
}

// ─── Comment ───────────────────────────────────────────────

export interface Comment {
  name: string;
  post: string;
  user: string;
  comment_answer: string | null;
  noi_dung: string;
  created_at?: string;
}

// ─── Assembled Data (sau khi FE assemble) ─────────────────

export interface AssembledPost extends Post {
  department: Pick<BlogDepartment, "name" | "department_name" | "department_code">;
  category: Pick<Category, "name" | "category" | "slug">;
  topics: Pick<Topic, "name" | "topic" | "slug">[];
  tags: Pick<Tag, "name" | "tag_name" | "slug">[];
  comments: AssembledComment[];
}

export interface AssembledComment extends Comment {
  replies: Comment[];
}
```

---

## 3. API Specifications

### 3.1. Base URL

```
NEXT_PUBLIC_API_BASE_URL → Frappe backend (quản lý cookie `sid`)
```

### 3.2. Endpoints Map

| CRUD       | Method | Endpoint                        | Body / Params               | Response        |
| ---------- | ------ | ------------------------------- | ---------------------------- | --------------- |
| List       | GET    | `/api/resource/posts`           | filters, fields, limit...   | `Post[]`        |
| Get one    | GET    | `/api/resource/posts/{name}`    | —                            | `Post`         |
| Create     | POST   | `/api/resource/posts`           | `Post` (partial)             | `Post`         |
| Update     | PUT    | `/api/resource/posts/{name}`    | `Partial<Post>`              | `Post`         |
| Delete     | DELETE | `/api/resource/posts/{name}`    | —                            | `{ message }`  |

### 3.3. Metadata Endpoints

| Mục đích           | Method | Endpoint                        | Filters                       |
| ------------------ | ------ | ------------------------------- | ----------------------------- |
| Danh sách dept     | GET    | `/api/resource/blog_departments`| `is_active = 1`               |
| Danh sách category | GET    | `/api/resource/categories`      | `is_active = 1`, dept filter  |
| Danh sách topic    | GET    | `/api/resource/topics`          | `is_active = 1`, dept filter  |
| Danh sách tag      | GET    | `/api/resource/tags`            | `is_active = 1`               |
| Post topics        | GET    | `/api/resource/post_topics`     | `post = {name}`               |
| Post tags          | GET    | `/api/resource/post_tags`       | `post = {name}`               |
| Post comments      | GET    | `/api/resource/comments`        | `post = {name}`               |

### 3.4. Create / Update Topics & Tags

| Thao tác          | Method | Endpoint                        | Body                          |
| ----------------- | ------ | ------------------------------- | ----------------------------- |
| Thêm topic vào post | POST | `/api/resource/post_topics`   | `{ post, topic }`             |
| Xóa topic khỏi post| DELETE| `/api/resource/post_topics/{name}` | —                       |
| Thêm tag vào post   | POST | `/api/resource/post_tags`      | `{ post, tag }`               |
| Xóa tag khỏi post   | DELETE| `/api/resource/post_tags/{name}` | —                          |

### 3.5. Upload Thumbnail

| Thao tác  | Method | Endpoint    | Body                  | Response           |
| --------- | ------ | ----------- | --------------------- | ------------------ |
| Upload ảnh | POST  | `/api/method/upload_file` | `multipart/form-data` | `{ file_url }` |

---

## 4. Kiến Trúc Component

### 4.1. Folder Structure

```
src/
├── components/
│   └── blogs/
│       ├── index.ts                          ← barrel export
│       │
│       ├── posts/
│       │   ├── PostList.tsx                   ← trang danh sách bài viết
│       │   ├── PostCard.tsx                   ← card hiển thị bài viết
│       │   ├── PostDetail.tsx                 ← trang chi tiết bài viết
│       │   ├── PostForm.tsx                   ← form tạo / chỉnh sửa bài viết
│       │   ├── PostListFilter.tsx             ← bộ lọc danh sách
│       │   ├── PostStatusBadge.tsx            ← badge trạng thái
│       │   └── PostActions.tsx                ← menu actions (sửa/xóa/draft)
│       │
│       ├── metadata/
│       │   ├── CategorySelector.tsx           ← combobox chọn category
│       │   ├── TopicSelector.tsx              ← multi-select topics
│       │   ├── TagSelector.tsx                ← combobox chọn tags
│       │   └── DepartmentGuard.tsx           ← guard hiển thị theo dept
│       │
│       ├── comments/
│       │   ├── CommentList.tsx                ← danh sách bình luận (tree)
│       │   ├── CommentItem.tsx                ← một comment + reply
│       │   └── CommentForm.tsx                ← form viết bình luận
│       │
│       └── editor/
│           └── TiptapEditor.tsx               ← rich text editor
```

### 4.2. Dependencies cho TiptapEditor

```tsx
// Core packages
import { Tiptap } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";

// Custom extensions (cần implement)
import { FontSize } from "./extensions/FontSize";
import { Indent } from "./extensions/Indent";
import { EmbeddedMedia } from "./extensions/EmbeddedMedia";

// Icons
import {
  Bold, Italic, UnderlineIcon, Strikethrough, Code,
  Heading2, Heading3, List, ListOrdered, Quote,
  CodeSquare, Link2, ImageIcon, Video, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Minus, Plus, ChevronDown,
} from "lucide-react";
```

**package.json dependencies** (đã có sẵn):

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

### 4.3. Custom Extensions Implementation

**FontSize** (`src/components/blogs/editor/extensions/FontSize.ts`):
- Global attribute `fontSize` trên `textStyle`
- Commands: `setFontSize`, `unsetFontSize`
- Render inline style `font-size`

**Indent** (`src/components/blogs/editor/extensions/Indent.ts`):
- Attribute `data-indent` trên block nodes
- Commands: `setIndent`, `indent`, `outdent`
- Clamp level 0–5, render CSS `margin-left: ${level * 2}rem`

**EmbeddedMedia** (`src/components/blogs/editor/extensions/EmbeddedMedia.ts`):
- Custom block node: `group: 'block'`, `atom: true`, `draggable: true`
- Attributes: `src`, `provider`, `kind`, `title`
- Render iframe (YouTube/Vimeo) hoặc `<video>` element
- Parse/restore HTML với `<figure data-blog-media>` wrapper

---

## 5. Chi Tiết Từng Component

### 5.1. `PostList.tsx` — Trang Danh Sách Bài Viết

**Vị trí**: `src/components/blogs/posts/PostList.tsx`

**Chức năng**: Hiển thị danh sách bài viết dạng bảng với phân trang, filter, và bulk actions.

**UI Components sử dụng**:
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- `Card`, `CardHeader`, `CardContent`
- `Button` (variants: `default`, `outline`, `destructive`)
- `Badge`
- `Input`
- `Select` / `SelectTrigger` / `SelectContent` / `SelectItem`
- `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle`
- `AlertDialog` / `AlertDialogContent` / `AlertDialogAction` / `AlertDialogCancel`
- `Toaster` (từ `sonner`)

**State cần quản lý**:

```tsx
// Filter state
const [filters, setFilters] = useState<{
  department?: string;
  category?: string;
  status?: PostStatus | "all";
  search?: string;
}>({ status: "all" });

// Pagination
const [page, setPage] = useState(0);
const PAGE_SIZE = 20;

// Selection (bulk actions)
const [selectedIds, setSelectedIds] = useState<string[]>([]);
```

**Data fetching**:

```tsx
const { data: posts, isLoading } = useGetList<Post>("posts", {
  fields: ["name", "title", "slug", "thumb", "excerpt", "published_at", "status", "visibility", "view_count", "category", "department"],
  filters: [
    // filter theo department nếu có
    filters.department ? ["department", "=", filters.department] : null,
    // filter theo category nếu có
    filters.category ? ["category", "=", filters.category] : null,
    // filter theo status
    filters.status && filters.status !== "all" ? ["status", "=", filters.status] : null,
  ].filter(Boolean) as Filter[],
  limit_start: page * PAGE_SIZE,
  limit: PAGE_SIZE,
  orderBy: { field: "published_at", order: "desc" },
});
```

**Bulk actions**:
- Xóa nhiều bài viết cùng lúc
- Đổi trạng thái (Draft / Published / Archived)
- Chỉ hiển thị khi có item được chọn

**Action buttons**:
- `+ Tạo bài viết` → mở `PostForm` trong `Dialog`
- Edit → mở `PostForm` pre-filled
- Delete → `AlertDialog` xác nhận
- Toggle status (Draft ↔ Published)

### 5.2. `PostCard.tsx` — Card Hiển Thị Bài Viết

**Vị trí**: `src/components/blogs/posts/PostCard.tsx`

**Chức năng**: Hiển thị một bài viết dạng card (dùng cho grid view hoặc public listing).

**UI Components sử dụng**:
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Badge`
- `Button` (variant: `ghost`, size: `icon-sm`)

**Layout**:

```
┌──────────────────────────────────────┐
│  [Image]                             │
│  thumb                               │
├──────────────────────────────────────┤
│  [Badge: Category] [Badge: Status]   │
│                                      │
│  Title (bold, 2 lines max)           │
│  Excerpt (3 lines max)              │
│                                      │
│  Author | Date | View count          │
│                                      │
│  [Tag1] [Tag2] [Tag3+]               │
└──────────────────────────────────────┘
```

**Props**:

```tsx
interface PostCardProps {
  post: AssembledPost;
  variant?: "default" | "compact";
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}
```

### 5.3. `PostForm.tsx` — Form Tạo / Chỉnh Sửa Bài Viết

**Vị trí**: `src/components/blogs/posts/PostForm.tsx`

**Chức năng**: Form đầy đủ để tạo mới hoặc chỉnh sửa bài viết. Sử dụng trong `Dialog` (create) hoặc trang riêng (edit).

**Fields**:

| Field          | Component           | Required | Validation                  |
| -------------- | ------------------- | -------- | --------------------------- |
| Title          | `Input`             | ✓        | 3–200 ký tự                 |
| Department     | `Select`            | ✓        | Bắt buộc chọn trước category |
| Category       | `Select` (phụ thuộc dept) | ✓   | Phải cùng department         |
| Topics         | `TopicSelector`     | ✗        | Nhiều lựa chọn, cùng dept    |
| Tags           | `TagSelector`       | ✗        | Global, nhiều lựa chọn       |
| Slug           | `Input`             | ✗        | Auto-generate từ title nếu rỗng |
| Excerpt        | `Textarea`          | ✗        | Max 500 ký tự               |
| Thumbnail      | `Input[type=file]`  | ✗        | Image only, max 5MB         |
| Content        | `TiptapEditor`       | ✓        | HTML content                 |
| Status         | `Select`            | ✓        | Default: `Draft`             |
| Visibility     | `Select`            | ✓        | Default: `Public`            |
| Published At   | `Input[type=datetime-local]` | ✗   | Auto-set khi publish        |

**Logic quan trọng**:

1. **Department → Category dependency**: Khi chọn department, category list phải reload theo department mới.
2. **Topic filter**: Chỉ hiển thị topics thuộc department đã chọn.
3. **Slug auto-generate**: Tự động tạo slug từ title (lowercase, replace spaces → `-`, remove special chars).
4. **Auto-publish**: Khi chọn `status = Published`, auto-set `published_at = now()` nếu trường này rỗng.
5. **Unsaved changes**: Cảnh báo khi user thay đổi form mà chưa save.

**Submit flow**:

```tsx
async function handleSubmit(values: PostFormValues) {
  try {
    if (isEditing) {
      await updateDoc(postId, values);
      toast.success("Đã cập nhật bài viết");
    } else {
      const newPost = await createDoc(values);
      toast.success("Đã tạo bài viết");
      router.push(`/blogs/${newPost.name}`);
    }
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Lỗi không xác định");
  }
}
```

### 5.4. `PostListFilter.tsx` — Bộ Lọc Danh Sách

**Vị trí**: `src/components/blogs/posts/PostListFilter.tsx`

**Chức năng**: Collapsible filter bar trên trang danh sách.

**UI Components sử dụng**:
- `Card`, `CardContent`
- `Select` / `SelectTrigger` / `SelectContent` / `SelectItem`
- `Input`
- `Button`
- `Badge` (để hiển thị active filters)

**Filters**:

| Filter      | Component     | Options                        |
| ---------- | ------------- | ------------------------------ |
| Department | `Select`      | Danh sách departments (active)  |
| Category   | `Select`      | Theo department (phụ thuộc)    |
| Status     | `Select`      | Tất cả / Draft / Published / Archived |
| Visibility | `Select`      | Tất cả / Public / Internal     |
| Search     | `Input`       | Tìm trong title, excerpt        |

**Active filter badges**: Hiển thị các filter đang active với nút × để remove.

### 5.5. `CategorySelector.tsx` — Chọn Category

**Vị trí**: `src/components/blogs/metadata/CategorySelector.tsx`

**Chức năng**: Combobox chọn category. Tự động filter theo department đã chọn.

**UI Components**: `Select` / `SelectTrigger` / `SelectContent` / `SelectItem`

```tsx
// Reload khi department thay đổi
const { data: categories } = useGetList<Category>("categories", {
  filters: [
    ["is_active", "=", 1],
    ["department", "=", departmentId],
  ],
});
```

### 5.6. `TopicSelector.tsx` — Chọn Nhiều Topics

**Vị trí**: `src/components/blogs/metadata/TopicSelector.tsx`

**Chức năng**: Multi-select topics. Chỉ hiển thị topics cùng department với post.

**UI Components**: Có thể dùng:
- `Checkbox` trong `ScrollArea` (đơn giản)
- `Command` / `CommandList` / `CommandItem` (combobox-style)
- Hoặc `MultiSelect` custom

**State**: `selectedTopicIds: string[]`

**Validation**: Backend enforce `topic.department === post.department`. FE cũng nên validate trước để hiển thị UX tốt hơn.

### 5.7. `TagSelector.tsx` — Chọn Tags

**Vị trí**: `src/components/blogs/metadata/TagSelector.tsx`

**Chức năng**: Combobox chọn tags. Tags là global nên không cần filter theo department.

**UI Components**: `Command` (từ `cmdk`) — hỗ trợ search/filter tags.

```tsx
const { data: tags } = useGetList<Tag>("tags", {
  filters: [["is_active", "=", 1]],
});
```

### 5.8. `CommentList.tsx` — Danh Sách Bình Luận

**Vị trí**: `src/components/blogs/comments/CommentList.tsx`

**Chức năng**: Hiển thị comments dạng tree (comment gốc + replies lồng nhau).

**Data fetching**:

```tsx
const { data: rawComments } = useGetList<Comment>("comments", {
  filters: [["post", "=", postId]],
  orderBy: { field: "created_at", order: "asc" },
});

// Assemble tree
const assembled = useMemo(() => {
  const roots = rawComments?.filter(c => !c.comment_answer) ?? [];
  const replies = rawComments?.filter(c => c.comment_answer) ?? [];
  return roots.map(root => ({
    ...root,
    replies: replies.filter(r => r.comment_answer === root.name),
  }));
}, [rawComments]);
```

**UI Components**:
- `Card`, `CardContent`
- `Avatar`
- `Button` (reply action)
- `Separator`

**Recursive rendering**:

```tsx
function CommentItem({ comment }: { comment: AssembledComment }) {
  return (
    <div className="pl-4 border-l-2">
      <CommentContent comment={comment} />
      {comment.replies?.map(reply => (
        <CommentItem key={reply.name} comment={reply} />
      ))}
    </div>
  );
}
```

### 5.9. `CommentForm.tsx` — Form Viết Bình Luận

**Vị trí**: `src/components/blogs/comments/CommentForm.tsx`

**Chức năng**: Form gửi bình luận hoặc reply.

**Props**:

```tsx
interface CommentFormProps {
  postId: string;
  parentCommentId?: string | null; // null = comment gốc
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

**UI Components**: `Textarea`, `Button`

### 5.10. `TiptapEditor.tsx` — Rich Text Editor

**Vị trí**: `src/components/blogs/editor/TiptapEditor.tsx`

> **Chi tiết đầy đủ**: Xem `docs/blogs/tiptap-editor.md`

#### Props Interface

```tsx
type BlogEditorProps = {
  value: string;              // HTML content
  onChange: (value: string) => void;  // Callback khi content thay đổi
  disabled?: boolean;        // Optional: disable editor
};
```

#### Editor State

```tsx
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
  textAlign: 'left' | 'center' | 'right' | 'justify';
  fontSize: string;
  textColor: string;
  highlightColor: string;
  indent: number;
};
```

#### Extensions

```tsx
import { Tiptap } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
```

#### Custom Extensions

**FontSize Extension**: Global attribute trên `textStyle`. Commands: `setFontSize`, `unsetFontSize`.

**Indent Extension**: Attribute `data-indent` trên các block nodes. Commands: `setIndent`, `indent`, `outdent`. Clamp indent level từ 0–5. Render CSS `margin-left: ${level * 2}rem`.

**EmbeddedMedia Node**: Custom block node cho media nhúng (`group: 'block'`, `atom: true`, `draggable: true`, `selectable: true`). Attributes: `src`, `provider`, `kind`, `title`. Render:
- Nếu `kind === 'embed'`: iframe với aspect ratio (YouTube/Vimeo)
- Nếu là file: `<video>` element với controls

#### Toolbar Features

| Feature          | Extension             | Chi tiết                             |
| --------------- | -------------------- | ----------------------------------- |
| Bold            | StarterKit            | `<strong>`                          |
| Italic          | StarterKit            | `<em>`                              |
| Underline       | Underline             | `<u>`                               |
| Strikethrough   | StarterKit            | `<s>`                               |
| Heading 2/3     | StarterKit            | `<h2>`, `<h3>`                     |
| Bullet list     | StarterKit            | `<ul>`                              |
| Ordered list    | StarterKit            | `<ol>`                              |
| Blockquote      | StarterKit            | `<blockquote>` với border trái       |
| Code block      | StarterKit            | Syntax highlighting, nền `bg-muted` |
| Link            | Link                  | URL validation, `target="_blank"`    |
| Image           | Image                 | URL hoặc upload qua `useFileUpload` |
| Video           | EmbeddedMedia         | YouTube, Vimeo, mp4/webm/ogg       |
| Text align      | TextAlign             | left/center/right/justify          |
| Font size       | Custom FontSize       | 12/14/16/18/24/32 px              |
| Text color      | Color + TextStyle     | Color picker, mặc định `#111827`   |
| Highlight       | Highlight             | Color picker, mặc định `#fef08a`  |
| Indent/Outdent  | Custom Indent         | 0–5 levels                         |
| Undo/Redo       | StarterKit            | Chỉ active khi `canUndo/canRedo`   |

#### Image Upload

```tsx
// Sử dụng useFileUpload hook
const { upload, loading, progress } = useFileUpload();

async function handleImageUpload(file: File) {
  const uploaded = await upload(file, {
    doctype: "posts",
    docname: postId,
    fieldname: "content",
    isPrivate: false,
  });
  // Insert vào editor
  editor.chain().focus().setImage({ src: uploaded.file_url }).run();
}
```

**Validation**: Chỉ chấp nhận file ảnh. Progress bar hiển thị tiến độ upload.

#### Video Support

- **YouTube & Vimeo**: Embedded via iframe với `aspect-video` responsive
- **Direct video files**: `.mp4`, `.webm`, `.ogg` với `<video>` element
- iframe permissions: `accelerometer`, `autoplay`, `clipboard-write`, `encrypted-media`, `gyroscope`, `picture-in-picture`, `web-share`

#### Dialogs

| Dialog     | Tiêu đề               | Preview | Validation                        |
| --------- | --------------------- | ------- | -------------------------------- |
| Link      | Chèn liên kết         | Không   | URL http(s) hoặc đường dẫn nội bộ |
| Image     | Chèn ảnh từ URL       | Có      | URL ảnh hợp lệ (`isSupportedImageUrl`) |
| Video     | Chèn video từ URL     | Có      | YouTube, Vimeo, mp4, webm, ogg    |

**Dialog Features**: Auto-focus input, error alerts destructive, Cancel/Submit buttons, preview real-time.

#### Styling

**Toolbar**: `flex flex-wrap items-center gap-2 rounded-xl border bg-muted/30 p-3`

**Editor content**: `min-h-72 px-4 py-3`

**ProseMirror styles**:
- Selected node: `ring-2 ring-primary`
- Links: `cursor-pointer text-primary underline`
- Blockquote: `border-l pl-4 italic`
- Code blocks: `overflow-x-auto rounded-xl bg-muted p-4`
- Iframe: `aspect-video w-full rounded-xl border-0`
- Lists: `pl-6` với `list-disc` / `list-decimal`
- Figures: `my-6 overflow-hidden`

#### Content Normalization

```tsx
// Hàm normalizeEditorHtml() xử lý:
// - Trim whitespace
// - Loại bỏ empty paragraph (<p></p>)
// - Convert về empty string khi không có nội dung
```

#### Media URL Helpers (từ `@/lib/blog`)

- `normalizeBlogMediaUrl()` — normalize URL
- `parseVideoMediaUrl()` — Parse video URL, trích xuất provider/kind/src
- `restoreEmbeddedMediaHtml()` — Restore embedded media từ HTML
- `isSupportedImageUrl()` — Validate image URL

#### UI Components Sử Dụng

- `@/components/ui/button`
- `@/components/ui/dialog`
- `@/components/ui/input`
- `@/components/ui/label`
- `@/components/ui/progress`
- `@/components/ui/alert`
- `@/components/ui/spinner`

#### Integration Notes

- Dùng `immediatelyRender: false` để tránh SSR issues
- Sync hai chiều với parent qua `value` và `onChange`
- Component được sử dụng trong `src/app/blogs/new/page.tsx` và `src/app/blogs/[id]/edit/page.tsx`

---

## 6. Chi Tiết Các Trang (Pages)

### 6.1. Route Map

```
/blogs                           → PostList (danh sách, admin/editor)
/blogs/new                       → PostForm (tạo mới, standalone page)
/blogs/[id]                      → PostDetail (chi tiết bài viết)
/blogs/[id]/edit                 → PostForm (chỉnh sửa, standalone page)
/blogs/category/[slug]          → PostList (filter theo category, public)
/blogs/topic/[slug]              → PostList (filter theo topic, public)
/blogs/tag/[slug]                → PostList (filter theo tag, public)
```

### 6.2. `/blogs` — Trang Danh Sách (Admin)

**Layout**: Full-width với filter bar collapsible ở trên.

```
┌─────────────────────────────────────────────────────────┐
│ Header: "Quản Lý Bài Viết"              [+ Tạo bài viết] │
├─────────────────────────────────────────────────────────┤
│ [Department ▼] [Category ▼] [Status ▼] [Search...    ] │
│ [Active: Thông báo ×]                                  │
├─────────────────────────────────────────────────────────┤
│ ☑ Tất cả | 12 bài viết         [Xóa đã chọn] [Export]  │
├─────────────────────────────────────────────────────────┤
│ ☐ │ Tiêu đề          │ Danh mục   │ Trạng thái │ Ngày │
│ ☐ │ Lịch công tác... │ Thông báo  │ Published  │ ...  │
│ ☐ │ Hướng dẫn sử...  │ Hướng dẫn  │ Draft      │ ...  │
├─────────────────────────────────────────────────────────┤
│                        [← Trước] [1] [2] [3] [Sau →]    │
└─────────────────────────────────────────────────────────┘
```

### 6.3. `/blogs/[id]/edit` — Trang Chỉnh Sửa (Standalone)

**Layout**: Two-column layout.

```
┌──────────────────────────┬──────────────────────────────┐
│ Sidebar (300px)          │ Main Content                 │
│                          │                              │
│ [Tiêu đề bài viết    ]  │ ┌──────────────────────────┐ │
│ [Publication settings ]  │ │ Toolbar: B I U | H1 H2 | │
│                          │ ├──────────────────────────┤ │
│ Department: [▼]          │ │                          │ │
│ Category:   [▼]          │ │   Rich Text Editor       │ │
│ Status:     [▼]          │ │   (TiptapEditor)         │ │
│ Visibility: [▼]          │ │                          │ │
│ Published:  [📅]         │ │                          │ │
│                          │ └──────────────────────────┘ │
│ Topics                   │                              │
│ ☑ Sự kiện               │ Excerpt:                      │
│ ☐ Nội bộ                │ [Textarea...]                 │
│ ☐ Đào tạo               │                              │
│                          │ Thumbnail:                   │
│ Tags                     │ [Upload / Preview]          │
│ [Workshop] [Tin nóng]    │                              │
│ [+ Thêm tag]             │                              │
│                          │                              │
│ [Cancel]  [Save Draft] [Publish]                        │
└──────────────────────────┴──────────────────────────────┘
```

### 6.4. `/blogs/[id]` — Chi Tiết Bài Viết (Public)

**Layout**: Centered content layout với sidebar (related posts, categories).

```
┌────────────────────────────────────────────────────────┐
│ Breadcrumb: Home / Thông báo / Lịch công tác tuần 16 │
├────────────────────────────────────────────────────────┤
│                                                        │
│    [Banner Image]                                     │
│                                                        │
│  H1: Lịch công tác tuần 16                            │
│                                                        │
│  [Thông báo] [Published: 13/04/2026] [👁 124 lượt xem] │
│  [Sự kiện] [Workshop]                                  │
│                                                        │
│  ──────────────────────────────────────────────       │
│                                                        │
│  Full content (HTML rendered)                         │
│                                                        │
│  ──────────────────────────────────────────────       │
│                                                        │
│  Bình luận (3)                                         │
│  ┌──────────────────────────────────────────────┐    │
│  │ Avatar | user@example.com | 2 giờ trước      │    │
│  │ Nội dung bình luận                            │    │
│  │ [Trả lời]                                    │    │
│  │  └─ Avatar | admin | 1 giờ trước             │    │
│  │     Nội dung reply                            │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  [Viết bình luận...]                    [Gửi]         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 7. Tích Hợp Hooks

### 7.1. Sử Dụng Hooks cho Posts

```tsx
// ─── List posts ─────────────────────────────────────────
const { data, isLoading, error, mutate } = useGetList<Post>("posts", {
  filters: [["status", "=", "Published"]],
  limit: 20,
  orderBy: { field: "published_at", order: "desc" },
});

// ─── Get single post ─────────────────────────────────────
const { data: post, isLoading } = useGetDoc<Post>("posts", postId);

// ─── Create post ────────────────────────────────────────
const { createDoc, loading, isCompleted } = useCreateDoc<Post>("posts");

// ─── Update post ────────────────────────────────────────
const { updateDoc, loading } = useUpdateDoc<Post>("posts");

// ─── Delete post ─────────────────────────────────────────
const { deleteDoc, loading } = useDeleteDoc("posts");

// ─── File upload (thumbnail) ─────────────────────────────
const { upload, loading: uploading, progress } = useFileUpload();
```

### 7.2. Upload Thumbnail Flow

```tsx
async function handleThumbnailUpload(file: File) {
  const uploaded = await upload(file, {
    doctype: "posts",
    docname: postId,
    fieldname: "thumb",
    isPrivate: false,
  });

  await updateDoc(postId, { thumb: uploaded.file_url });
}
```

### 7.3. Manage Topics & Tags Sau Khi Tạo Post

```tsx
// Sau khi tạo post thành công
const newPost = await createDoc({ title, content, ... });

// Thêm topics
for (const topicId of selectedTopicIds) {
  await createDoc<PostTopic>("post_topics", { post: newPost.name, topic: topicId });
}

// Thêm tags
for (const tagId of selectedTagIds) {
  await createDoc<PostTag>("post_tags", { post: newPost.name, tag: tagId });
}
```

### 7.4. Topic / Tag Management CRUD

```tsx
// Tạo topic mới (admin)
const { createDoc } = useCreateDoc<Topic>("topics");

// Cập nhật tag
const { updateDoc } = useUpdateDoc<Tag>("tags");

// Xóa topic khỏi post (via junction table)
const { deleteDoc } = useDeleteDoc("post_topics");

// Cập nhật comment
const { updateDoc } = useUpdateDoc<Comment>("comments");
```

---

## 8. Validation & Error Handling

### 8.1. Frontend Validation

| Field       | Rule                                           | Error message              |
| ---------- | ---------------------------------------------- | -------------------------- |
| Title       | Required, 3–200 chars                          | Tiêu đề phải từ 3–200 ký tự |
| Department  | Required                                       | Vui lòng chọn bộ phận      |
| Category    | Required, must belong to selected department   | Danh mục không hợp lệ      |
| Topic       | Must belong to selected department             | Chủ đề không thuộc bộ phận này |
| Content     | Required (TiptapEditor không empty)            | Vui lòng nhập nội dung     |
| Thumbnail   | Image only (jpg/png/webp), max 5MB            | File phải là ảnh, tối đa 5MB |

### 8.2. Error Display

```tsx
// Dùng Toaster (sonner) cho toast notifications
import { toast } from "sonner";

toast.error("Xóa thất bại", { description: error.message });
toast.success("Đã tạo bài viết");
toast.warning("Bài viết chưa được publish");
```

### 8.3. Loading States

- **Skeleton**: Dùng `Skeleton` component cho các phần loading
- **Spinner**: Dùng `Spinner` component cho button loading
- **Disabled buttons**: Disable button khi đang loading

---

## 9. Responsive Design

| Breakpoint  | Layout                                |
| ---------- | ------------------------------------- |
| Mobile (< 768px) | Full-width, stacked layout     |
| Tablet (768–1024px) | 2-column where appropriate  |
| Desktop (> 1024px)  | Full layout with sidebar     |

**Table**: Chuyển thành card view trên mobile.

---

## 10. Checklist Triển Khai

- [ ] Tạo `src/types/blogs.ts`
- [ ] Tạo `PostCard` component
- [ ] Tạo `PostListFilter` component
- [ ] Tạo `PostList` với Table + Pagination + Bulk actions
- [ ] Tạo `CategorySelector`, `TopicSelector`, `TagSelector`
- [ ] Tạo `TiptapEditor` với toolbar đầy đủ
- [ ] Tạo `PostForm` tích hợp editor + metadata selectors
- [ ] Tạo `PostListFilter` page
- [ ] Tạo trang `/blogs` (list admin)
- [ ] Tạo trang `/blogs/new` (create)
- [ ] Tạo trang `/blogs/[id]` (detail public)
- [ ] Tạo trang `/blogs/[id]/edit` (edit)
- [ ] Tạo `CommentList` + `CommentForm`
- [ ] Tích hợp hooks vào toàn bộ components
- [ ] Error handling + loading states
- [ ] Toast notifications
- [ ] Responsive layout
