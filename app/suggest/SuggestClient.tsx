"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SuggestionForm } from "@/components/SuggestionForm";

interface Props {
  rooms: { id: number; name: string; dimensions: string }[];
  categories: { id: number; name: string; emoji: string }[];
  inventoryItems: { id: number; name: string; category: string; quantity: number; photoUrl: string | null; notes: string | null }[];
}

export function SuggestClient({ rooms, categories, inventoryItems }: Props) {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (!stored) {
      router.replace("/");
    } else {
      setUsername(stored);
    }
  }, [router]);

  if (!username) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Nouvelle suggestion</h1>
        <span className="text-sm text-gray-500">Connecté en tant que <strong>{username}</strong></span>
      </div>
      <SuggestionForm
        rooms={rooms}
        categories={categories}
        inventoryItems={inventoryItems}
        username={username}
      />
    </main>
  );
}
