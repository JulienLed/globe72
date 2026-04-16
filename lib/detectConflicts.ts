/**
 * Détecte les conflits parmi une liste de suggestions.
 *
 * Un conflit existe quand, pour la même combinaison room + catégorie,
 * au moins 2 UTILISATEURS DIFFÉRENTS ont proposé des articles DIFFÉRENTS.
 *
 * Cas NON-conflictuels :
 *   - Même utilisateur, articles différents (l'utilisateur a changé d'avis)
 *   - Utilisateurs différents, même article (consensus)
 *   - Un seul utilisateur, quel que soit l'article
 *
 * @returns Set de clés au format "roomId-needCategoryId"
 */
export function detectConflicts(
  suggestions: Array<{
    roomId: number;
    needCategoryId: number;
    inventoryItemId: number | null;
    ikeaUrl: string | null;
    suggestedBy: string;
  }>
): Set<string> {
  // Groupe : clé → liste de { user, articleId }
  const groups = new Map<string, Array<{ user: string; articleId: string }>>();

  for (const s of suggestions) {
    const groupKey = `${s.roomId}-${s.needCategoryId}`;
    const articleId =
      s.inventoryItemId !== null ? `item-${s.inventoryItemId}` : `ikea-${s.ikeaUrl}`;

    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey)!.push({ user: s.suggestedBy, articleId });
  }

  const conflicts = new Set<string>();

  for (const [key, entries] of groups) {
    // Conflit si on trouve deux entrées de DEUX utilisateurs DIFFÉRENTS avec des articles DIFFÉRENTS
    const hasConflict = entries.some((a, i) =>
      entries.slice(i + 1).some((b) => a.user !== b.user && a.articleId !== b.articleId)
    );
    if (hasConflict) conflicts.add(key);
  }

  return conflicts;
}
