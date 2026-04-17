"use client";

import { useState } from "react";
import Image from "next/image";

interface Room          { id: number; name: string; dimensions: string; }
interface Category      { id: number; name: string; emoji: string; }
interface InventoryItem { id: number; name: string; category: string; quantity: number; photoUrl: string | null; notes: string | null; }

interface SuggestionFormProps {
  rooms: Room[];
  categories: Category[];
  inventoryItems: InventoryItem[];
  username: string;
  /** Total quantity already suggested per inventoryItemId (from all users). Defaults to {}. */
  stockTaken?: Record<number, number>;
  /** Appelé après un submit réussi — typiquement router.push("/recap") */
  onSuccess?: () => void;
}

const IKEA_URL    = "https://www.ikea.com/be/fr/";
const BRUNEAU_URL = "https://www.bruneau.be";

// Mots-clés pour filtrer l'inventaire selon la catégorie de besoin sélectionnée.
// La comparaison se fait sur item.name (insensible à la casse).
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Mobilier de travail": ["bureau", "fauteuil", "chaise", "table"],
  "Assise & accueil":    ["chaise", "fauteuil", "canapé"],
  "Rangement":           ["armoire", "étagère", "tiroir", "meuble"],
  "Décoration":          ["lampe", "plante", "miroir"],
  "Communication":       ["imprimante", "plieuse", "plastifieuse", "trancheuse"],
};

function filterInventory(items: InventoryItem[], categoryName: string): InventoryItem[] {
  if (categoryName === "Autre") return items;
  const keywords = CATEGORY_KEYWORDS[categoryName];
  if (!keywords) return items;
  return items.filter((item) =>
    keywords.some((kw) => item.name.toLowerCase().includes(kw))
  );
}

