"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";
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
  const supplier = s.supplierName ?? "IKEA";
  if (s.inventoryItem) return s.inventoryItem.name;
  if (s.ikeaLabel) return `${supplier} — ${s.ikeaLabel}`;
  if (s.ikeaUrl) return s.ikeaUrl;
  return "—";
}

// ── Miniature fournisseur (og:image via proxy) ────────────────────────────────

function SupplierThumbnail({ url }: { url: string }) {
  const [imgUrl, setImgUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/og-image?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (active && data?.imageUrl) setImgUrl(data.imageUrl); })
      .catch(() => {});
    return () => { active = false; };
  }, [url]);

  if (!imgUrl) {
    return (
      <div className="h-12 w-12 shrink-0 rounded bg-gray-100 flex items-center justify-center text-xl text-gray-300">
        🛒
      </div>
    );
  }

  return (
    <Image
      src={imgUrl}
      alt="fournisseur"
      width={48}
      height={48}
      className="h-12 w-12 shrink-0 rounded object-cover"
      unoptimized
    />
  );
}

// ── Composant ─────────────────────────────────────────────────────────────────

export default function RecapPage() {
  const [suggestions, setSuggestions] = useState<SuggestionFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("success") === "1") {
      setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    // `cancelled` empêche toute mise à jour d'état après démontage du composant
    // ou après que React Strict Mode ait exécuté le cleanup du premier effet.
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/suggestions");
        if (!res.ok) throw new Error("Erreur lors du chargement");
        const { suggestions: data }: { suggestions: SuggestionFull[] } = await res.json();
        if (!cancelled) {
          setSuggestions(data); // remplace l'état — ne jamais append
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []); // deps vides : un seul intervalle, jamais recréé

  const handleDelete = async (id: number) => {
    if (!window.confirm("Supprimer cette suggestion ?")) return;
    setSuggestions(prev => prev.filter(s => s.id !== id));
    try {
      await fetch(`/api/suggestions/${id}`, { method: "DELETE" });
    } catch (e) {
      console.error("Delete error:", e);
    }
  };

  const conflicts = detectConflicts(suggestions);
  const grouped = groupSuggestions(suggestions);

  return (
    <main className="glass mx-auto max-w-3xl my-8 px-6 py-8">
      {/* Fixed buttons — top-right */}
      <div className="fixed right-4 top-[65px] z-10 flex gap-2">
        <a
          href="/suggest"
          className="rounded-lg bg-[#2B5BA8] px-4 py-2 text-sm text-white shadow hover:bg-[#5B9BD5]"
        >
          + Ajouter un besoin
        </a>
        <a
          href="/api/export"
          download="rapport_globe72.pdf"
          className="rounded-lg border border-[#2B5BA8] px-4 py-2 text-sm text-[#2B5BA8] shadow hover:bg-[#EEF4FC]"
        >
          Télécharger le rapport PDF
        </a>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-[#1A1A1A]">Récapitulatif des besoins</h1>

      {/* Success banner */}
      {showBanner && (
        <div className="mb-4 rounded-lg bg-[#EEF4FC] border border-[#5B9BD5] px-4 py-3 text-sm text-[#2B5BA8]">
          <div className="flex items-center justify-between">
            <span>Votre suggestion a bien été enregistrée ✓</span>
            <button
              type="button"
              onClick={() => setShowBanner(false)}
              className="ml-4 font-bold text-[#2B5BA8] hover:text-[#8B2332]"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
          <div className="mt-2">
            <a
              href="/suggest"
              className="inline-block rounded-lg bg-[#2B5BA8] px-4 py-2 text-sm font-medium text-white hover:bg-[#5B9BD5]"
            >
              + Ajouter un autre besoin
            </a>
          </div>
        </div>
      )}

      {loading && <p className="text-gray-500">Chargement…</p>}
      {error && <p className="text-[#8B2332]">{error}</p>}

      {!loading && suggestions.length === 0 && (
        <p className="text-gray-400">Aucune suggestion pour le moment.</p>
      )}

      {[...grouped.values()].map(({ room, categories }) => (
        <section key={room.id} className="mb-8">
          <h2 className="mb-4 border-b border-[#C8C8C8] pb-1 text-xl font-semibold text-[#2B5BA8]">
            {room.name}
          </h2>

          {[...categories.values()].map(({ category, suggestions: catSuggestions }) => {
            const conflictKey = `${room.id}-${category.id}`;
            const hasConflict = conflicts.has(conflictKey);

            return (
              <div key={category.id} className="glass mb-4 p-4">
                <h3 className="mb-2 flex items-center gap-2 font-medium text-[#1A1A1A]">
                  <span aria-hidden="true">{category.emoji}</span>
                  <span>{category.name}</span>
                  {hasConflict && (
                    <span
                      title="Conflit : des articles différents ont été proposés pour cette catégorie"
                      className="rounded bg-[#FDF2F3] px-2 py-0.5 text-sm text-[#8B2332]"
                    >
                      ⚠️ Conflit
                    </span>
                  )}
                </h3>

                <ul className="space-y-2 text-sm">
                  {catSuggestions.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 text-[#1A1A1A]">
                      {/* Thumbnail */}
                      {s.inventoryItem?.photoUrl ? (
                        <Image
                          src={s.inventoryItem.photoUrl}
                          alt={s.inventoryItem.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 shrink-0 rounded object-cover"
                        />
                      ) : s.ikeaUrl ? (
                        <SupplierThumbnail url={s.ikeaUrl} />
                      ) : (
                        <div className="h-12 w-12 shrink-0 rounded bg-gray-100 flex items-center justify-center text-xl text-gray-300">
                          📦
                        </div>
                      )}
                      <div className="flex flex-wrap items-baseline gap-1 flex-1">
                        <span className="font-medium text-[#2B5BA8]">{s.suggestedBy}</span>
                        <span className="text-gray-400">—</span>
                        <span>{articleLabel(s)}</span>
                        <span className="text-gray-400">×{s.quantity}</span>
                        {s.comment && (
                          <span className="italic text-gray-400">« {s.comment} »</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="ml-auto shrink-0 rounded p-1 text-gray-300 hover:text-[#8B2332] transition-colors"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
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
