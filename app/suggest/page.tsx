// Revalidate every 30 s instead of force-dynamic: avoids blocking every
// navigation on 4 Neon round-trips.  30-second staleness is acceptable for a
// 5-user internal app; the submit API route already validates stock server-side.
export const revalidate = 30;

import { prisma } from "@/lib/prisma";
import { buildSuggestedByMap } from "@/lib/buildSuggestedByMap";
import { SuggestClient } from "./SuggestClient";

export default async function SuggestPage() {
  const [rooms, categories, inventoryItems, stockAgg, allSuggestions] =
    await Promise.all([
      prisma.room.findMany({ orderBy: { id: "asc" } }),
      prisma.needCategory.findMany({ orderBy: { id: "asc" } }),
      prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
      prisma.suggestion.groupBy({
        by: ["inventoryItemId"],
        where: { inventoryItemId: { not: null } },
        _sum: { quantity: true },
      }),
      prisma.suggestion.findMany({
        where: { inventoryItemId: { not: null } },
        select: { inventoryItemId: true, suggestedBy: true },
      }),
    ]);

  // Build stockTaken map: inventoryItemId → total quantity already suggested
  const stockTaken: Record<number, number> = {};
  for (const row of stockAgg) {
    if (row.inventoryItemId !== null) {
      stockTaken[row.inventoryItemId] = row._sum.quantity ?? 0;
    }
  }

  const suggestedBy = buildSuggestedByMap(allSuggestions);

  return (
    <SuggestClient
      rooms={rooms}
      categories={categories}
      inventoryItems={inventoryItems}
      stockTaken={stockTaken}
      suggestedBy={suggestedBy}
    />
  );
}
