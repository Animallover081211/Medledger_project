import Link from "next/link";

export const Navbar = () => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="text-lg font-semibold tracking-tight text-black">
        MedLedger
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm font-medium text-black/70 hover:text-black">
          Login
        </Link>
        <Link href="/register" className="text-sm font-semibold text-black">
          Register
        </Link>
      </div>
    </div>
  );
};
