"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export function AppHeader() {
  const [username, setUsername] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Re-read localStorage on every route change so the header stays in sync
  // (e.g. after username selection on /, or after clearing it)
  useEffect(() => {
    setUsername(localStorage.getItem("username"));
  }, [pathname]);

  function handleChangeUser() {
    localStorage.removeItem("username");
    setUsername(null);
    router.push("/");
  }

  return (
    <header className="glass-bar sticky top-0 z-50 flex items-center justify-between px-4 py-3">
      <Link href="/" className="shrink-0">
        <Image
          src="/Logo ABC.png"
          alt="ABC"
          height={40}
          width={160}
          className="h-10 w-auto object-contain"
          priority
        />
      </Link>

      {username && (
        <div className="flex items-center gap-3 text-sm text-[#1A1A1A]">
          <span className="font-medium">{username}</span>
          <button
            type="button"
            onClick={handleChangeUser}
            className="text-[#2B5BA8] underline hover:text-[#5B9BD5]"
          >
            Changer d&apos;utilisateur
          </button>
        </div>
      )}
    </header>
  );
}
