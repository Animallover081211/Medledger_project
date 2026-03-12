import type {InputHTMLAttributes} from "react";

export const Input = ({className = "", ...props}: InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      className={`w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black shadow-sm outline-none transition focus:border-black/40 focus:ring-2 focus:ring-black/10 ${className}`}
      {...props}
    />
  );
};
