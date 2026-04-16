export interface SuggestionFull {
  id: number;
  roomId: number;
  needCategoryId: number;
  inventoryItemId: number | null;
  ikeaUrl: string | null;
  ikeaLabel: string | null;
  supplierName: string | null;
  suggestedBy: string;
  quantity: number;
  comment: string | null;
  createdAt: string;
  room: { id: number; name: string; dimensions: string };
  needCategory: { id: number; name: string; emoji: string };
  inventoryItem: { id: number; name: string; category: string; quantity: number; photoUrl: string | null; notes: string | null } | null;
}
