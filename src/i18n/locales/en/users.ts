export const users = {
  title: "Users",
  profile: {
    title: "User Profile",
    description: "Personal information and settings for this user.",
    On: "On",
    Off: "Off",
    settings: "Settings",
    settingsDescription: "Personal preferences and dashboard options.",
    settingsItems: {
      enabled: "Enabled",
      notifications: "Notifications",
      search_bar: "Search Bar",
      list_sidebar: "List Sidebar",
      bulk_actions: "Bulk Actions",
      form_sidebar: "Form Sidebar",
      dashboard: "Dashboard",
      desk_theme: "Desk Theme",
      time_zone: "Time Zone",
    },
    importantInformation: {
      title: "Important Information",
      description: "Key account identity for this user.",
      core_identity: "Core Identity",
      items: {
        full_name: "Full Name",
        username: "Username",
        email: "Email",
        user_type: "User Type",
      },
    },
    roles: {
      title: "Roles",
      description: "All roles assigned to this account.",
      no_role_assigned: "No role assigned",
    },
    active_sessions: {
      title: "Active Sessions",
      description:
        "Devices and browser sessions currently linked to this user.",
      current: "Current",
      active: "Active",
    },
  },
} as const;
