import React from "react";
import { clsx } from "clsx";

// Map warna ke class Tailwind
const colorVariants = {
  sky: "bg-sky-500 hover:bg-sky-600 focus-visible:outline-sky-600",
  red: "bg-red-500 hover:bg-red-600 focus-visible:outline-red-600",
  green: "bg-green-500 hover:bg-green-600 focus-visible:outline-green-600",
  indigo: "bg-indigo-500 hover:bg-indigo-600 focus-visible:outline-indigo-600",
  yellow: "bg-yellow-500 hover:bg-yellow-600 focus-visible:outline-yellow-600",
  gray: "bg-gray-500 hover:bg-gray-600 focus-visible:outline-gray-600",
  white: "bg-white hover:bg-gray-50 focus-visible:outline-gray-600",
};

// Map ukuran ke padding dan font-size
const sizeVariants = {
  xs: "px-1.5 py-0.5 text-xs min-w-20 rounded-md font-medium",     // ~80px
  sm: "px-2 py-1 text-sm min-w-24 rounded-md font-medium",         // ~96px
  md: "px-3 py-1.5 text-base min-w-32 rounded-md font-medium",     // ~128px
  lg: "px-5 py-2.5 text-lg min-w-44 rounded-md font-semibold",     // ~176px
};


const ButtonInput = ({
  children,
  type = "button",
  color = "sky",
  size = "md",
  className,
  ...props
}) => {
  const colorClass = colorVariants[color] || colorVariants["sky"];
  const sizeClass = sizeVariants[size] || sizeVariants["md"];

  return (
    <button
      type={type}
      {...props}
      className={clsx(
        "flex justify-center py-3 px-4 rounded-md font-semibold text-white shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2",
        colorClass,
        sizeClass,
        className
      )}
    >
      <div className="flex gap-2 items-center ">
        {children}
      </div>
    </button>
  );
};

export default ButtonInput;
