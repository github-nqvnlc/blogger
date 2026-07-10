import Image from "next/image";
import introduceBg from "@public/images/introduce-bg.png";
import { Search } from "lucide-react";
import Circle from "@/components/svgs/circle";
import { unbounded } from "@/lib/font";

const Introduce = () => {
  return (
    <div className="min-h-screen relative flex items-center py-24 md:py-0">
      <div className="absolute inset-0">
        <Image
          src={introduceBg}
          alt="introduce"
          fill
          priority
          className="object-cover w-full h-full"
        />
      </div>

      <div className="relative inner space-y-4 px-5 md:px-0">
        <div className="flex gap-2 items-center">
          <Circle />
          <span className="text-sm md:text-xl">Giải pháp toàn diện cho doanh nghiệp</span>
        </div>

        <div
          className={`${unbounded.className} text-3xl sm:text-3xl md:text-6xl lg:text-7xl leading-[1.2] font-bold space-y-2 pb-2`}
        >
          <div className="bg-linear-to-r from-blue-brand to-blue-muted bg-clip-text text-transparent">
            Chào mừng đến
          </div>
          <div className="bg-linear-to-r from-blue-brand to-blue-muted bg-clip-text text-transparent">
            với Windify
          </div>
        </div>

        <div className="mt-6 sm:mt-8 flex items-stretch sm:items-center gap-3">
          <div className="relative h-12 w-full sm:w-80 rounded-full bg-slate-200/90">
            <Search className="hidden sm:block absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              placeholder="Search..."
              className="h-full w-full rounded-full bg-transparent px-4 sm:pl-11 sm:pr-4 text-sm text-slate-700 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <button
            aria-label="Search"
            className="h-12 w-12 sm:w-auto sm:px-6 flex-shrink-0 flex items-center justify-center rounded-full bg-linear-to-r from-blue-brand to-blue-muted font-medium text-white transition hover:opacity-90"
          >
            <Search className="size-4 sm:hidden" />
            <span className="hidden sm:inline text-sm md:text-base whitespace-nowrap">Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Introduce;
