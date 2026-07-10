import React from "react";

const Circle = ({ className }: { className?: string }) => {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 19 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <g filter="url(#filter0_i_5_845)">
        <circle cx="9.5" cy="9.5" r="9.5" fill="#B8D1E8" />
      </g>
      <g filter="url(#filter1_dif_5_845)">
        <circle cx="9.49988" cy="9.49988" r="4.86218" fill="#1969B6" />
      </g>
      <defs>
        <filter
          id="filter0_i_5_845"
          x="0"
          y="0"
          width="19"
          height="19"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="1.5" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.34 0" />
          <feBlend mode="normal" in2="shape" result="effect1_innerShadow_5_845" />
        </filter>
        <filter
          id="filter1_dif_5_845"
          x="1.4377"
          y="1.4377"
          width="16.1244"
          height="16.1244"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="1.6" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.121209 0 0 0 0 0.524145 0 0 0 0 0.917252 0 0 0 1 0"
          />
          <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5_845" />
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5_845" result="shape" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="1.2" />
          <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.0623113 0 0 0 0 0.322403 0 0 0 0 0.57615 0 0 0 1 0"
          />
          <feBlend mode="normal" in2="shape" result="effect2_innerShadow_5_845" />
          <feGaussianBlur stdDeviation="0.8" result="effect3_foregroundBlur_5_845" />
        </filter>
      </defs>
    </svg>
  );
};

export default Circle;
