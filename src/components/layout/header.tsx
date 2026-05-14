"use client";

import React, { useEffect, useState } from "react";
import { useAllBlogDepartments, useAllCategories } from "@/hooks/useGuestMetadata";
import { useIsMobile } from "@/hooks/use-mobile";
import { BlogDepartment, Category } from "@/types/blogs";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/hooks";
import Logo from "@public/images/windify-logo.png";
import Image from "next/image";

const Header = () => {
  const isMobile = useIsMobile(1024);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobileMenuOpen = isMobile && isMenuOpen;
  const { locale } = useLanguage();
  const { data: departments } = useAllBlogDepartments();
  const { data: categories } = useAllCategories();

  const [openDept, setOpenDept] = useState<string | null>(null);

  const toggleDept = (name: string) => setOpenDept(prev => (prev === name ? null : name));

  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="relative z-10 bg-white/55 py-4 px-5 shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-black/5 backdrop-blur-md transition-colors duration-300">
        <div className="inner flex justify-between items-center">
          <a href={`/${locale}`} className="flex items-center shrink-0">
            <Image
              src={Logo}
              alt="Windify Logo"
              height={48}
              className="h-6 lg:h-8 w-auto object-contain"
            />
          </a>
          {isMobile ? (
            <>
              {/* Hamburger Button */}
              <button
                aria-label="Toggle navigation menu"
                aria-expanded={isMobileMenuOpen}
                onClick={toggleMenu}
                className="relative flex flex-col justify-center items-center gap-[4px] rounded-md focus:outline-none"
              >
                <span
                  className={`block h-[2px] w-4 bg-blue-midnight transition-all duration-300 ease-in-out origin-center ${
                    isMobileMenuOpen ? "rotate-45 translate-y-[6px]" : ""
                  }`}
                />
                <span
                  className={`block h-[2px] w-4 bg-blue-midnight transition-all duration-300 ease-in-out ${
                    isMobileMenuOpen ? "opacity-0 scale-x-0" : ""
                  }`}
                />
                <span
                  className={`block h-[2px] w-4 bg-blue-midnight transition-all duration-300 ease-in-out origin-center ${
                    isMobileMenuOpen ? "-rotate-45 -translate-y-[6px]" : ""
                  }`}
                />
              </button>
            </>
          ) : (
            /* Desktop Nav */
            <div className="flex gap-1 items-center">
              <ul className="flex items-center gap-1 text-blue-midnight">
                {departments?.map((item: BlogDepartment) => {
                  const deptCategories =
                    categories?.filter((cat: Category) => {
                      const dept = cat.department;
                      return typeof dept === "string"
                        ? dept === item.name
                        : dept?.name === item.name;
                    }) ?? [];

                  return (
                    <li
                      key={item.name}
                      className="group relative"
                      onMouseLeave={() => setOpenDept(null)}
                    >
                      {/* Department trigger */}
                      <button
                        onMouseEnter={() => setOpenDept(item.name)}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer font-semibold text-blue-midnight transition-colors duration-200 hover:text-[#fb421c]"
                      >
                        {item.department_name}
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openDept === item.name ? "rotate-180" : ""}`}
                        />
                      </button>

                      {/* Dropdown */}
                      <div
                        className={`absolute left-0 top-full z-50 min-w-[180px] origin-top overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5 transition-all duration-200 ${
                          openDept === item.name
                            ? "pointer-events-auto translate-y-0 opacity-100 scale-y-100"
                            : "pointer-events-none -translate-y-1 opacity-0 scale-y-95"
                        }`}
                      >
                        <ul className="py-1">
                          <li>
                            <a
                              href={`/${locale}/${item.department_code}`}
                              onClick={() => setOpenDept(null)}
                              className="block w-full px-4 py-2 text-left text-sm font-medium text-blue-midnight hover:bg-gray-50 hover:text-[#fb421c] transition-colors duration-150"
                            >
                              Tất cả
                            </a>
                          </li>
                          {deptCategories.map((cat: Category) => (
                            <li key={cat.name}>
                              <a
                                href={`/${locale}/${item.department_code}?category=${cat.slug}`}
                                onClick={() => setOpenDept(null)}
                                className="block w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 hover:text-[#fb421c] transition-colors duration-150"
                              >
                                {cat.category}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </nav>

      <div
        className={`fixed inset-0 top-0 h-svh overflow-y-auto bg-surface-container pt-16 transition-transform duration-300 lg:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <ul className="flex flex-col">
          {departments?.map((item: BlogDepartment) => {
            const deptCategories =
              categories?.filter((cat: Category) => {
                const dept = cat.department;
                return typeof dept === "string" ? dept === item.name : dept?.name === item.name;
              }) ?? [];
            const isOpen = openDept === item.name;

            return (
              <li key={item.name} className="w-full border-b border-gray-200">
                {/* Department row */}
                <button
                  onClick={() => toggleDept(item.name)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-base font-bold text-blue-midnight"
                >
                  <span>{item.department_name}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openDept === item.name ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Categories sub-list */}
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <ul className="flex flex-col px-5 pb-2">
                    <li>
                      <a
                        href={`/${locale}/${item.department_code}`}
                        onClick={closeMenu}
                        className="block w-full py-3 text-left text-sm font-medium text-blue-midnight transition-colors duration-150 hover:text-[#fb421c]"
                      >
                        Tất cả
                      </a>
                    </li>
                    {deptCategories.length > 0 ? (
                      deptCategories.map((cat: Category) => (
                        <li key={cat.name}>
                          <a
                            href={`/${locale}/${item.department_code}?category=${cat.slug}`}
                            onClick={closeMenu}
                            className="block w-full py-3 text-left text-sm text-gray-600 transition-colors duration-150 hover:text-[#fb421c]"
                          >
                            {cat.category}
                          </a>
                        </li>
                      ))
                    ) : (
                      <li className="py-3 text-sm text-gray-400">Không có danh mục</li>
                    )}
                  </ul>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
};

export default Header;
