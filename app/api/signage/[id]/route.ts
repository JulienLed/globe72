import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const { text } = await req.json();
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const idea = await prisma.signageIdea.update({
    where: { id: numId },
    data: { text },
  });

  return NextResponse.json(idea, { status: 200 });
}
