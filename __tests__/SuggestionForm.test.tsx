// @vitest-environment jsdom
/**
 * Tests composants — SuggestionForm stepper (TDD step 4)
 * Le composant n'existe pas encore : ces tests échouent jusqu'à l'étape 5.
 *
 * Composant attendu : components/SuggestionForm.tsx
 * Props : { rooms, categories, inventoryItems, username }
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestionForm } from "@/components/SuggestionForm";

// ── Données de test ───────────────────────────────────────────────────────────

const mockRooms = [
  { id: 1, name: "Bureau locatif", dimensions: "4.5m x 3.5m" },
  { id: 2, name: "Salle d'attente", dimensions: "4.5m x 3m" },
];

const mockCategories = [
  { id: 1, name: "Mobilier de travail", emoji: "🖥️" },
  { id: 2, name: "Assise & accueil", emoji: "🛋️" },
];

const mockInventoryItems = [
  { id: 10, name: "Grand bureau (3 parties)", category: "Mobilier de bureau", quantity: 5, photoUrl: null, notes: null },
  { id: 11, name: "Fauteuils de bureau", category: "Mobilier de bureau", quantity: 3, photoUrl: null, notes: null },
];

const defaultProps = {
  rooms: mockRooms,
  categories: mockCategories,
  inventoryItems: mockInventoryItems,
  username: "Amy",
};

// Helper : amène le formulaire à l'étape 2 (pièce + catégorie sélectionnées)
async function goToStep2(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText("Bureau locatif"));
  await user.click(screen.getByText("Mobilier de travail"));
  await user.click(screen.getByRole("button", { name: /suivant/i }));
}

// Helper : amène le formulaire à l'étape 3 (item inventaire sélectionné)
async function goToStep3(user: ReturnType<typeof userEvent.setup>) {
  await goToStep2(user);
  await user.click(screen.getByText("Grand bureau (3 parties)"));
  await user.click(screen.getByRole("button", { name: /suivant/i }));
}

// ── Étape 1 : pièce & catégorie ───────────────────────────────────────────────

describe("SuggestionForm — Étape 1 : pièce & catégorie", () => {
  it("affiche les deux pièces disponibles", () => {
    render(<SuggestionForm {...defaultProps} />);
    expect(screen.getByText("Bureau locatif")).toBeInTheDocument();
    expect(screen.getByText("Salle d'attente")).toBeInTheDocument();
  });

  it("affiche les catégories de besoins avec leur emoji", () => {
    render(<SuggestionForm {...defaultProps} />);
    expect(screen.getByText(/Mobilier de travail/)).toBeInTheDocument();
    expect(screen.getByText(/Assise & accueil/)).toBeInTheDocument();
  });

  it("le bouton Suivant est désactivé si aucune pièce ni catégorie n'est sélectionnée", () => {
    render(<SuggestionForm {...defaultProps} />);
    expect(screen.getByRole("button", { name: /suivant/i })).toBeDisabled();
  });

  it("le bouton Suivant reste désactivé si seulement la pièce est sélectionnée", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await user.click(screen.getByText("Bureau locatif"));
    expect(screen.getByRole("button", { name: /suivant/i })).toBeDisabled();
  });

  it("le bouton Suivant reste désactivé si seulement la catégorie est sélectionnée", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await user.click(screen.getByText("Mobilier de travail"));
    expect(screen.getByRole("button", { name: /suivant/i })).toBeDisabled();
  });

  it("le bouton Suivant est activé quand pièce ET catégorie sont sélectionnées", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await user.click(screen.getByText("Bureau locatif"));
    await user.click(screen.getByText("Mobilier de travail"));
    expect(screen.getByRole("button", { name: /suivant/i })).toBeEnabled();
  });

  it("clique sur Suivant passe à l'étape 2", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await user.click(screen.getByText("Bureau locatif"));
    await user.click(screen.getByText("Mobilier de travail"));
    await user.click(screen.getByRole("button", { name: /suivant/i }));
    expect(screen.getByText("Grand bureau (3 parties)")).toBeInTheDocument();
  });
});

// ── Étape 2 : article ─────────────────────────────────────────────────────────

describe("SuggestionForm — Étape 2 : article", () => {
  it("affiche les items de l'inventaire", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep2(user);
    expect(screen.getByText("Grand bureau (3 parties)")).toBeInTheDocument();
    expect(screen.getByText("Fauteuils de bureau")).toBeInTheDocument();
  });

  it("affiche l'option IKEA (hors inventaire)", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep2(user);
    expect(screen.getByText(/ikea/i)).toBeInTheDocument();
  });

  it("l'option IKEA révèle les champs URL et label", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep2(user);
    await user.click(screen.getByText(/ikea/i));
    expect(screen.getByPlaceholderText(/url/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/label|nom|article/i)).toBeInTheDocument();
  });

  it("le champ quantité vaut 1 par défaut", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep2(user);
    const qty = screen.getByRole("spinbutton");
    expect(qty).toHaveValue(1);
  });

  it("le champ quantité ne peut pas descendre en dessous de 1", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep2(user);
    const qty = screen.getByRole("spinbutton");
    expect(qty).toHaveAttribute("min", "1");
  });

  it("le bouton Suivant est désactivé si aucun article n'est sélectionné", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep2(user);
    expect(screen.getByRole("button", { name: /suivant/i })).toBeDisabled();
  });

  it("le bouton Suivant est activé après sélection d'un item inventaire", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep2(user);
    await user.click(screen.getByText("Grand bureau (3 parties)"));
    expect(screen.getByRole("button", { name: /suivant/i })).toBeEnabled();
  });

  it("le bouton Suivant est activé après saisie d'une URL IKEA", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep2(user);
    await user.click(screen.getByText(/ikea/i));
    await user.type(screen.getByPlaceholderText(/url/i), "https://www.ikea.com/fr/fr/p/desk-123");
    expect(screen.getByRole("button", { name: /suivant/i })).toBeEnabled();
  });

  it("clique sur Suivant passe à l'étape 3", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep3(user);
    expect(screen.getByRole("button", { name: /valider/i })).toBeInTheDocument();
  });
});

// ── Étape 3 : commentaire & validation ───────────────────────────────────────

describe("SuggestionForm — Étape 3 : commentaire & validation", () => {
  it("affiche un résumé avec la pièce sélectionnée", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep3(user);
    expect(screen.getByText(/Bureau locatif/)).toBeInTheDocument();
  });

  it("affiche un résumé avec la catégorie sélectionnée", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep3(user);
    expect(screen.getByText(/Mobilier de travail/)).toBeInTheDocument();
  });

  it("affiche un résumé avec l'article sélectionné", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep3(user);
    expect(screen.getByText(/Grand bureau/)).toBeInTheDocument();
  });

  it("le champ commentaire est présent et optionnel", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep3(user);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("le bouton Valider est présent et activé sans commentaire", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep3(user);
    expect(screen.getByRole("button", { name: /valider/i })).toBeEnabled();
  });

  it("clique sur Valider appelle POST /api/suggestions avec les bonnes données", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 99 }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<SuggestionForm {...defaultProps} />);
    await goToStep3(user);
    await user.type(screen.getByRole("textbox"), "Mon commentaire");
    await user.click(screen.getByRole("button", { name: /valider/i }));

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/suggestions",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"roomId":1'),
      })
    );

    vi.unstubAllGlobals();
  });
});

// ── Navigation : bouton Retour ────────────────────────────────────────────────

describe("SuggestionForm — Navigation : bouton Retour", () => {
  it("Retour à l'étape 2 ramène à l'étape 1 (pièces visibles)", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep2(user);
    await user.click(screen.getByRole("button", { name: /retour/i }));
    expect(screen.getByText("Salle d'attente")).toBeInTheDocument();
  });

  it("Retour à l'étape 3 ramène à l'étape 2 (items inventaire visibles)", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);
    await goToStep3(user);
    await user.click(screen.getByRole("button", { name: /retour/i }));
    expect(screen.getByText("Fauteuils de bureau")).toBeInTheDocument();
  });
});

// ── Happy path complet ────────────────────────────────────────────────────────

describe("SuggestionForm — Happy path complet", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1 }),
    }));
  });

  it("permet de soumettre une suggestion en passant les 3 étapes", async () => {
    const user = userEvent.setup();
    render(<SuggestionForm {...defaultProps} />);

    // Étape 1
    await user.click(screen.getByText("Bureau locatif"));
    await user.click(screen.getByText("Mobilier de travail"));
    await user.click(screen.getByRole("button", { name: /suivant/i }));

    // Étape 2 — item inventaire + quantité
    await user.click(screen.getByText("Grand bureau (3 parties)"));
    const qty = screen.getByRole("spinbutton");
    await user.clear(qty);
    await user.type(qty, "2");
    await user.click(screen.getByRole("button", { name: /suivant/i }));

    // Étape 3 — commentaire + submit
    await user.type(screen.getByRole("textbox"), "Pour la salle principale");
    await user.click(screen.getByRole("button", { name: /valider/i }));

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const body = JSON.parse(fetchCall[1]!.body as string);

    expect(body.roomId).toBe(1);
    expect(body.needCategoryId).toBe(1);
    expect(body.inventoryItemId).toBe(10);
    expect(body.quantity).toBe(2);
    expect(body.suggestedBy).toBe("Amy");
    expect(body.comment).toBe("Pour la salle principale");

    vi.unstubAllGlobals();
  });
});
