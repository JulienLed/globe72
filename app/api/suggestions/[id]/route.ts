import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await params;
  const id = parseInt(rawId, 10);

  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const existing = await prisma.suggestion.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  await prisma.suggestion.delete({ where: { id } });
  return NextResponse.json({ success: true }, { status: 200 });
}
