"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CATEGORIES = [
  "Mobilier de bureau",
  "Rangement & stockage",
  "Électroménager",
  "Vaisselle",
  "Matériel de bureau",
  "Informatique",
  "Santé & hygiène",
];

const BLOB_PREFIX = "https://blob.vercel-storage";

type InventoryItem = {
  id: number;
  name: string;
  quantity: number;
  category: string;
  photoUrl: string | null;
  notes: string | null;
};

export default function NewInventoryPage() {
  const [successItem, setSuccessItem] = useState<InventoryItem | null>(null);
  const [manualItems, setManualItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadManualItems();
  }, []);

  async function loadManualItems() {
    const res = await fetch("/api/inventory");
    if (!res.ok) return;
    const items: InventoryItem[] = await res.json();
    setManualItems(items.filter((i) => i.photoUrl?.startsWith(BLOB_PREFIX)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/inventory", { method: "POST", body: fd });

    if (res.ok) {
      const item: InventoryItem = await res.json();
      setSuccessItem(item);
      (e.target as HTMLFormElement).reset();
      await loadManualItems();
    } else {
      const json = await res.json().catch(() => ({}));
      setError((json as { error?: string }).error ?? "Erreur lors de l'ajout.");
    }

    setLoading(false);
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Supprimer cet objet de l'inventaire ?")) return;
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
    if (res.ok) await loadManualItems();
  }

  if (successItem) {
    return (
      <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center gap-8 p-8">
        <div className="glass w-full max-w-md px-8 py-8 flex flex-col items-center gap-6">
          <div className="text-center">
            <div className="text-4xl mb-2">✅</div>
            <h2 className="text-xl font-bold text-[#1A1A1A]">Objet ajouté</h2>
          </div>

          <div className="w-full rounded-xl border border-[#C8C8C8] bg-white/60 p-4 flex flex-col gap-2 text-sm">
            {successItem.photoUrl && (
              <img
                src={successItem.photoUrl}
                alt={successItem.name}
                className="w-full h-40 object-contain rounded-lg mb-2"
              />
            )}
            <p><span className="font-semibold">Nom :</span> {successItem.name}</p>
            <p><span className="font-semibold">Catégorie :</span> {successItem.category}</p>
            <p><span className="font-semibold">Quantité :</span> {successItem.quantity}</p>
            {successItem.notes && (
              <p><span className="font-semibold">Notes :</span> {successItem.notes}</p>
            )}
          </div>

          <div className="flex flex-col w-full gap-3">
            <button
              onClick={() => setSuccessItem(null)}
              className="w-full rounded-xl border-2 border-[#2B5BA8] px-6 py-3 text-sm font-semibold text-[#2B5BA8] transition-colors hover:bg-[#2B5BA8] hover:text-white"
            >
              Ajouter un autre objet
            </button>
            <Link
              href="/"
              className="w-full text-center rounded-xl border-2 border-[#C8C8C8] px-6 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[calc(100vh-65px)] flex-col items-center gap-8 p-8 pt-12">
      {/* Form */}
      <div className="glass w-full max-w-md px-8 py-8 flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Ajouter un objet à l&apos;inventaire</h1>
          <p className="mt-1 text-sm text-gray-500">La photo sera stockée sur Vercel Blob.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nom */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="name">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Ex. : Table de réunion"
              className="rounded-lg border border-[#C8C8C8] px-3 py-2 text-sm outline-none focus:border-[#2B5BA8]"
            />
          </div>

          {/* Quantité */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="quantity">
              Quantité <span className="text-red-500">*</span>
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min={1}
              defaultValue={1}
              required
              className="rounded-lg border border-[#C8C8C8] px-3 py-2 text-sm outline-none focus:border-[#2B5BA8]"
            />
          </div>

          {/* Catégorie */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="category">
              Catégorie
            </label>
            <select
              id="category"
              name="category"
              className="rounded-lg border border-[#C8C8C8] px-3 py-2 text-sm outline-none focus:border-[#2B5BA8] bg-white"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="notes">
              Notes <span className="text-gray-400 text-xs">(optionnel)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="Informations complémentaires…"
              className="rounded-lg border border-[#C8C8C8] px-3 py-2 text-sm outline-none focus:border-[#2B5BA8] resize-none"
            />
          </div>

          {/* Photo */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="photo">
              Photo <span className="text-red-500">*</span>
            </label>
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              required
              className="rounded-lg border border-[#C8C8C8] px-3 py-2 text-sm text-gray-600 file:mr-3 file:rounded file:border-0 file:bg-[#EEF4FC] file:px-3 file:py-1 file:text-xs file:font-medium file:text-[#2B5BA8]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#2B5BA8] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1e4a8c] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Envoi en cours…" : "Ajouter à l'inventaire"}
          </button>
        </form>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-[#2B5BA8] underline underline-offset-2">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>

      {/* Manually added items */}
      {manualItems.length > 0 && (
        <div className="glass w-full max-w-md px-8 py-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-[#1A1A1A]">Objets ajoutés manuellement</h2>
          <ul className="flex flex-col gap-3">
            {manualItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-[#C8C8C8] bg-white/60 px-3 py-2"
              >
                {item.photoUrl && (
                  <img
                    src={item.photoUrl}
                    alt={item.name}
                    className="h-12 w-12 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.category} · qté {item.quantity}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="shrink-0 rounded-lg border border-[#e5c0c5] px-3 py-1.5 text-xs font-medium text-[#8B2332] transition-colors hover:bg-[#8B2332] hover:text-white"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
