import type { ReactNode } from "react";

export const Card = ({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
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
      {title || action ? (
        <div className="flex items-start justify-between gap-3">
          {title ? <h3 className="text-lg font-black text-black tracking-tight">{title}</h3> : <span />}
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={title ? "mt-4" : ""}>{children}</div>
    </div>
  );
};
