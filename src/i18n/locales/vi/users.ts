export const users = {
  title: "Users",
  profile: {
    title: "User Profile",
    description: "Thông tin cá nhân và cài đặt cho tài khoản này.",
    On: "Kích hoạt",
    Off: "Tắt",
    settings: "Cài đặt cá nhân",
    settingsDescription: "Cài đặt cá nhân và tùy chọn dashboard.",
    settingsItems: {
      enabled: "Kích hoạt",
      notifications: "Thông báo",
      search_bar: "Thanh tìm kiếm",
      list_sidebar: "Thanh sidebar",
      bulk_actions: "Hành động nhanh",
      form_sidebar: "Thanh sidebar",
      dashboard: "Dashboard",
      desk_theme: "Giao diện",
      time_zone: "Múi giờ",
    },
    importantInformation: {
      title: "Thông tin quan trọng",
      description: "Thông tin quan trọng cho tài khoản này.",
      core_identity: "Định danh quan trọng",
      items: {
        full_name: "Họ và tên",
        username: "Tên đăng nhập",
        email: "Email",
        user_type: "Loại tài khoản",
      },
    },
    roles: {
      title: "Vai trò",
      description: "Tất cả vai trò được gán cho tài khoản này.",
      no_role_assigned: "Không có vai trò được gán",
    },
    active_sessions: {
      title: "Phiên đang hoạt động",
      description: "Thiết bị và trình duyệt hiện tại được liên kết với tài khoản này.",
      current: "Hiện tại",
      active: "Hoạt động",
    },
  },
} as const;
