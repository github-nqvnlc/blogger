import type { BlogDepartment } from "@/types/blogs";

export function getBlogDepartmentByCode(
  list: BlogDepartment[],
  code: string | undefined | null
): BlogDepartment | undefined {
  if (typeof code !== "string" || !code.trim()) return undefined;
  return list.find(row => row.department_code === code);
}

export function getBlogDepartmentByName(
  list: BlogDepartment[],
  name: string | undefined | null
): BlogDepartment | undefined {
  if (typeof name !== "string" || !name.trim()) return undefined;
  const id = name.trim();
  return list.find(row => row.name === id);
}
