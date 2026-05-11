import Logo from "@/components/svgs/logo";
import React from "react";

const Header = () => {
  return (
    <header className=" fixed top-0 left-0 right-0 z-50 backdrop-blur-md">
      <nav className="px-5">
        <div className="inner flex justify-between items-center">
          <Logo />
          <div>
            <ul className="flex items-center gap-6 font-normal text-blue-midnight text-xl">
              <li>Dropshipping Platform</li>
              <li>Future Academy</li>
              <li>Agency</li>
              <li>Software Solution</li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
