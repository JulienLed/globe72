export function buildSuggestedByMap(
  suggestions: { inventoryItemId: number | null; suggestedBy: string }[],
): Record<number, string[]> {
  const map: Record<number, string[]> = {};
  for (const s of suggestions) {
    if (s.inventoryItemId === null) continue;
    if (!map[s.inventoryItemId]) map[s.inventoryItemId] = [];
    if (!map[s.inventoryItemId].includes(s.suggestedBy)) {
      map[s.inventoryItemId].push(s.suggestedBy);
    }
  }
  return map;
}
