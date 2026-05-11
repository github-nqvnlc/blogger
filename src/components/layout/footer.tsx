import Facebook from "@/components/svgs/facebook";
import Logo from "@/components/svgs/logo";
import Zalo from "@/components/svgs/zalo";
import MailSVG from "@/components/svgs/mail";
import { Mail, MapPin, PhoneCall } from "lucide-react";
import React from "react";

const Footer = () => {
  return (
    <footer className="bg-linear-to-b from-white to-blue-ice py-16">
      <div className="inner">
        <div className="flex gap-8 md:gap-10 xl:gap-12 justify-between">
          <div className="max-w-1/2">
            <Logo />
            <span className="block max-w-3/4 leading-relaxed text-sm text-foreground-variant">
              Windify - Đối tác tin cậy đồng hành cùng doanh nghiệp trong hành trình chuyển đổi số
              và phát triển bền vững. Chúng tôi mang đến giải pháp công nghệ tiên tiến và dịch vụ
              chuyên nghiệp.
            </span>
          </div>
          <div className="flex gap-24">
            <div>
              <span className="font-medium text-lg leading-[36px] text-blue-muted">Dịch vụ</span>
              <ul className="mt-2 ml-5 list-disc space-y-2 text-foreground text-md">
                <li className="leading-9">Dropshipping Platform</li>
                <li className="leading-9">Academy</li>
                <li className="leading-9">Agency</li>
                <li className="leading-9">Software</li>
              </ul>
            </div>
            <div>
              <div>
                <span className="font-medium text-lg leading-[36px] text-blue-muted">Liên hệ</span>
                <ul className="mt-2 space-y-2 text-foreground text-md">
                  <li className="flex items-center gap-1 leading-9">
                    <PhoneCall className="size-4" /> 0796 943 555
                  </li>
                  <li className="flex items-center gap-1 leading-9">
                    <Mail className="size-4" />
                    contact@windify.com.vn
                  </li>
                  <li className="flex items-center gap-1 leading-9">
                    <MapPin className="size-4" />
                    Lô 345 Hoàng Thị Loan, Đà Nẵng
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
        <div className="flex items-center justify-between">
          <div>
            <span>© 2026 Windify Corporate. All rights reserved.</span>
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
