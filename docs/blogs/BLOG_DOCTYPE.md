# Blogs App — DocType Documentation

## 1. Tổng quan

Module `blogs` quản lý toàn bộ nội dung blog trong hệ thống Frappe. Bao gồm 9 DocType phục vụ phân loại, tạo nội dung, gắn nhãn và bình luận.

## 2. Danh sách DocType

| DocType | Mục đích | Kiểu | Quan hệ |
|---|---|---|---|
| `posts` | Bài viết chính | Single | Cha của post_topics, post_tags, comments |
| `blog_departments` | Bộ phận quản lý blog | Single | Cha của categories, topics, posts |
| `categories` | Danh mục bài viết | Single | Con của blog_departments, cha của posts |
| `topics` | Chủ đề nội bộ theo bộ phận | Single | Con của blog_departments, liên kết posts qua post_topics |
| `tags` | Nhãn toàn hệ thống | Single | Liên kết posts qua post_tags |
| `comments` | Bình luận + reply lồng nhau | Single | Con của posts |
| `post_topics` | Bảng nối posts ↔ topics | Child (n-n) | Con của posts, liên kết topics |
| `post_tags` | Bảng nối posts ↔ tags | Child (n-n) | Con của posts, liên kết tags |
| `post-categories` | DocType dự phòng, chưa dùng | Child | Hiện không hoạt động |

## 3. Cấu trúc dữ liệu

```
blog_departments
    ├── categories         (mỗi bộ phận có nhiều danh mục)
    │     └── posts        (mỗi danh mục có nhiều bài viết)
    ├── topics              (mỗi bộ phận có nhiều chủ đề)
    │     └── post_topics   (bảng nối posts ↔ topics)
    └── posts
          ├── post_tags     (bảng nối posts ↔ tags)
          └── comments      (bình luận thuộc bài viết)
                └── comments (reply lồng nhau)
```

### posts

Bảng trung tâm, chứa nội dung bài viết.

| Field | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `title` | Data | ✅ | Tiêu đề bài viết |
| `department` | Link → blog_departments | ✅ | Bộ phận quản lý |
| `category` | Link → categories | ✅ | Danh mục chính |
| `slug` | Data | | Mã thân thiện cho URL |
| `author` | Link → User | | Người chịu trách nhiệm |
| `published_at` | Datetime | | Thời điểm xuất bản |
| `thumb` | Attach Image | ✅ | Ảnh đại diện |
| `thumb_desc` | Small Text | | Mô tả ngắn cho thumbnail |
| `excerpt` | Small Text | | Tóm tắt nội dung |
| `status` | Select | | `Draft`, `Published` |
| `visibility` | Select | | `Public`, `Private` |
| `view_count` | Data | | Số lượt xem |
| `content` | Text Editor | | Nội dung chính |

Validate trong `posts.py`:

- `slug` được `strip()`
- bắt buộc có `department`, `category`
- `category` phải tồn tại và thuộc cùng `department`
- không dùng `category` inactive

Hành vi form (`posts.js`):

- dropdown `category` chỉ hiện danh mục cùng `department` và `is_active = 1`
- khi đổi `department`, `category` không cùng bộ phận sẽ bị xóa

### blog_departments

Thực thể gốc, chia phạm vi quản lý blog theo bộ phận.

| Field | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `department_name` | Data | ✅ | Tên bộ phận |
| `department_code` | Data | ✅ | Mã bộ phận |
| `description` | Small Text | | Mô tả |
| `is_active` | Check | | Trạng thái hoạt động |
| `sort_order` | Int | | Thứ tự hiển thị |

Validate trong `blog_departments.py`:

- `department_name`, `department_code` được `strip()`
- `department_code` được chuyển uppercase
- không cho phép trùng `department_name` (normalized)
- không cho phép trùng `department_code` (không phân biệt hoa thường)

### categories

Danh mục chính của bài viết, thuộc từng bộ phận.

| Field | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `category` | Data | ✅ | Tên danh mục |
| `department` | Link → blog_departments | ✅ | Bộ phận sở hữu |
| `description` | Data | | Mô tả ngắn |
| `is_active` | Check | | Trạng thái hoạt động |
| `sort_order` | Int | | Thứ tự hiển thị |
| `slug` | Data | | Mã thân thiện URL |

Validate trong `categories.py`:

- `category`, `slug` được `strip()`
- bắt buộc có `category`, `department`
- không cho phép trùng `category` trong cùng `department` (normalized)

### topics

Chủ đề nội bộ theo bộ phận, khác `categories` ở chỗ 1 bài viết có thể gắn nhiều topics.

| Field | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `topic` | Data | ✅ | Tên chủ đề |
| `department` | Link → blog_departments | ✅ | Bộ phận sở hữu |
| `desc` | Data | | Mô tả |
| `is_active` | Check | | Trạng thái hoạt động |
| `slug` | Data | | Mã thân thiện |

Validate trong `topics.py`:

- `topic`, `slug` được `strip()`
- không cho phép trùng `topic` trong cùng `department` (normalized)

Validate từ `post_topics`:

- chỉ gắn topic active
- `topic.department` phải bằng `post.department`

### tags

Hệ nhãn dùng chung toàn hệ thống, không bị ràng buộc theo `department`.

| Field | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `tag_name` | Data | ✅ | Tên nhãn |
| `slug` | Data | | Mã thân thiện |
| `description` | Small Text | | Giải thích ý nghĩa |
| `is_active` | Check | | Trạng thái hoạt động |

Validate trong `tags.py`:

