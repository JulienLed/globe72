import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const suggestedBy = searchParams.get("suggestedBy");

  if (!suggestedBy) {
    return NextResponse.json({ error: "suggestedBy is required" }, { status: 400 });
  }

  const idea = await prisma.signageIdea.findFirst({
    where: { suggestedBy },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(idea, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { text, suggestedBy } = body;

  if (!text || !suggestedBy) {
    return NextResponse.json({ error: "text and suggestedBy are required" }, { status: 400 });
  }

  const idea = await prisma.signageIdea.create({
    data: { text, suggestedBy },
  });

  return NextResponse.json(idea, { status: 201 });
}
