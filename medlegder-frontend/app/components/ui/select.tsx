import type {SelectHTMLAttributes} from "react";

export const Select = ({className = "", ...props}: SelectHTMLAttributes<HTMLSelectElement>) => {
  return (
    <select
      className={`w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black shadow-sm outline-none transition focus:border-black/40 focus:ring-2 focus:ring-black/10 ${className}`}
      {...props}
    />
  );
};
