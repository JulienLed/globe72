import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    signageIdea: {
      create: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { POST, GET } from "@/app/api/signage/route";

function makeRequest(method: string, url: string, body?: unknown): Request {
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

const validBody = { text: "Mettre une vitrine avec le logo ABC", suggestedBy: "Amy" };
const createdIdea = { id: 1, ...validBody, createdAt: new Date("2026-04-24T10:00:00Z") };

describe("POST /api/signage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crée une idée signalétique et renvoie 201", async () => {
    vi.mocked(prisma.signageIdea.create).mockResolvedValue(createdIdea as never);

    const req = makeRequest("POST", "http://localhost/api/signage", validBody);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.id).toBe(1);
    expect(json.suggestedBy).toBe("Amy");
    expect(prisma.signageIdea.create).toHaveBeenCalledOnce();
  });

  it("renvoie 400 si text est absent", async () => {
    const { text: _omitted, ...bodyWithoutText } = validBody;
    const req = makeRequest("POST", "http://localhost/api/signage", bodyWithoutText);
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(prisma.signageIdea.create).not.toHaveBeenCalled();
  });

  it("renvoie 400 si suggestedBy est absent", async () => {
    const { suggestedBy: _omitted, ...bodyWithoutUser } = validBody;
    const req = makeRequest("POST", "http://localhost/api/signage", bodyWithoutUser);
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(prisma.signageIdea.create).not.toHaveBeenCalled();
  });
});

describe("GET /api/signage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renvoie l'idée existante pour l'utilisateur", async () => {
    vi.mocked(prisma.signageIdea.findFirst).mockResolvedValue(createdIdea as never);

    const req = makeRequest("GET", "http://localhost/api/signage?suggestedBy=Amy");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.id).toBe(1);
    expect(json.text).toBe(validBody.text);
    expect(prisma.signageIdea.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { suggestedBy: "Amy" } })
    );
  });

  it("renvoie null si aucune idée n'existe pour l'utilisateur", async () => {
    vi.mocked(prisma.signageIdea.findFirst).mockResolvedValue(null as never);

    const req = makeRequest("GET", "http://localhost/api/signage?suggestedBy=Simon");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toBeNull();
  });

  it("renvoie 400 si suggestedBy est absent", async () => {
    const req = makeRequest("GET", "http://localhost/api/signage");
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(prisma.signageIdea.findFirst).not.toHaveBeenCalled();
  });
});
