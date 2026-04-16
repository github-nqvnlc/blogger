import { DepartmentDetail } from "@/components/blogs/departments";

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ departmentId: string }>;
}) {
  const { departmentId } = await params;

  return <DepartmentDetail departmentId={departmentId} />;
}
