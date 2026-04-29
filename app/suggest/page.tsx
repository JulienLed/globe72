export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { SuggestClient } from "./SuggestClient";

export default async function SuggestPage() {
  const [rooms, categories, inventoryItems, stockAgg] = await Promise.all([
    prisma.room.findMany({ orderBy: { id: "asc" } }),
    prisma.needCategory.findMany({ orderBy: { id: "asc" } }),
    prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
    prisma.suggestion.groupBy({
      by: ["inventoryItemId"],
      where: { inventoryItemId: { not: null } },
      _sum: { quantity: true },
    }),
  ]);

  // Build stockTaken map: inventoryItemId → total quantity already suggested
  const stockTaken: Record<number, number> = {};
  for (const row of stockAgg) {
    if (row.inventoryItemId !== null) {
      stockTaken[row.inventoryItemId] = row._sum.quantity ?? 0;
    }
  }

  return (
    <SuggestClient
      rooms={rooms}
      categories={categories}
      inventoryItems={inventoryItems}
      stockTaken={stockTaken}
    />
  );
}