export function SuggestionForm({
  rooms, categories, inventoryItems, username, stockTaken = {}, onSuccess,
}: SuggestionFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [roomId,         setRoomId]         = useState<number | null>(null);
  const [needCategoryId, setNeedCategoryId] = useState<number | null>(null);

  // Step 2
  const [inventoryItemId, setInventoryItemId] = useState<number | null>(null);
  const [supplier,        setSupplier]        = useState<"ikea" | "bruneau" | null>(null);
  const [ikeaUrl,         setIkeaUrl]         = useState("");
  const [ikeaLabel,       setIkeaLabel]       = useState("");
  // String pour éviter le bug clear+"2" → "12" sur input contrôlé de type number
  const [quantityStr,     setQuantityStr]     = useState("1");

  // Step 3
  const [comment,     setComment]     = useState("");
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Dérivés ───────────────────────────────────────────────────────────────
  const selectedRoom     = rooms.find((r) => r.id === roomId);
  const selectedCategory = categories.find((c) => c.id === needCategoryId);
  const selectedItem     = inventoryItems.find((i) => i.id === inventoryItemId);

  // Remaining stock for the selected inventory item
  const selectedItemRemaining = selectedItem
    ? selectedItem.quantity - (stockTaken[selectedItem.id] ?? 0)
    : null;

  const quantityInt = parseInt(quantityStr, 10) || 1;

  // True when user entered more than what's available
  const quantityExceedsStock =
    inventoryItemId !== null &&
    selectedItemRemaining !== null &&
    quantityInt > selectedItemRemaining;

  const canProceedStep1 = roomId !== null && needCategoryId !== null;
  const canProceedStep2 =
    (inventoryItemId !== null && !quantityExceedsStock) ||
    (supplier !== null && ikeaUrl.trim() !== "");

  // Items filtrés selon la catégorie choisie à l'étape 1
  const filteredItems = selectedCategory
    ? filterInventory(inventoryItems, selectedCategory.name)
    : inventoryItems;

  // ── Helpers stock ─────────────────────────────────────────────────────────
  const remaining = (item: InventoryItem) =>
    item.quantity - (stockTaken[item.id] ?? 0);

  // ── Handlers ──────────────────────────────────────────────────────────────

  // Toggle: clicking an already-selected inventory card deselects it.
  const handleSelectItem = (id: number) => {
    if (inventoryItemId === id) {
      setInventoryItemId(null);
    } else {
      setInventoryItemId(id);
      setSupplier(null);
      setIkeaUrl("");
      setIkeaLabel("");
    }
  };

  // Toggle: clicking the active supplier card deselects it and clears its inputs.
  const handleClickSupplier = (s: "ikea" | "bruneau") => {
    if (supplier === s) {
      setSupplier(null);
      setIkeaUrl("");
      setIkeaLabel("");
    } else {
      setInventoryItemId(null);
      setSupplier(s);
      setIkeaUrl("");
      setIkeaLabel("");
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          needCategoryId,
          inventoryItemId: supplier ? null : inventoryItemId,
          ikeaUrl:         supplier ? ikeaUrl  : null,
          ikeaLabel:       supplier ? ikeaLabel : null,
          supplierName:    supplier === "ikea" ? "IKEA" : supplier === "bruneau" ? "Bruneau.be" : null,
          quantity:        quantityInt,
          suggestedBy:     username,
          comment:         comment || null,
        }),
      });
      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
      onSuccess?.();
    } catch (e) {
      setSubmitError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Étape 1 ───────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="flex flex-col gap-6 p-4">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Pièce</h2>
          <div className="flex flex-wrap gap-3">
            {rooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => setRoomId(room.id)}
                aria-pressed={roomId === room.id}
                className={`rounded-xl border-2 px-5 py-3 text-sm font-medium transition-colors ${
                  roomId === room.id
                    ? "border-[#2B5BA8] bg-[#EEF4FC] text-[#2B5BA8]"
                    : "border-[#C8C8C8] hover:border-[#5B9BD5] hover:bg-gray-50"
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
                className={`flex items-center gap-2 rounded-xl border-2 px-5 py-3 text-sm font-medium transition-colors ${
                  needCategoryId === cat.id
                    ? "border-[#2B5BA8] bg-[#EEF4FC] text-[#2B5BA8]"
                    : "border-[#C8C8C8] hover:border-[#5B9BD5] hover:bg-gray-50"
                }`}
              >
                {/* emoji séparé du nom pour que getByText("Mobilier de travail") matche exactement */}
                <span aria-hidden="true">{cat.emoji}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!canProceedStep1}
            className="rounded-xl bg-[#2B5BA8] px-8 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#5B9BD5] disabled:opacity-40"
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
      <div className="flex flex-col gap-6 p-4">

        {/* ── Section inventaire ── */}
        <section>
          <h2 className="mb-3 text-lg font-semibold">
            Choisir dans l&apos;inventaire existant
            {selectedCategory && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                — {selectedCategory.name}
              </span>
            )}
          </h2>

          {filteredItems.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#C8C8C8] p-6 text-center text-sm text-gray-400">
              Aucun article dans l&apos;inventaire pour cette catégorie.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {filteredItems.map((item) => {
                const selected = inventoryItemId === item.id;
                const rem = remaining(item);
                const outOfStock = rem <= 0;

                return (
                  <div
                    key={item.id}
                    onClick={outOfStock ? undefined : () => handleSelectItem(item.id)}
                    className={`rounded-xl border-2 p-3 transition-all ${
                      outOfStock
                        ? "cursor-not-allowed border-[#C8C8C8] opacity-40 grayscale"
                        : selected
                          ? "cursor-pointer border-[#2B5BA8] bg-[#EEF4FC] shadow-sm"
                          : "cursor-pointer border-[#C8C8C8] hover:border-[#5B9BD5] hover:shadow-sm"
                    }`}
                  >
                    {/* Photo */}
                    <div className="mb-2 flex h-36 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                      {item.photoUrl ? (
                        <Image
                          src={item.photoUrl}
                          alt={item.name}
                          width={200}
                          height={144}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl text-gray-300">📦</span>
                      )}
                    </div>

                    {/* Nom */}
                    <p className="mb-1 text-xs font-semibold leading-snug text-[#1A1A1A]">
                      {item.name}
                    </p>

                    {/* Badge stock */}
                    {outOfStock ? (
                      <span className="inline-block rounded-full bg-[#FDF2F3] px-2 py-0.5 text-xs text-[#8B2332]">
                        Stock épuisé
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {rem} restant{rem > 1 ? "s" : ""}
                      </span>
                    )}

                    {/* Bouton sélectionner — masqué si stock épuisé */}
                    {!outOfStock && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleSelectItem(item.id); }}
                        className={`mt-2 w-full rounded-lg py-1.5 text-xs font-medium transition-colors ${
                          selected
                            ? "bg-[#2B5BA8] text-white"
                            : "border border-[#C8C8C8] text-gray-600 hover:border-[#5B9BD5] hover:text-[#5B9BD5]"
                        }`}
                      >
                        {selected ? "✓ Sélectionné" : "Sélectionner"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Séparateur ── */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[#C8C8C8]" />
          <p className="text-center text-sm text-gray-500">
            Vous ne trouvez pas ce qu&apos;il vous faut ?<br />Commandez en ligne :
          </p>
          <div className="h-px flex-1 bg-[#C8C8C8]" />
        </div>

        {/* ── Section fournisseurs — cards côte à côte ── */}
        <section className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">

            {/* IKEA */}
            <button
              type="button"
              onClick={() => handleClickSupplier("ikea")}
              aria-pressed={supplier === "ikea"}
              className={`rounded-xl border-2 px-4 py-4 text-left transition-colors ${
                supplier === "ikea"
                  ? "border-[#5B9BD5] bg-[#EEF4FC]"
                  : "border-dashed border-[#C8C8C8] hover:border-[#5B9BD5] hover:bg-[#EEF4FC]"
              }`}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-2xl">🛒</span>
                <p className="font-semibold text-[#1A1A1A]">Choisir sur IKEA</p>
                <p className="text-xs text-gray-500">Mobilier et accessoires</p>
                {supplier === "ikea" && ikeaLabel && (
                  <span className="mt-1 text-xs font-medium text-[#2B5BA8]">✓ {ikeaLabel}</span>
                )}
              </div>
            </button>

            {/* Bruneau.be */}
            <button
              type="button"
              onClick={() => handleClickSupplier("bruneau")}
              aria-pressed={supplier === "bruneau"}
              className={`rounded-xl border-2 px-4 py-4 text-left transition-colors ${
                supplier === "bruneau"
                  ? "border-[#2B5BA8] bg-[#EEF4FC]"
                  : "border-dashed border-[#C8C8C8] hover:border-[#2B5BA8] hover:bg-[#EEF4FC]"
              }`}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-2xl">🏪</span>
                <p className="font-semibold text-[#1A1A1A]">Choisir sur Bruneau.be</p>
                <p className="text-xs text-gray-500">Fournitures de bureau et mobilier</p>
                {supplier === "bruneau" && ikeaLabel && (
                  <span className="mt-1 text-xs font-medium text-[#2B5BA8]">✓ {ikeaLabel}</span>
                )}
              </div>
            </button>

          </div>

          {/* Formulaire étendu IKEA — pleine largeur sous les deux cards */}
          {supplier === "ikea" && (
            <div className="flex flex-col gap-3 rounded-xl border border-[#C8C8C8] bg-[#EEF4FC] p-4">
              <p className="text-xs text-gray-500">
                Navigue sur IKEA, copie l&apos;URL du produit et colle-la ci-dessous.
              </p>
              <button
                type="button"
                onClick={() => window.open(IKEA_URL, "_blank", "noopener,noreferrer")}
                className="w-fit rounded-lg border border-[#5B9BD5] bg-white px-3 py-1.5 text-xs font-medium text-[#2B5BA8] hover:bg-[#EEF4FC]"
              >
                🔗 Ouvrir IKEA dans un nouvel onglet
              </button>
              <input
                type="url"
                placeholder="URL IKEA (ex: https://www.ikea.com/be/fr/p/...)"
                value={ikeaUrl}
                onChange={(e) => setIkeaUrl(e.target.value)}
                className="rounded-lg border border-[#C8C8C8] px-3 py-2 text-sm focus:border-[#2B5BA8] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Nom de l'article"
                value={ikeaLabel}
                onChange={(e) => setIkeaLabel(e.target.value)}
                className="rounded-lg border border-[#C8C8C8] px-3 py-2 text-sm focus:border-[#2B5BA8] focus:outline-none"
              />
              {ikeaLabel.trim() && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-[#2B5BA8]">
                  <span>✓</span><span>{ikeaLabel}</span>
                </p>
              )}
            </div>
          )}

          {/* Formulaire étendu Bruneau.be — pleine largeur sous les deux cards */}
          {supplier === "bruneau" && (
            <div className="flex flex-col gap-3 rounded-xl border border-[#C8C8C8] bg-[#EEF4FC] p-4">
              <p className="text-xs text-gray-500">
                Navigue sur Bruneau.be, copie l&apos;URL du produit et colle-la ci-dessous.
              </p>
              <button
                type="button"
                onClick={() => window.open(BRUNEAU_URL, "_blank", "noopener,noreferrer")}
                className="w-fit rounded-lg border border-[#2B5BA8] bg-white px-3 py-1.5 text-xs font-medium text-[#2B5BA8] hover:bg-[#EEF4FC]"
              >
                🔗 Ouvrir Bruneau.be dans un nouvel onglet
              </button>
              <input
                type="url"
                placeholder="URL Bruneau.be (ex: https://www.bruneau.be/...)"
                value={ikeaUrl}
                onChange={(e) => setIkeaUrl(e.target.value)}
                className="rounded-lg border border-[#C8C8C8] px-3 py-2 text-sm focus:border-[#2B5BA8] focus:outline-none"
              />
              <input
                type="text"
                placeholder="Nom de l'article"
                value={ikeaLabel}
                onChange={(e) => setIkeaLabel(e.target.value)}
                className="rounded-lg border border-[#C8C8C8] px-3 py-2 text-sm focus:border-[#2B5BA8] focus:outline-none"
              />
              {ikeaLabel.trim() && (
                <p className="flex items-center gap-1.5 text-sm font-medium text-[#2B5BA8]">
                  <span>✓</span><span>{ikeaLabel}</span>
                </p>
              )}
            </div>
          )}

        </section>

        {/* Quantité */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-[#1A1A1A]">Quantité</h2>
          <input
            type="number"
            min="1"
            value={quantityStr}
            onChange={(e) => setQuantityStr(e.target.value)}
            className={`w-24 rounded-lg border px-3 py-2 text-sm ${
              quantityExceedsStock ? "border-[#8B2332]" : "border-[#C8C8C8]"
            }`}
          />
          {quantityExceedsStock && selectedItemRemaining !== null && (
            <p className="mt-1 text-xs text-[#8B2332]">
              Quantité indisponible — il reste {selectedItemRemaining} exemplaire{selectedItemRemaining > 1 ? "s" : ""}
            </p>
          )}
        </section>

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="rounded-xl border border-[#C8C8C8] px-6 py-2.5 text-sm hover:bg-gray-50"
          >
            Retour
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            disabled={!canProceedStep2}
            className="rounded-xl bg-[#2B5BA8] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#5B9BD5] disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      </div>
    );
  }

  // ── Étape 3 ───────────────────────────────────────────────────────────────
  const articleLabel = supplier ? (ikeaLabel || ikeaUrl) : selectedItem?.name;

  return (
    <div className="flex flex-col gap-6 p-4">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Résumé</h2>
        <dl className="divide-y divide-[#C8C8C8] rounded-xl border border-[#C8C8C8] text-sm">
          {[
            { label: "Pièce",     value: selectedRoom?.name },
            { label: "Catégorie", value: selectedCategory?.name },
            { label: "Article",   value: articleLabel },
            { label: "Quantité",  value: String(quantityInt) },
          ].map(({ label, value }) => (
            <div key={label} className="flex gap-4 px-4 py-2.5">
              <dt className="w-24 font-medium text-gray-500">{label}</dt>
              <dd className="text-[#1A1A1A]">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <label htmlFor="comment" className="mb-2 block text-sm font-semibold text-[#1A1A1A]">
          Commentaire <span className="font-normal text-gray-400">(optionnel)</span>
        </label>
        <textarea
          id="comment"
          placeholder="Ajouter un commentaire..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-[#C8C8C8] px-3 py-2 text-sm focus:border-[#2B5BA8] focus:outline-none"
        />
      </section>

      {submitError && (
        <p className="rounded-xl bg-[#FDF2F3] px-4 py-2.5 text-sm text-[#8B2332]">
          ⚠ {submitError}
        </p>
      )}

      <div className="flex justify-between pt-2">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="rounded-xl border border-[#C8C8C8] px-6 py-2.5 text-sm hover:bg-gray-50"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-xl bg-[#2B5BA8] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#5B9BD5] disabled:opacity-60"
        >
          {submitting ? "Envoi en cours…" : "Valider"}
        </button>
      </div>
    </div>
  );
}
