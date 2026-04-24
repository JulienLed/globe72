import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const fd = await req.formData();

  const name = fd.get("name") as string | null;
  const quantityRaw = fd.get("quantity") as string | null;
  const category = (fd.get("category") as string | null) ?? "";
  const notes = (fd.get("notes") as string | null) || null;
  const photo = fd.get("photo") as File | null;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!quantityRaw) {
    return NextResponse.json({ error: "quantity is required" }, { status: 400 });
  }

  const quantity = parseInt(quantityRaw, 10);
  if (isNaN(quantity) || quantity < 1) {
    return NextResponse.json({ error: "quantity must be a positive integer" }, { status: 400 });
  }

  let photoUrl: string | null = null;
  if (photo && photo.size > 0) {
    const blob = await put(photo.name, photo, { access: "public" });
    photoUrl = blob.url;
  }

  const item = await prisma.inventoryItem.create({
    data: { name, quantity, category, notes, photoUrl },
  });

  return NextResponse.json(item, { status: 201 });
}

export async function GET() {
  const items = await prisma.inventoryItem.findMany({
    orderBy: { id: "desc" },
  });
  return NextResponse.json(items, { status: 200 });
}
