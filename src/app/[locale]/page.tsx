"use client";
import Introduce from "@/components/sections/introduce";
import FeaturePost from "@/components/sections/feature-post";
import { BlogDepartment } from "@/types/blogs";
import { useGetList } from "@/hooks";
import Contact from "@/components/sections/contact";

const Content = () => {
  const { data: blogsDepartment } = useGetList<BlogDepartment>("blog_departments", {
    fields: ["name", "department_name", "department_code", "description", "is_active", "creation"],
    filters: [["is_active", "=", "1"]],
    limit: 10,
  });

  return (
    <div>
      <Introduce />
      {blogsDepartment?.map((blogDepartment, index) => (
        <FeaturePost
          key={blogDepartment.name}
          title={blogDepartment.department_name}
          department_code={blogDepartment.name}
          odd={(index + 1) % 2 === 0}
        />
      ))}
      <Contact />
    </div>
  );
};

export default Content;
