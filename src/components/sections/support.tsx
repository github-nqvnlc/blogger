"use client";

import { unbounded } from "@/lib/font";
import { useState } from "react";
import Image from "next/image";
import vectorBg from "@public/images/vector.png";

const Support = () => {
  const [email, setEmail] = useState("");

  return (
    <section className="relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image src={vectorBg} alt="" fill className="object-cover w-full h-full" />
      </div>

      {/* Content */}
      <div className="relative l-section">
        <div className="inner flex flex-col md:flex-row items-center gap-10 md:gap-16">
          {/* Left — Heading */}
          <div className="flex-1 w-full text-center md:text-left">
            <h2
              className={`${unbounded.className} text-3xl sm:text-4xl lg:text-5xl font-bold bg-linear-to-r from-blue-brand to-blue-muted bg-clip-text text-transparent leading-[1.2]`}
            >
              Để Windify đồng hành cùng bạn!
            </h2>
          </div>

          {/* Right — Newsletter form */}
          <div className="flex-1 w-full flex flex-col gap-4">
            <p className="font-semibold text-blue-midnight text-base sm:text-lg text-center md:text-left">
              Đăng kí nhận tin từ chúng tôi
            </p>

            <div className="flex items-center gap-3">
              {/* Email input */}
              <div className="relative flex-1 h-12 rounded-full bg-blue-ice">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email của bạn"
                  className="h-full w-full rounded-full bg-transparent px-5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              {/* Submit button */}
              <button
                type="button"
                className="h-12 rounded-full bg-blue-midnight px-5 sm:px-6 font-medium text-sm sm:text-base text-white whitespace-nowrap transition hover:opacity-85 active:scale-95"
              >
                Đăng kí
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Support;
