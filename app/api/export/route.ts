import React from "react";
import { renderToBuffer, Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { detectConflicts } from "@/lib/detectConflicts";
import type { SuggestionFull } from "@/lib/types";

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page:              { fontFamily: "Helvetica", fontSize: 11, padding: 40, color: "#1a1a1a" },
  title:             { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle:          { fontSize: 10, color: "#666", marginBottom: 24 },
  roomHeading:       { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 8, paddingBottom: 4, borderBottom: "1pt solid #ccc" },
  categoryBlock:     { marginBottom: 12, marginLeft: 8 },
  categoryRow:       { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  categoryHeading:   { fontSize: 11, fontFamily: "Helvetica-Bold" },
  conflictBadge:     { fontSize: 9, color: "#b45309", marginLeft: 6 },
  suggestionRow:     { flexDirection: "row", marginBottom: 3, marginLeft: 12 },
  suggestionBy:      { fontFamily: "Helvetica-Bold", width: 80 },
  suggestionArticle: { flex: 1 },
  conflictText:      { color: "#b45309" },
  comment:           { fontSize: 9, color: "#888" },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function articleLabel(sug: SuggestionFull): string {
  if (sug.inventoryItem) return sug.inventoryItem.name;
  if (sug.ikeaLabel)     return `IKEA — ${sug.ikeaLabel}`;
  if (sug.ikeaUrl)       return `IKEA — ${sug.ikeaUrl}`;
  return "—";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" });
}

const ce = React.createElement;

// ── Construction du document PDF ──────────────────────────────────────────────

function buildDocument(suggestions: SuggestionFull[], conflicts: Set<string>) {
  // Regroupement room → catégorie
  const rooms = new Map<
    number,
    { room: SuggestionFull["room"]; categories: Map<number, { category: SuggestionFull["needCategory"]; suggestions: SuggestionFull[] }> }
  >();

  for (const sug of suggestions) {
    if (!rooms.has(sug.roomId))
      rooms.set(sug.roomId, { room: sug.room, categories: new Map() });
    const roomEntry = rooms.get(sug.roomId)!;
    if (!roomEntry.categories.has(sug.needCategoryId))
      roomEntry.categories.set(sug.needCategoryId, { category: sug.needCategory, suggestions: [] });
    roomEntry.categories.get(sug.needCategoryId)!.suggestions.push(sug);
  }

  const roomSections = [...rooms.values()].map(({ room, categories }) => {
    const categorySections = [...categories.values()].map(({ category, suggestions: catSugs }) => {
      const conflictKey = `${room.id}-${category.id}`;
      const hasConflict = conflicts.has(conflictKey);

      const suggestionRows = catSugs.map((sug) =>
        ce(View, { key: sug.id, style: styles.suggestionRow },
          ce(Text, { style: styles.suggestionBy }, sug.suggestedBy),
          ce(View, { style: styles.suggestionArticle },
            ce(Text, { style: hasConflict ? styles.conflictText : undefined },
              `${articleLabel(sug)} ×${sug.quantity}`
            ),
            sug.comment ? ce(Text, { style: styles.comment }, `« ${sug.comment} »`) : null,
          ),
        )
      );

      return ce(View, { key: category.id, style: styles.categoryBlock },
        ce(View, { style: styles.categoryRow },
          ce(Text, { style: styles.categoryHeading }, `${category.emoji} ${category.name}`),
          hasConflict ? ce(Text, { style: styles.conflictBadge }, "⚠ CONFLIT") : null,
        ),
        ...suggestionRows,
      );
    });

    return ce(View, { key: room.id },
      ce(Text, { style: styles.roomHeading }, room.name),
      ...categorySections,
    );
  });

  return ce(Document, null,
    ce(Page, { size: "A4", style: styles.page },
      ce(Text, { style: styles.title }, "Globe 72 — Besoins mobilier"),
      ce(Text, { style: styles.subtitle }, `Rapport généré le ${formatDate(new Date())}`),
      ...roomSections,
    ),
  );
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET() {
  const suggestions = (await prisma.suggestion.findMany({
    include: { room: true, needCategory: true, inventoryItem: true },
    orderBy: { createdAt: "asc" },
  })) as unknown as SuggestionFull[];

  const conflicts = detectConflicts(suggestions);
  const doc = buildDocument(suggestions, conflicts);
  const buffer = await renderToBuffer(doc);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="rapport_globe72.pdf"',
    },
  });
}
