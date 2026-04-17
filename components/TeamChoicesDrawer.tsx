"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Suggestion {
  id: number;
  suggestedBy: string;
  quantity: number;
  ikeaLabel: string | null;
  supplierName: string | null;
  inventoryItem: { id: number; name: string; photoUrl: string | null } | null;
}

interface Props {
  roomId: number;
  needCategoryId: number;
  roomName: string;
  categoryName: string;
}

function articleLabel(s: Suggestion): string {
  return s.inventoryItem?.name ?? s.ikeaLabel ?? "Article";
}

function supplierIcon(s: Suggestion): string {
  if (s.supplierName === "IKEA") return "🛒";
  if (s.supplierName === "Bruneau.be") return "🏪";
  return "📦";
}

export function TeamChoicesDrawer({ roomId, needCategoryId, roomName, categoryName }: Props) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleOpen = async () => {
    setOpen(true);
    if (suggestions !== null) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/suggestions?roomId=${roomId}&categoryId=${needCategoryId}`,
      );
      const data = await res.json();
      setSuggestions(data.suggestions ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // Group suggestions by username
  const grouped: Record<string, Suggestion[]> = {};
  for (const s of suggestions ?? []) {
    if (!grouped[s.suggestedBy]) grouped[s.suggestedBy] = [];
    grouped[s.suggestedBy].push(s);
  }
  const usernames = Object.keys(grouped);

  return (
    <>
      {/* Floating trigger tab — left edge, vertical text */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Voir les choix de l'équipe"
        className="fixed left-0 top-1/2 z-40 -translate-y-1/2 rounded-r-xl bg-[#2B5BA8] px-2 py-4 text-white shadow-lg transition-colors hover:bg-[#5B9BD5]"
      >
        <span className="flex flex-col items-center gap-1 text-[11px] font-semibold leading-none tracking-wide [writing-mode:vertical-rl] rotate-180">
          👥 Choix équipe
        </span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choix de l'équipe"
        className={`fixed left-0 top-0 z-50 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#C8C8C8] px-4 py-4">
          <div>
            <p className="font-bold text-[#1A1A1A]">👥 Choix de l&apos;équipe</p>
            <p className="mt-0.5 text-xs text-gray-400">
              {roomName} — {categoryName}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer"
            className="ml-2 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading && (
            <p className="text-sm text-gray-400">Chargement…</p>
          )}

          {!loading && suggestions !== null && usernames.length === 0 && (
            <p className="text-sm text-gray-400">Aucun choix pour l&apos;instant.</p>
          )}

          {!loading &&
            usernames.map((user) => (
              <div key={user} className="mb-5">
                <p className="mb-2 text-sm font-semibold text-[#2B5BA8]">
                  {user}
                </p>
                <div className="flex flex-col gap-2">
                  {grouped[user].map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 rounded-lg border border-[#C8C8C8] p-2"
                    >
                      {/* Thumbnail */}
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                        {s.inventoryItem?.photoUrl ? (
                          <Image
                            src={s.inventoryItem.photoUrl}
                            alt={articleLabel(s)}
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-lg">
                            {supplierIcon(s)}
                          </span>
                        )}
                      </div>

                      {/* Label + quantity */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[#1A1A1A]">
                          {articleLabel(s)}
                        </p>
                        <p className="text-xs text-gray-400">×{s.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}
