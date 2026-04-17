"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SuggestionForm } from "@/components/SuggestionForm";

interface Props {
  rooms: { id: number; name: string; dimensions: string }[];
  categories: { id: number; name: string; emoji: string }[];
  inventoryItems: { id: number; name: string; category: string; quantity: number; photoUrl: string | null; notes: string | null }[];
  stockTaken: Record<number, number>;
  suggestedBy: Record<number, string[]>;
}

export function SuggestClient({ rooms, categories, inventoryItems, stockTaken, suggestedBy }: Props) {
  const router = useRouter();

  // Read localStorage synchronously on first client render (lazy initializer)
  // so the form is visible immediately — no useEffect tick producing a blank flash.
  const [username] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("username");
  });

  useEffect(() => {
    if (!username) router.replace("/");
  }, [username, router]);

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
        suggestedBy={suggestedBy}
        onSuccess={() => router.push("/recap?success=1")}
      />
    </main>
  );
}
