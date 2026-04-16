import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { roomId, needCategoryId, suggestedBy, quantity, inventoryItemId, ikeaUrl, ikeaLabel, comment } = body;

  if (!roomId || !needCategoryId || !suggestedBy) {
    return NextResponse.json({ error: "roomId, needCategoryId and suggestedBy are required" }, { status: 400 });
  }

  const suggestion = await prisma.suggestion.create({
    data: { roomId, needCategoryId, suggestedBy, quantity: quantity ?? 1, inventoryItemId: inventoryItemId ?? null, ikeaUrl: ikeaUrl ?? null, ikeaLabel: ikeaLabel ?? null, comment: comment ?? null },
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

  return NextResponse.json(suggestions, { status: 200 });
}
