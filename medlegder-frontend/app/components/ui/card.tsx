import type { ReactNode } from "react";

export const Card = ({
  title,
  children,
  className,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={[
        "rounded-3xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.4)]",
        className ?? "",
      ]
        .join(" ")
        .trim()}
    >
      {title ? <h3 className="text-lg font-black text-black tracking-tight">{title}</h3> : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
};
