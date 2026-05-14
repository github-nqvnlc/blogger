import Facebook from "@/components/svgs/facebook";
import Logo from "@/components/svgs/logo";
import Zalo from "@/components/svgs/zalo";
import MailSVG from "@/components/svgs/mail";
import { Mail, MapPin, PhoneCall } from "lucide-react";
import React from "react";

const Footer = () => {
  return (
    <footer className="bg-linear-to-b from-white to-blue-ice py-8 md:py-16 px-5">
      <div className="inner">
        <div className="flex flex-col md:flex-row gap-8 md:gap-10 xl:gap-12 justify-between">
          <div className=" w-full md:max-w-1/2">
            <Logo />
            <span className="block w-full md:max-w-3/4 leading-relaxed text-sm text-foreground-variant">
              Windify - Đối tác tin cậy đồng hành cùng doanh nghiệp trong hành trình chuyển đổi số
              và phát triển bền vững. Chúng tôi mang đến giải pháp công nghệ tiên tiến và dịch vụ
              chuyên nghiệp.
            </span>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-20 xl:gap-40">
            <div>
              <span className="font-medium text-base md:text-lg leading-[36px] text-blue-muted">
                Dịch vụ
              </span>
              <ul className="mt-2 ml-5 list-disc space-y-2 text-foreground text-sm lg:text-base">
                <li className="leading-9 text-nowrap">Dropshipping Platform</li>
                <li className="leading-9">Academy</li>
                <li className="leading-9">Agency</li>
                <li className="leading-9">Software</li>
              </ul>
            </div>
            <div>
              <div>
                <span className="font-medium text-base md:text-lg leading-[36px] text-blue-muted">
                  Liên hệ
                </span>
                <ul className="mt-2 space-y-2 text-foreground text-sm lg:text-base">
                  <li className="flex items-center gap-1 leading-9">
                    <PhoneCall className="size-4" />
                    <span className="text-nowrap">0796 943 555</span>
                  </li>
                  <li className="flex items-center gap-1 leading-9">
                    <Mail className="size-4" />
                    <span className="text-nowrap">contact@windify.com.vn</span>
                  </li>
                  <li className="flex items-center gap-1 leading-9">
                    <MapPin className="size-4" />
                    <span className="text-nowrap">Lô 345 Hoàng Thị Loan, Đà Nẵng</span>
                  </li>
                </ul>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Facebook />
                <Zalo />
                <MailSVG />
              </div>
            </div>
          </div>
        </div>
        <hr className="my-4" />
        <div className="flex flex-col-reverse md:flex-row gap-4 md:gap-0 items-center justify-between">
          <div>
            <span className="text-xs md:text-sm">
              © 2026 Windify Corporate. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm underline-offset-4 underline">
            <a className="hover:text-blue-muted" href="https://www.windify.com.vn/terms-of-use">
              Điều khoản sử dụng
            </a>
            <a className="hover:text-blue-muted" href="https://www.windify.com.vn/privacy-policy">
              Chính sách bảo mật
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
