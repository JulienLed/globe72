import { describe, it, expect } from "vitest";
import { detectConflicts } from "@/lib/detectConflicts";

// Helper : construit une suggestion minimale
const s = (
  roomId: number,
  needCategoryId: number,
  inventoryItemId: number | null,
  suggestedBy = "Amy",
  ikeaUrl: string | null = null
) => ({ roomId, needCategoryId, inventoryItemId, ikeaUrl, suggestedBy });

describe("detectConflicts", () => {
  it("renvoie un Set vide si aucune suggestion", () => {
    expect(detectConflicts([])).toEqual(new Set());
  });

  it("renvoie un Set vide si une seule suggestion par groupe", () => {
    const suggestions = [s(1, 1, 10), s(1, 2, 11), s(2, 1, 12)];
    expect(detectConflicts(suggestions)).toEqual(new Set());
  });

  // ── Cas NON-conflictuels ──────────────────────────────────────────────────

  it("pas de conflit : même utilisateur, même article (doublon POST)", () => {
    const suggestions = [s(1, 1, 10, "Amy"), s(1, 1, 10, "Amy")];
    expect(detectConflicts(suggestions)).toEqual(new Set());
  });

  it("pas de conflit : utilisateurs DIFFÉRENTS, même article (consensus)", () => {
    const suggestions = [s(1, 1, 10, "Amy"), s(1, 1, 10, "Simon")];
    expect(detectConflicts(suggestions)).toEqual(new Set());
  });

  it("pas de conflit : même utilisateur, articles différents (changement d'avis)", () => {
    const suggestions = [s(1, 1, 10, "Amy"), s(1, 1, 11, "Amy")];
    expect(detectConflicts(suggestions)).toEqual(new Set());
  });

  it("pas de conflit : même URL IKEA proposée par deux utilisateurs différents", () => {
    const url = "https://www.ikea.com/be/fr/p/desk-123";
    const suggestions = [s(1, 1, null, "Amy", url), s(1, 1, null, "Simon", url)];
    expect(detectConflicts(suggestions)).toEqual(new Set());
  });

  // ── Cas conflictuels ──────────────────────────────────────────────────────

  it("CONFLIT : deux utilisateurs différents, articles inventaire différents", () => {
    const suggestions = [
      s(1, 1, 10, "Amy"),   // Amy → item 10
      s(1, 1, 11, "Simon"), // Simon → item 11
    ];
    const conflicts = detectConflicts(suggestions);
    expect(conflicts.has("1-1")).toBe(true);
    expect(conflicts.size).toBe(1);
  });

  it("CONFLIT : un utilisateur inventaire vs un autre utilisateur IKEA", () => {
    const suggestions = [
      s(1, 2, 10, "Amy"),
      s(1, 2, null, "Simon", "https://www.ikea.com/be/fr/p/chair-99"),
    ];
    const conflicts = detectConflicts(suggestions);
    expect(conflicts.has("1-2")).toBe(true);
  });

  it("CONFLIT : 3 utilisateurs dont 2 ont des articles différents", () => {
    const suggestions = [
      s(1, 1, 10, "Amy"),
      s(1, 1, 10, "Rebecca"), // même article qu'Amy → pas un conflit avec Amy
      s(1, 1, 11, "Simon"),   // article différent de Amy → CONFLIT Amy/Simon
    ];
    const conflicts = detectConflicts(suggestions);
    expect(conflicts.has("1-1")).toBe(true);
  });

  it("détecte des conflits dans plusieurs groupes simultanément", () => {
    const suggestions = [
      s(1, 1, 10, "Amy"),   s(1, 1, 11, "Simon"),   // conflit room 1 / cat 1
      s(2, 3, 20, "Amy"),   s(2, 3, 21, "Rebecca"),  // conflit room 2 / cat 3
      s(1, 2, 30, "Amy"),   s(1, 2, 30, "Simon"),    // même article → pas de conflit
    ];
    const conflicts = detectConflicts(suggestions);
    expect(conflicts.has("1-1")).toBe(true);
    expect(conflicts.has("2-3")).toBe(true);
    expect(conflicts.has("1-2")).toBe(false);
    expect(conflicts.size).toBe(2);
  });

  it("les clés sont au format 'roomId-needCategoryId'", () => {
    const suggestions = [s(3, 5, 10, "Amy"), s(3, 5, 99, "Simon")];
    const conflicts = detectConflicts(suggestions);
    expect(conflicts.has("3-5")).toBe(true);
  });

  it("pas de contamination entre groupes (room différente = groupes distincts)", () => {
    const suggestions = [
      s(1, 1, 10, "Amy"),
      s(2, 1, 11, "Simon"), // article différent mais dans une autre pièce
    ];
    expect(detectConflicts(suggestions)).toEqual(new Set());
  });
});