- `tag_name`, `slug` được `strip()`
- không cho phép trùng `tag_name` (normalized)
- không cho phép trùng `slug` nếu có giá trị (normalized)

Validate từ `post_tags`:

- chỉ gắn tag active
- không cho phép trùng cặp `post` + `tag`

### comments

Bình luận trên bài viết, hỗ trợ reply lồng nhau qua `comment_answer`.

| Field | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `post` | Link → posts | ✅ | Bài viết được bình luận |
| `user` | Link → User | ✅ | Người bình luận |
| `comment_answer` | Link → comments | | ID comment cha nếu là reply |
| `nội_dung` | Text Editor | | Nội dung bình luận |

Lưu ý: `nội_dung` dùng ký tự Unicode trong fieldname, có thể gây bất tiện khi viết script/API.

Hiện tại `comments.py` chưa có validate. Nên bổ sung:

- nội dung không rỗng
- reply phải cùng `post`
- không reply vào comment không tồn tại

### post_topics

Bảng nối nhiều-nhiều giữa `posts` và `topics`.

| Field | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `post` | Link → posts | ✅ | Bài viết được gắn chủ đề |
| `topic` | Link → topics | ✅ | Chủ đề được gắn |

Validate trong `post_topics.py`:

- bắt buộc có `post`, `topic`
- không cho phép trùng cặp `post` + `topic`
- `post.department` phải tồn tại
- `topic.department` phải bằng `post.department`
- không gắn topic inactive

Hành vi form (`post_topics.js`):

- query custom chỉ hiện topics cùng `department` với `post` và `is_active = 1`

### post_tags

Bảng nối nhiều-nhiều giữa `posts` và `tags`.

| Field | Kiểu | Bắt buộc | Ý nghĩa |
|---|---|---|---|
| `post` | Link → posts | ✅ | Bài viết được gắn tag |
| `tag` | Link → tags | ✅ | Tag được gắn |

Validate trong `post_tags.py`:

- bắt buộc có `post`, `tag`
- không cho phép trùng cặp `post` + `tag`
- không gắn tag inactive

Hành vi form (`post_tags.js`):

- chỉ hiện tags có `is_active = 1`

### post-categories

DocType dự phòng, hiện không hoạt động. Đây là table (`istable = 1`) nhưng chỉ có một `Section Break`, không có field liên kết dữ liệu.

Trong tương lai có thể dùng nếu mở rộng sang mô hình 1 bài viết có nhiều danh mục. Nếu không dùng, nên xóa.

## 4. Patches

### setup_blog_roles_and_permissions.py

Chạy khi `bench migrate`, tạo roles và thiết lập permissions.

- Tạo role `Admin Blogs`
- Tạo role `Content Writer Blogs`
- Grant quyền read-only (read, email, print, share) cho tất cả roles khác trên 9 doctype blog

### add_default_blog_department.py

Chạy khi `bench migrate`, thiết lập dữ liệu mặc định.

- Tạo bộ phận mặc định `Default Blog Department` (code: `DEFAULT`)
- Tạo danh mục mặc định `Uncategorized`
- Backfill `department` còn thiếu cho categories, topics, posts
- Backfill `category` còn thiếu cho posts

## 5. Roles & Permissions

Roles được tạo tự động qua patch `setup_blog_roles_and_permissions.py` khi migrate.

| DocType | System Manager | Admin Blogs | Content Writer Blogs | Tất cả roles khác |
|---|---|---|---|---|
| posts | Full | Full | Full | Read only |
| blog_departments | Full | Full | Read only | Read only |
| categories | Full | Full | Full | Read only |
| topics | Full | Full | Full | Read only |
| tags | Full | Full | Full | Read only |
| comments | Full | Full | Full | Read only |
| post_topics | Full | Full | Full | Read only |
| post_tags | Full | Full | Full | Read only |
| post-categories | Full | Full | Full | Read only |

Chi tiết quyền:

| Quyền | Ý nghĩa |
|---|---|
| Create | Tạo bản ghi mới |
| Read | Xem danh sách và chi tiết |
| Write | Chỉnh sửa bản ghi |
| Delete | Xóa bản ghi |
| Email | Gửi email liên quan |
| Print | In bản ghi |
| Share | Chia sẻ bản ghi |
| Export | Xuất dữ liệu |
| Report | Xem báo cáo |

## 6. Lưu ý triển khai

### Cần bổ sung

- [ ] `posts`: validate unique cho `slug`, kiểm tra `title`, `content`, `status`, `visibility`, `view_count` là số hợp lệ
- [ ] `comments`: validate nội dung không rỗng, reply cùng `post`
- [ ] `categories`, `topics`, `tags`: validate unique cho `slug`
- [ ] `post_topics`: cập nhật schema JSON để `topic` có `reqd: 1`
- [ ] `post_tags`, `post_topics`: thêm unique index ở database cho cặp `post` + `tag` / `topic`
- [ ] `blog_departments`: nếu muốn khóa dữ liệu khi inactive, cần validate ở các doctype con

### Đặc điểm cần lưu ý

- `tags` là global, không bị ràng buộc theo `department`
- `post-categories` hiện không hoạt động, cân nhắc xóa
- Field `nội_dung` trong `comments` dùng Unicode trong fieldname, có thể gây khó khi viết script/API — cân nhắc đổi thành `noi_dung` hoặc `content`
- `view_count` trong `posts` đang là `Data`, nên đổi sang `Int` nếu cần thống kê
- `content` trong `posts` là `Text Editor`, có thể mở rộng thành `Rich Text` nếu cần định dạng phong phú
