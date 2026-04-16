/**
 * Détecte les conflits parmi une liste de suggestions.
 *
 * Un conflit existe quand, pour la même combinaison room + catégorie,
 * au moins deux suggestions portent sur des articles DIFFÉRENTS.
 * L'identité d'un article est : inventoryItemId s'il est renseigné, sinon ikeaUrl.
 *
 * @returns Set de clés au format "roomId-needCategoryId"
 */
export function detectConflicts(
  suggestions: Array<{
    roomId: number;
    needCategoryId: number;
    inventoryItemId: number | null;
    ikeaUrl: string | null;
  }>
): Set<string> {
  // Groupe : clé → ensemble des identités d'articles distincts
  const groups = new Map<string, Set<string>>();

  for (const s of suggestions) {
    const groupKey = `${s.roomId}-${s.needCategoryId}`;
    const articleId =
      s.inventoryItemId !== null ? `item-${s.inventoryItemId}` : `ikea-${s.ikeaUrl}`;

    if (!groups.has(groupKey)) groups.set(groupKey, new Set());
    groups.get(groupKey)!.add(articleId);
  }

  const conflicts = new Set<string>();
  for (const [key, articles] of groups) {
    if (articles.size > 1) conflicts.add(key);
  }

  return conflicts;
}
