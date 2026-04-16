"use client";

import { useEffect, useState, useCallback } from "react";
import { detectConflicts } from "@/lib/detectConflicts";
import type { SuggestionFull } from "@/lib/types";

const POLL_INTERVAL = 30_000;

// ── Helpers de regroupement ───────────────────────────────────────────────────

function groupSuggestions(suggestions: SuggestionFull[]) {
  const rooms = new Map<
    number,
    {
      room: SuggestionFull["room"];
      categories: Map<
        number,
        { category: SuggestionFull["needCategory"]; suggestions: SuggestionFull[] }
      >;
    }
  >();

  for (const s of suggestions) {
    if (!rooms.has(s.roomId)) {
      rooms.set(s.roomId, { room: s.room, categories: new Map() });
    }
    const roomEntry = rooms.get(s.roomId)!;

    if (!roomEntry.categories.has(s.needCategoryId)) {
      roomEntry.categories.set(s.needCategoryId, {
        category: s.needCategory,
        suggestions: [],
      });
    }
    roomEntry.categories.get(s.needCategoryId)!.suggestions.push(s);
  }

  return rooms;
}

function articleLabel(s: SuggestionFull): string {
  if (s.inventoryItem) return s.inventoryItem.name;
  if (s.ikeaLabel) return s.ikeaLabel;
  if (s.ikeaUrl) return s.ikeaUrl;
  return "—";
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function RecapPage() {
  const [suggestions, setSuggestions] = useState<SuggestionFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    try {
      const res = await fetch("/api/suggestions");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data: SuggestionFull[] = await res.json();
      setSuggestions(data);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
    const timer = setInterval(fetchSuggestions, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [fetchSuggestions]);

  const conflicts = detectConflicts(suggestions);
  const grouped = groupSuggestions(suggestions);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Récapitulatif des besoins</h1>
        <a
          href="/api/export"
          download="rapport_globe72.pdf"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          Télécharger le rapport PDF
        </a>
      </div>

      {loading && <p className="text-gray-500">Chargement…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && suggestions.length === 0 && (
        <p className="text-gray-400">Aucune suggestion pour le moment.</p>
      )}

      {[...grouped.values()].map(({ room, categories }) => (
        <section key={room.id} className="mb-8">
          <h2 className="mb-4 text-xl font-semibold border-b pb-1">{room.name}</h2>

          {[...categories.values()].map(({ category, suggestions: catSuggestions }) => {
            const conflictKey = `${room.id}-${category.id}`;
            const hasConflict = conflicts.has(conflictKey);

            return (
              <div key={category.id} className="mb-4 rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-medium">
                  <span aria-hidden="true">{category.emoji}</span>
                  <span>{category.name}</span>
                  {hasConflict && (
                    <span
                      title="Conflit : des articles différents ont été proposés pour cette catégorie"
                      className="rounded bg-amber-100 px-2 py-0.5 text-sm text-amber-700"
                    >
                      ⚠️ Conflit
                    </span>
                  )}
                </h3>

                <ul className="space-y-1 text-sm">
                  {catSuggestions.map((s) => (
                    <li key={s.id} className="flex gap-2 text-gray-700">
                      <span className="font-medium">{s.suggestedBy}</span>
                      <span>—</span>
                      <span>{articleLabel(s)}</span>
                      <span className="text-gray-400">×{s.quantity}</span>
                      {s.comment && (
                        <span className="italic text-gray-400">« {s.comment} »</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      ))}
    </main>
  );
}
