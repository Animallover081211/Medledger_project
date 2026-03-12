import type {ReactNode} from "react";

type ShellProps = {
  children: ReactNode;
  className?: string;
};

export const Shell = ({children, className = ""}: ShellProps) => {
  return (
    <div className={`min-h-screen bg-[radial-gradient(circle_at_top,#f7f4ef,transparent_55%),radial-gradient(circle_at_20%_70%,#ffe8d2,transparent_50%),radial-gradient(circle_at_90%_20%,#e1f0ff,transparent_45%)] ${className}`}>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 lg:px-6 lg:py-10">
        {children}
      </div>
    </div>
  );
};
