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
};

// Map ukuran ke padding dan font-size
const sizeVariants = {
  sm: "px-2 py-1 text-sm",
  md: "px-3 py-1.5 text-md",
  lg: "px-4 py-2 text-lg",
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
        "flex w-full justify-center  rounded-md font-semibold text-white shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2",
        colorClass,
        sizeClass,
        className
      )}
    >
      <div className="flex items-center ">
        {children}
      </div>
    </button>
  );
};

export default ButtonInput;
