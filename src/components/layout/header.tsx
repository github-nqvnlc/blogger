"use client";

import Logo from "@/components/svgs/logo";
import { useIsMobile } from "@/hooks/use-mobile";
import React, { useState } from "react";

const NAV_ITEMS = ["Dropshipping Platform", "Future Academy", "Agency", "Software Solution"];

const Header = () => {
  const isMobile = useIsMobile(1024);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md">
      <nav className="px-5">
        <div className="inner flex justify-between items-center">
          <Logo className="h-14 lg:h-22 w-auto" />

          {isMobile ? (
            <>
              {/* Hamburger Button */}
              <button
                aria-label="Toggle navigation menu"
                aria-expanded={isMenuOpen}
                onClick={toggleMenu}
                className="flex flex-col justify-center items-center w-8 h-8 gap-[4px] rounded-md focus:outline-none"
              >
                <span
                  className={`block h-[2px] w-4 bg-blue-midnight transition-all duration-300 ease-in-out origin-center ${
                    isMenuOpen ? "rotate-45 translate-y-[6px]" : ""
                  }`}
                />
                <span
                  className={`block h-[2px] w-4 bg-blue-midnight transition-all duration-300 ease-in-out ${
                    isMenuOpen ? "opacity-0 scale-x-0" : ""
                  }`}
                />
                <span
                  className={`block h-[2px] w-4 bg-blue-midnight transition-all duration-300 ease-in-out origin-center ${
                    isMenuOpen ? "-rotate-45 -translate-y-[6px]" : ""
                  }`}
                />
              </button>

              {/* Mobile Dropdown Menu */}
              <div
                className={`absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
                  isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <ul className="flex flex-col px-5 py-4 gap-0">
                  {NAV_ITEMS.map(item => (
                    <li key={item}>
                      <button
                        onClick={closeMenu}
                        className="w-full text-left py-3 text-md border-b border-gray-100 last:border-b-0 font-normal text-blue-midnight hover:text-blue-600 transition-colors duration-200"
                      >
                        {item}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            /* Desktop Nav */
            <div>
              <ul className="flex items-center gap-6 font-normal text-blue-midnight text-xl">
                {NAV_ITEMS.map(item => (
                  <li
                    key={item}
                    className="cursor-pointer hover:text-blue-600 transition-colors duration-200"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
