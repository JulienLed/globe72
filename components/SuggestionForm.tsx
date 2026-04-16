"use client";

import { useState } from "react";

interface Room {
  id: number;
  name: string;
  dimensions: string;
}

interface Category {
  id: number;
  name: string;
  emoji: string;
}

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  photoUrl: string | null;
  notes: string | null;
}

interface SuggestionFormProps {
  rooms: Room[];
  categories: Category[];
  inventoryItems: InventoryItem[];
  username: string;
}

export function SuggestionForm({ rooms, categories, inventoryItems, username }: SuggestionFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [roomId, setRoomId] = useState<number | null>(null);
  const [needCategoryId, setNeedCategoryId] = useState<number | null>(null);

  // Step 2
  const [inventoryItemId, setInventoryItemId] = useState<number | null>(null);
  const [useIkea, setUseIkea] = useState(false);
  const [ikeaUrl, setIkeaUrl] = useState("");
  const [ikeaLabel, setIkeaLabel] = useState("");
  // Stocké comme string pour éviter que l'input contrôlé réinitialise la valeur
  // pendant que l'utilisateur efface et retape (ex: clear "1" + type "2" → "12" sinon)
  const [quantityStr, setQuantityStr] = useState("1");

  // Step 3
  const [comment, setComment] = useState("");

  const canProceedStep1 = roomId !== null && needCategoryId !== null;
  const canProceedStep2 = inventoryItemId !== null || (useIkea && ikeaUrl.trim() !== "");

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const selectedCategory = categories.find((c) => c.id === needCategoryId);
  const selectedItem = inventoryItems.find((i) => i.id === inventoryItemId);

  const handleSelectIkea = () => {
    setUseIkea(true);
    setInventoryItemId(null);
  };

  const handleSelectItem = (id: number) => {
    setInventoryItemId(id);
    setUseIkea(false);
    setIkeaUrl("");
    setIkeaLabel("");
  };

  const handleSubmit = async () => {
    await fetch("/api/suggestions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        needCategoryId,
        inventoryItemId: useIkea ? null : inventoryItemId,
        ikeaUrl: useIkea ? ikeaUrl : null,
        ikeaLabel: useIkea ? ikeaLabel : null,
        quantity: parseInt(quantityStr, 10) || 1,
        suggestedBy: username,
        comment: comment || null,
      }),
    });
  };

  // ── Étape 1 ───────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Pièce</h2>
          <div className="flex flex-wrap gap-3">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setRoomId(room.id)}
                aria-pressed={roomId === room.id}
                className={`rounded-lg border px-4 py-2 transition-colors ${
                  roomId === room.id
                    ? "border-blue-600 bg-blue-50 font-medium text-blue-700"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Catégorie de besoin</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setNeedCategoryId(cat.id)}
                aria-pressed={needCategoryId === cat.id}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 transition-colors ${
                  needCategoryId === cat.id
                    ? "border-blue-600 bg-blue-50 font-medium text-blue-700"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                {/* emoji séparé du nom pour que getByText("Mobilier de travail") matche exactement */}
                <span aria-hidden="true">{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    );
  }

  // ── Étape 2 ───────────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Article</h2>
          <div className="flex flex-wrap gap-3">
            {inventoryItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectItem(item.id)}
                aria-pressed={inventoryItemId === item.id}
                className={`rounded-lg border px-4 py-2 transition-colors ${
                  inventoryItemId === item.id
                    ? "border-blue-600 bg-blue-50 font-medium text-blue-700"
                    : "border-gray-300 hover:border-blue-400"
                }`}
              >
                {item.name}
              </button>
            ))}

            <button
              type="button"
              onClick={handleSelectIkea}
              aria-pressed={useIkea}
              className={`rounded-lg border px-4 py-2 transition-colors ${
                useIkea
                  ? "border-orange-500 bg-orange-50 font-medium text-orange-700"
                  : "border-gray-300 hover:border-orange-400"
              }`}
            >
              Pas dans l&apos;inventaire → IKEA
            </button>
          </div>

          {useIkea && (
            <div className="mt-4 flex flex-col gap-3">
              <input
                type="url"
                placeholder="URL IKEA"
                value={ikeaUrl}
                onChange={(e) => setIkeaUrl(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2"
              />
              <input
                type="text"
                placeholder="Nom de l'article"
                value={ikeaLabel}
                onChange={(e) => setIkeaLabel(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2"
              />
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Quantité</h2>
          <input
            type="number"
            min="1"
            value={quantityStr}
            onChange={(e) => setQuantityStr(e.target.value)}
            className="w-24 rounded border border-gray-300 px-3 py-2"
          />
        </section>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50"
          >
            Retour
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            disabled={!canProceedStep2}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    );
  }

  // ── Étape 3 ───────────────────────────────────────────────────────────────
  const articleLabel = useIkea ? (ikeaLabel || ikeaUrl) : selectedItem?.name;

  return (
    <div className="flex flex-col gap-6 p-6">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Résumé</h2>
        <dl className="flex flex-col gap-1 rounded-lg border border-gray-200 p-4">
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500">Pièce</dt>
            <dd>{selectedRoom?.name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500">Catégorie</dt>
            <dd>{selectedCategory?.name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500">Article</dt>
            <dd>{articleLabel}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="font-medium text-gray-500">Quantité</dt>
            <dd>{parseInt(quantityStr, 10) || 1}</dd>
          </div>
        </dl>
      </section>

      <section>
        <label htmlFor="comment" className="mb-2 block text-lg font-semibold">
          Commentaire <span className="text-sm font-normal text-gray-400">(optionnel)</span>
        </label>
        <textarea
          id="comment"
          placeholder="Ajouter un commentaire..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full rounded border border-gray-300 px-3 py-2"
        />
      </section>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="rounded-lg border border-gray-300 px-6 py-2 hover:bg-gray-50"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700"
        >
          Valider
        </button>
      </div>
    </div>
  );
}
