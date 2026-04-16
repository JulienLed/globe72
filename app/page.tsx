"use client";

import { useRouter } from "next/navigation";

const USERS = ["Amy", "Simon", "Rebecca", "Nathalie", "Stud"];

export default function HomePage() {
  const router = useRouter();

  function handleSelect(username: string) {
    localStorage.setItem("username", username);
    router.push("/suggest");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-2xl font-bold">Globe 72 — Besoins mobilier</h1>
      <p className="text-gray-500">Qui es-tu ?</p>
      <div className="flex flex-wrap justify-center gap-4">
        {USERS.map((name) => (
          <button
            key={name}
            onClick={() => handleSelect(name)}
            className="rounded-xl border-2 border-gray-200 px-8 py-4 text-lg font-medium transition-colors hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
          >
            {name}
          </button>
        ))}
      </div>
    </main>
  );
}
