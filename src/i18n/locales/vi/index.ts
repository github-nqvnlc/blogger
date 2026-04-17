import { metadata } from "./metadata";
import { common } from "./common";
import { home } from "./home";
import { login } from "./login";
import { sidebar } from "./sidebar";
import { settings } from "./settings";
import { profile } from "./profile";
import { admin } from "./admin";
import { errors } from "./errors";
import { table } from "./table";
import { pagination } from "./pagination";
import { blogDepartments } from "./blogDepartments";
import { blogCategories } from "./blogCategories";
import { blogTopics } from "./blogTopics";
import { blogTags } from "./blogTags";
import { devDoc } from "./devDoc";

export const vi = {
  metadata,
  common,
  home,
  login,
  sidebar,
  settings,
  profile,
  admin,
  errors,
  table,
  pagination,
  blogDepartments,
  blogCategories,
  blogTopics,
  blogTags,
  devDoc,
} as const;
