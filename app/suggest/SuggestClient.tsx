"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SuggestionForm } from "@/components/SuggestionForm";

interface Props {
  rooms: { id: number; name: string; dimensions: string }[];
  categories: { id: number; name: string; emoji: string }[];
  inventoryItems: { id: number; name: string; category: string; quantity: number; photoUrl: string | null; notes: string | null }[];
  stockTaken: Record<number, number>;
}

export function SuggestClient({ rooms, categories, inventoryItems, stockTaken }: Props) {
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
    <main className="glass mx-auto max-w-2xl my-8 px-6 py-8">
      <h1 className="mb-6 text-xl font-bold text-[#1A1A1A]">Nouvelle suggestion</h1>
      <SuggestionForm
        rooms={rooms}
        categories={categories}
        inventoryItems={inventoryItems}
        username={username}
        stockTaken={stockTaken}
        onSuccess={() => router.push("/recap?success=1")}
      />
    </main>
  );
}
