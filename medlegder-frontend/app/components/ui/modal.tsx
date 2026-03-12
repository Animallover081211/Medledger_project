import type { ReactNode } from "react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string | ReactNode;
  type: "success" | "error" | "info";
  children?: ReactNode;
  zIndex?: number;
};

export const Modal = ({ isOpen, onClose, title, message, type, children, zIndex = 100 }: ModalProps) => {
  if (!isOpen) return null;

  const styles = {
    success: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      iconNode: "✓",
      iconBg: "bg-emerald-100 text-emerald-600",
      btn: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-100",
      label: "Great, thanks!"
    },
    error: {
      bg: "bg-red-50",
      text: "text-red-700",
      iconNode: "✕",
      iconBg: "bg-red-100 text-red-600",
      btn: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100",
      label: "OK, got it"
    },
    info: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      iconNode: "ℹ",
      iconBg: "bg-blue-100 text-blue-600",
      btn: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100",
      label: "Close"
    }
  };

  const current = styles[type];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all"
      style={{ zIndex }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl border border-black/5 animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm ${current.iconBg}`}
          >
            {current.iconNode}
          </div>
          <h3
            className={`text-2xl font-bold tracking-tight ${current.text}`}
          >
            {title}
          </h3>
        </div>

        <div className="mt-6 text-base text-neutral-900 leading-relaxed font-bold">
          {message}
        </div>

        {children && <div className="mt-6">{children}</div>}

        <button
          onClick={onClose}
          className={`mt-8 w-full rounded-2xl py-4 text-base font-bold transition-all transform active:scale-[0.98] ${current.btn}`}
        >
          {current.label}
        </button>
      </div>
    </div>
  );
};
