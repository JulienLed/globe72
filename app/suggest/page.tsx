import { prisma } from "@/lib/prisma";
import { SuggestClient } from "./SuggestClient";

export default async function SuggestPage() {
  const [rooms, categories, inventoryItems] = await Promise.all([
    prisma.room.findMany({ orderBy: { id: "asc" } }),
    prisma.needCategory.findMany({ orderBy: { id: "asc" } }),
    prisma.inventoryItem.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <SuggestClient
      rooms={rooms}
      categories={categories}
      inventoryItems={inventoryItems}
    />
  );
}
