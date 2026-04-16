import { describe, it, expect } from "vitest";
import { detectConflicts } from "@/lib/detectConflicts";

// Helpers pour construire des suggestions minimales
const s = (roomId: number, needCategoryId: number, inventoryItemId: number | null, ikeaUrl: string | null = null) =>
  ({ roomId, needCategoryId, inventoryItemId, ikeaUrl });

describe("detectConflicts", () => {
  it("renvoie un Set vide si aucune suggestion", () => {
    expect(detectConflicts([])).toEqual(new Set());
  });

  it("renvoie un Set vide si chaque groupe room+catégorie a un seul article", () => {
    const suggestions = [
      s(1, 1, 10),
      s(1, 2, 11),
      s(2, 1, 12),
    ];
    expect(detectConflicts(suggestions)).toEqual(new Set());
  });

  it("pas de conflit quand plusieurs personnes proposent le MÊME article inventaire", () => {
    // Amy et Simon proposent tous les deux l'item 10 pour room 1 + cat 1
    const suggestions = [s(1, 1, 10), s(1, 1, 10)];
    expect(detectConflicts(suggestions)).toEqual(new Set());
  });

  it("pas de conflit quand plusieurs personnes proposent la MÊME URL IKEA", () => {
    const url = "https://www.ikea.com/fr/fr/p/desk-123";
    const suggestions = [s(1, 1, null, url), s(1, 1, null, url)];
    expect(detectConflicts(suggestions)).toEqual(new Set());
  });

  it("détecte un conflit quand deux articles inventaire différents dans le même groupe", () => {
    const suggestions = [
      s(1, 1, 10), // Amy → item 10
      s(1, 1, 11), // Simon → item 11
    ];
    const conflicts = detectConflicts(suggestions);
    expect(conflicts.has("1-1")).toBe(true);
    expect(conflicts.size).toBe(1);
  });

  it("détecte un conflit entre un article inventaire et une URL IKEA", () => {
    const suggestions = [
      s(1, 2, 10),                                             // inventaire
      s(1, 2, null, "https://www.ikea.com/fr/fr/p/chair-99"), // IKEA
    ];
    const conflicts = detectConflicts(suggestions);
    expect(conflicts.has("1-2")).toBe(true);
  });

  it("détecte des conflits dans plusieurs groupes simultanément", () => {
    const suggestions = [
      s(1, 1, 10), s(1, 1, 11), // conflit room 1 / cat 1
      s(2, 3, 20), s(2, 3, 21), // conflit room 2 / cat 3
      s(1, 2, 30), s(1, 2, 30), // pas de conflit (même article)
    ];
    const conflicts = detectConflicts(suggestions);
    expect(conflicts.has("1-1")).toBe(true);
    expect(conflicts.has("2-3")).toBe(true);
    expect(conflicts.has("1-2")).toBe(false);
    expect(conflicts.size).toBe(2);
  });

  it("les clés sont au format 'roomId-needCategoryId'", () => {
    const suggestions = [s(3, 5, 10), s(3, 5, 99)];
    const conflicts = detectConflicts(suggestions);
    expect(conflicts.has("3-5")).toBe(true);
  });

  it("pas de contamination entre groupes différents", () => {
    // Même article dans deux pièces différentes → pas de conflit
    const suggestions = [
      s(1, 1, 10), // room 1
      s(2, 1, 11), // room 2 — article différent mais groupe différent
    ];
    expect(detectConflicts(suggestions)).toEqual(new Set());
  });
});
