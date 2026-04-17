import { describe, it, expect } from "vitest";
import { buildSuggestedByMap } from "@/lib/buildSuggestedByMap";

describe("buildSuggestedByMap", () => {
  it("builds a map of inventoryItemId → unique usernames", () => {
    const suggestions = [
      { inventoryItemId: 10, suggestedBy: "Amy" },
      { inventoryItemId: 10, suggestedBy: "Simon" },
      { inventoryItemId: 11, suggestedBy: "Rebecca" },
      { inventoryItemId: 10, suggestedBy: "Amy" }, // duplicate — should appear once
      { inventoryItemId: null, suggestedBy: "Nathalie" }, // IKEA item — ignored
    ];

    const result = buildSuggestedByMap(suggestions);

    expect(result[10]).toEqual(["Amy", "Simon"]);
    expect(result[11]).toEqual(["Rebecca"]);
    expect(result[99]).toBeUndefined();
  });
});
