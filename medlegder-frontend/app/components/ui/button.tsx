import type { ButtonHTMLAttributes, ReactNode } from "react";

const variants = {
  primary:
    "bg-black text-white hover:bg-neutral-800 focus-visible:ring-neutral-900",
  secondary:
    "bg-white text-black border border-black/15 hover:border-black/30 hover:bg-neutral-50",
  ghost:
    "bg-transparent text-black hover:bg-neutral-100 border border-transparent",
  none: "",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  children: ReactNode;
};

export const Button = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) => {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full font-semibold tracking-wide transition focus-visible:outline-none focus-visible:ring-2 ${variants[variant]
        } ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
