import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    inventoryItem: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("@vercel/blob", () => ({
  put: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { POST, GET } from "@/app/api/inventory/route";
import { DELETE } from "@/app/api/inventory/[id]/route";

const mockPut = vi.mocked(put);

function makeFormDataRequest(url: string, fields: Record<string, string | File>): Request {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return new Request(url, { method: "POST", body: fd });
}

const mockPhoto = new File(["img"], "photo.jpg", { type: "image/jpeg" });

const validFields = {
  name: "Lampe de bureau",
  quantity: "2",
  category: "Mobilier de bureau",
  photo: mockPhoto,
};

const createdItem = {
  id: 99,
  name: "Lampe de bureau",
  quantity: 2,
  category: "Mobilier de bureau",
  photoUrl: "https://blob.vercel-storage.com/photo.jpg",
  notes: null,
};

// ---------------------------------------------------------------------------

describe("POST /api/inventory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crée un item, appelle put() et renvoie 201", async () => {
    mockPut.mockResolvedValue({ url: "https://blob.vercel-storage.com/photo.jpg" } as never);
    vi.mocked(prisma.inventoryItem.create).mockResolvedValue(createdItem as never);

    const req = makeFormDataRequest("http://localhost/api/inventory", validFields);
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.id).toBe(99);
    expect(json.photoUrl).toBe("https://blob.vercel-storage.com/photo.jpg");
    expect(mockPut).toHaveBeenCalledOnce();
    expect(prisma.inventoryItem.create).toHaveBeenCalledOnce();
  });

  it("renvoie 400 si name est absent", async () => {
    const { name: _omit, ...noName } = validFields;
    const req = makeFormDataRequest("http://localhost/api/inventory", noName as never);
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("renvoie 400 si quantity est absent", async () => {
    const { quantity: _omit, ...noQty } = validFields;
    const req = makeFormDataRequest("http://localhost/api/inventory", noQty as never);
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockPut).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------

describe("DELETE /api/inventory/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("supprime l'item et renvoie 200", async () => {
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(createdItem as never);
    vi.mocked(prisma.inventoryItem.delete).mockResolvedValue(createdItem as never);

    const req = new Request("http://localhost/api/inventory/99", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "99" }) });

    expect(res.status).toBe(200);
    expect(prisma.inventoryItem.delete).toHaveBeenCalledWith({ where: { id: 99 } });
  });

  it("renvoie 404 si l'item n'existe pas", async () => {
    vi.mocked(prisma.inventoryItem.findUnique).mockResolvedValue(null);

    const req = new Request("http://localhost/api/inventory/999", { method: "DELETE" });
    const res = await DELETE(req, { params: Promise.resolve({ id: "999" }) });

    expect(res.status).toBe(404);
    expect(prisma.inventoryItem.delete).not.toHaveBeenCalled();
  });
});
