import Image from "next/image";
import introduceBg from "@public/images/introduce-bg.png";
import { Search } from "lucide-react";
import Circle from "@/components/svgs/circle";
import { unbounded } from "@/lib/font";

const Introduce = () => {
  return (
    <div className="w-screen h-screen relative flex items-center">
      <div className="absolute inset-0">
        <Image
          src={introduceBg}
          alt="introduce"
          fill
          priority
          className="object-cover w-full h-full"
        />
      </div>
      <div className="relative inner space-y-3">
        <div className="flex gap-2 items-center">
          <Circle />
          <span className="text-xl">Giải pháp toàn diện cho doanh nghiệp</span>
        </div>
        <div className={`${unbounded.className} text-7xl leading-[1.2] font-bold space-y-2 pb-2`}>
          <div className="bg-linear-to-r from-blue-brand to-blue-muted bg-clip-text text-transparent">
            Chào mừng đến
          </div>
          <div className="bg-linear-to-r from-blue-brand to-blue-muted bg-clip-text text-transparent">
            với Windify
          </div>
        </div>
        <div>
          <div className="mt-8 flex items-center gap-3">
            <div className="relative h-12 w-80 rounded-full bg-slate-200/90">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              <input
                type="search"
                placeholder="search..."
                className="h-full w-full rounded-full bg-transparent pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <button className="h-12 rounded-full bg-linear-to-r from-blue-brand to-blue-muted px-6 font-medium text-white transition hover:opacity-90">
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Introduce;
