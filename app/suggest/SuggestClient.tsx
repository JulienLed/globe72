"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SuggestionForm } from "@/components/SuggestionForm";

interface Props {
  rooms: { id: number; name: string; dimensions: string }[];
  categories: { id: number; name: string; emoji: string }[];
  inventoryItems: { id: number; name: string; category: string; quantity: number; photoUrl: string | null; notes: string | null }[];
  stockTaken: Record<number, number>;
}

type View = "pre-stepper" | "stepper";

export function SuggestClient({ rooms, categories, inventoryItems, stockTaken }: Props) {
  const router = useRouter();

  const [username] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("username");
  });

  const [view, setView] = useState<View>("pre-stepper");
  const [signageText, setSignageText] = useState("");
  const [signageIdeaId, setSignageIdeaId] = useState<number | null>(null);
  const [signageSubmitted, setSignageSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [signageLoading, setSignageLoading] = useState(false);

  useEffect(() => {
    if (!username) { router.replace("/"); return; }
    fetch(`/api/signage?suggestedBy=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((idea) => {
        if (idea) {
          setSignageText(idea.text);
          setSignageIdeaId(idea.id);
          setSignageSubmitted(true);
        }
      });
  }, [username, router]);

  if (!username) return null;

  const isGrayed = signageSubmitted && !isEditing;

  async function handleSignageSubmit() {
    if (!signageText.trim()) return;
    setSignageLoading(true);
    try {
      if (isEditing && signageIdeaId !== null) {
        await fetch(`/api/signage/${signageIdeaId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: signageText }),
        });
        setIsEditing(false);
        toast.success("Modification enregistrée ✓");
      } else {
        const res = await fetch("/api/signage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: signageText, suggestedBy: username }),
        });
        const data = await res.json();
        setSignageIdeaId(data.id);
        setSignageSubmitted(true);
        toast.success("Votre idée a bien été enregistrée ✓");
      }
    } finally {
      setSignageLoading(false);
    }
  }

  if (view === "stepper") {
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

  return (
    <main className="mx-auto max-w-2xl my-8 flex flex-col gap-6 px-4">
      {/* Card 1 — Nouvelle suggestion */}
      <div className="glass px-6 py-6 flex flex-col gap-3">
        <h2 className="text-xl font-bold text-[#1A1A1A]">Nouvelle suggestion</h2>
        <p className="text-sm text-gray-600">
          Exprime tes besoins en mobilier pour le bureau locatif et la salle d&apos;attente.
        </p>
        <button
          onClick={() => setView("stepper")}
          className="self-start rounded-xl bg-[#2B5BA8] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1e4a8a]"
        >
          Commencer
        </button>
      </div>

      {/* Card 2 — Signalétique */}
      <div className={`glass px-6 py-6 flex flex-col gap-3 transition-opacity ${isGrayed ? "opacity-50" : ""}`}>
        <h2 className="text-xl font-bold text-[#1A1A1A]">Signalétique</h2>
        <p className="text-sm text-gray-600">
          Comment rendre ce lieu visible et identifiable depuis l&apos;extérieur pour les locataires ?
          Signalétique, vitrine, affichage… : vos idées sont les bienvenues, c&apos;est vous qui connaissez le terrain.
        </p>
        <textarea
          value={signageText}
          onChange={(e) => setSignageText(e.target.value)}
          disabled={isGrayed}
          placeholder="Vos idées…"
          rows={4}
          className="w-full rounded-xl border border-[#C8C8C8] px-4 py-3 text-sm resize-none focus:border-[#2B5BA8] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50"
        />
        <div className="flex gap-3">
          {isGrayed ? (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-xl border-2 border-[#C8C8C8] px-6 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:border-[#2B5BA8] hover:text-[#2B5BA8]"
            >
              Modifier
            </button>
          ) : (
            <button
              onClick={handleSignageSubmit}
              disabled={signageLoading || !signageText.trim()}
              className="rounded-xl border-2 border-[#2B5BA8] px-6 py-2.5 text-sm font-semibold text-[#2B5BA8] transition-colors hover:bg-[#EEF4FC] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {signageLoading ? "Enregistrement…" : "Enregistrer"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
