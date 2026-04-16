/**
 * Tests API — routes suggestions (TDD step 2)
 * Les routes n'existent pas encore : ces tests échouent jusqu'à l'étape 3.
 *
 * Convention Next.js App Router :
 *   POST/GET  → app/api/suggestions/route.ts        → exports { POST, GET }
 *   DELETE    → app/api/suggestions/[id]/route.ts   → exports { DELETE }
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

// --- mock lib/prisma.ts ---------------------------------------------------
vi.mock("@/lib/prisma", () => ({
  prisma: {
    suggestion: {
      create: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { POST, GET } from "@/app/api/suggestions/route";
import { DELETE } from "@/app/api/suggestions/[id]/route";

// Helper : crée une Request Next.js à partir d'une URL et d'un body JSON optionnel
function makeRequest(
  method: string,
  url: string,
  body?: unknown
): Request {
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Payload valide pour créer une suggestion
const validBody = {
  roomId: 1,
  needCategoryId: 2,
  suggestedBy: "Amy",
  quantity: 2,
  inventoryItemId: null,
  ikeaUrl: null,
  ikeaLabel: null,
  comment: "Test comment",
};

// Résultat fictif renvoyé par prisma.suggestion.create
const createdSuggestion = {
  id: 42,
  ...validBody,
  createdAt: new Date("2026-04-16T10:00:00Z"),
};

// -------------------------------------------------------------------------

describe("POST /api/suggestions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crée une suggestion et renvoie 201 avec l'objet créé", async () => {
    vi.mocked(prisma.suggestion.create).mockResolvedValue(createdSuggestion as never);

    const req = makeRequest("POST", "http://localhost/api/suggestions", validBody);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.id).toBe(42);
    expect(json.suggestedBy).toBe("Amy");
    expect(prisma.suggestion.create).toHaveBeenCalledOnce();
  });

  it("renvoie 400 si roomId est absent", async () => {
    const { roomId: _omitted, ...bodyWithoutRoom } = validBody;
    const req = makeRequest("POST", "http://localhost/api/suggestions", bodyWithoutRoom);
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("renvoie 400 si needCategoryId est absent", async () => {
    const { needCategoryId: _omitted, ...bodyWithoutCategory } = validBody;
    const req = makeRequest("POST", "http://localhost/api/suggestions", bodyWithoutCategory);
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it("renvoie 400 si suggestedBy est absent", async () => {
    const { suggestedBy: _omitted, ...bodyWithoutUser } = validBody;
    const req = makeRequest("POST", "http://localhost/api/suggestions", bodyWithoutUser);
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// -------------------------------------------------------------------------

describe("GET /api/suggestions", () => {
  beforeEach(() => vi.clearAllMocks());

  const suggestionList = [createdSuggestion, { ...createdSuggestion, id: 43, suggestedBy: "Simon" }];

  it("renvoie 200 avec toutes les suggestions sans filtre", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(suggestionList as never);

    const req = makeRequest("GET", "http://localhost/api/suggestions");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.suggestions).toHaveLength(2);
    expect(prisma.suggestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it("filtre par roomId si le query param est fourni", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue([createdSuggestion] as never);

    const req = makeRequest("GET", "http://localhost/api/suggestions?roomId=1");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.suggestions).toHaveLength(1);
    expect(prisma.suggestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { roomId: 1 } })
    );
  });

  it("filtre par categoryId si le query param est fourni", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue([createdSuggestion] as never);

    const req = makeRequest("GET", "http://localhost/api/suggestions?categoryId=2");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(prisma.suggestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { needCategoryId: 2 } })
    );
  });

  it("filtre par roomId ET categoryId simultanément", async () => {
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue([createdSuggestion] as never);

    const req = makeRequest("GET", "http://localhost/api/suggestions?roomId=1&categoryId=2");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(prisma.suggestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { roomId: 1, needCategoryId: 2 } })
    );
  });

  it("calcule le stock consommé (stockTaken) par inventoryItemId", async () => {
    const stockSuggestions = [
      { ...createdSuggestion, id: 1, inventoryItemId: 10, quantity: 2 },
      { ...createdSuggestion, id: 2, inventoryItemId: 10, quantity: 1 }, // même item → total 3
      { ...createdSuggestion, id: 3, inventoryItemId: 11, quantity: 3 },
      { ...createdSuggestion, id: 4, inventoryItemId: null, ikeaUrl: "https://ikea.com/p/123", quantity: 1 }, // pas comptabilisé
    ];
    vi.mocked(prisma.suggestion.findMany).mockResolvedValue(stockSuggestions as never);

    const req = makeRequest("GET", "http://localhost/api/suggestions");
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.stockTaken["10"]).toBe(3); // 2 + 1
    expect(json.stockTaken["11"]).toBe(3);
    expect(json.stockTaken["null"]).toBeUndefined(); // suggestions IKEA ignorées
  });
});

// -------------------------------------------------------------------------

describe("DELETE /api/suggestions/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("supprime la suggestion et renvoie 200", async () => {
    vi.mocked(prisma.suggestion.findUnique).mockResolvedValue(createdSuggestion as never);
    vi.mocked(prisma.suggestion.delete).mockResolvedValue(createdSuggestion as never);

    const req = makeRequest("DELETE", "http://localhost/api/suggestions/42");
    const res = await DELETE(req, { params: Promise.resolve({ id: "42" }) });

    expect(res.status).toBe(200);
    expect(prisma.suggestion.delete).toHaveBeenCalledWith({ where: { id: 42 } });
  });

  it("renvoie 404 si la suggestion n'existe pas", async () => {
    vi.mocked(prisma.suggestion.findUnique).mockResolvedValue(null);

    const req = makeRequest("DELETE", "http://localhost/api/suggestions/999");
    const res = await DELETE(req, { params: Promise.resolve({ id: "999" }) });

    expect(res.status).toBe(404);
    expect(prisma.suggestion.delete).not.toHaveBeenCalled();
  });

  it("renvoie 400 si l'id n'est pas un entier valide", async () => {
    const req = makeRequest("DELETE", "http://localhost/api/suggestions/abc");
    const res = await DELETE(req, { params: Promise.resolve({ id: "abc" }) });

    expect(res.status).toBe(400);
  });
});
