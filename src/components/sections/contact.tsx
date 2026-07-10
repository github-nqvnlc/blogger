"use client";

import { unbounded } from "@/lib/font";
import { useState } from "react";
import Image from "next/image";
import vectorBg from "@public/images/vector.png";

const Contact = () => {
  const [form, setForm] = useState({
    phone: "",
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: handle submit
  };

  const inputClass =
    "h-12 w-full rounded-full bg-blue-ice px-5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-brand/40 transition";

  return (
    <section className="relative overflow-hidden">
      {/* Vector top — flipped vertically */}
      <div className="absolute top-0 left-0 right-0 h-40 sm:h-52 pointer-events-none select-none">
        <Image
          src={vectorBg}
          alt=""
          fill
          className="object-cover object-bottom"
          style={{ transform: "scaleY(-1)" }}
        />
      </div>

      {/* Vector bottom — normal */}
      <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-52 pointer-events-none select-none">
        <Image src={vectorBg} alt="" fill className="object-cover object-top" />
      </div>

      <div className="relative l-section">
        <div className="inner">
          <div className="text-center mb-8 sm:mb-10">
            <h2
              className={`${unbounded.className} text-3xl sm:text-4xl lg:text-5xl font-bold bg-linear-to-r from-orange-accent-dark to-orange-vibrant bg-clip-text text-transparent leading-[1.2] mb-4`}
            >
              Đăng kí tư vấn miễn phí
            </h2>
            <p className="text-blue-muted text-sm sm:text-base max-w-md mx-auto leading-relaxed">
              Để lại thông tin, độ ngũ Windify sẽ liên hệ
              <br className="hidden sm:block" />
              và tư vấn chi tiết trong vòng 24 giờ
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-[480px] mx-auto flex flex-col gap-4">
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Số điện thoại"
              className={inputClass}
            />
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Họ và tên"
              className={inputClass}
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="E-mail"
              className={inputClass}
            />
            <input
              type="text"
              name="message"
              value={form.message}
              onChange={handleChange}
              placeholder="Lời nhắn"
              className={inputClass}
            />

            <div className="flex justify-center mt-4">
              <button
                type="submit"
                className="text-sm md:text-base py-3 lg:py-4 rounded-full bg-blue-midnight px-6 lg:px-12 font-medium text-white transition hover:opacity-85 active:scale-95"
              >
                Đăng kí
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
