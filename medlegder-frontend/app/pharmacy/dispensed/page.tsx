"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PharmacyDispensedRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/pharmacy/history");
  }, [router]);

  return null;
}
