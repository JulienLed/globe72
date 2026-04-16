import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { roomId, needCategoryId, suggestedBy, quantity, inventoryItemId, ikeaUrl, ikeaLabel, supplierName, comment } = body;

  if (!roomId || !needCategoryId || !suggestedBy) {
    return NextResponse.json({ error: "roomId, needCategoryId and suggestedBy are required" }, { status: 400 });
  }

  const suggestion = await prisma.suggestion.create({
    data: { roomId, needCategoryId, suggestedBy, quantity: quantity ?? 1, inventoryItemId: inventoryItemId ?? null, ikeaUrl: ikeaUrl ?? null, ikeaLabel: ikeaLabel ?? null, supplierName: supplierName ?? null, comment: comment ?? null },
  });

  return NextResponse.json(suggestion, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const categoryId = searchParams.get("categoryId");

  const where: Record<string, number> = {};
  if (roomId) where.roomId = parseInt(roomId, 10);
  if (categoryId) where.needCategoryId = parseInt(categoryId, 10);

  const suggestions = await prisma.suggestion.findMany({
    where,
    include: { room: true, needCategory: true, inventoryItem: true },
    orderBy: { createdAt: "asc" },
  });

  // Aggregate total quantity already suggested per inventoryItemId
  // (computed from the fetched set — callers without filters get global stock)
  const stockTaken: Record<string, number> = {};
  for (const s of suggestions) {
    if (s.inventoryItemId !== null) {
      const key = String(s.inventoryItemId);
      stockTaken[key] = (stockTaken[key] ?? 0) + s.quantity;
    }
  }

  return NextResponse.json({ suggestions, stockTaken }, { status: 200 });
}
