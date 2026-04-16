import React from "react";
import path from "path";
import {
  renderToBuffer,
  Document,
  Page,
  View,
  Text,
  Image as PdfImage,
  Link as PdfLink,
  StyleSheet,
} from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { detectConflicts } from "@/lib/detectConflicts";
import type { SuggestionFull } from "@/lib/types";

// ── Brand colors ──────────────────────────────────────────────────────────────
const BLUE       = "#2B5BA8";
const BORDEAUX   = "#8B2332";
const LIGHT_GRAY = "#C8C8C8";
const NEAR_BLACK = "#1A1A1A";

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  page:              { fontFamily: "Helvetica", fontSize: 11, padding: 40, color: NEAR_BLACK },
  header:            { flexDirection: "row", alignItems: "center", marginBottom: 20, borderBottom: "1pt solid " + LIGHT_GRAY, paddingBottom: 12 },
  logo:              { width: 80 },
  headerText:        { marginLeft: 16 },
  title:             { fontSize: 18, fontFamily: "Helvetica-Bold", color: BLUE, marginBottom: 4 },
  subtitle:          { fontSize: 10, color: "#666" },
  roomHeading:       { fontSize: 14, fontFamily: "Helvetica-Bold", color: BLUE, marginBottom: 8, paddingBottom: 4, borderBottom: "1pt solid " + LIGHT_GRAY },
  categoryBlock:     { marginBottom: 12, marginLeft: 8 },
  categoryRow:       { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  categoryHeading:   { fontSize: 11, fontFamily: "Helvetica-Bold" },
  conflictBadge:     { fontSize: 9, color: BORDEAUX, marginLeft: 6 },
  suggestionRow:     { flexDirection: "row", marginBottom: 4, marginLeft: 12 },
  suggestionBy:      { fontFamily: "Helvetica-Bold", width: 80 },
  suggestionArticle: { flex: 1 },
  conflictText:      { color: BORDEAUX },
  comment:           { fontSize: 9, color: "#888", marginTop: 1 },
  urlLink:           { fontSize: 9, color: BLUE, marginTop: 2 },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function articleLabel(sug: SuggestionFull): string {
  const supplier = sug.supplierName ?? "IKEA";
  if (sug.inventoryItem) return sug.inventoryItem.name;
  if (sug.ikeaLabel)     return supplier + " \u2014 " + sug.ikeaLabel;
  if (sug.ikeaUrl)       return supplier + " \u2014 " + sug.ikeaUrl;
  return "\u2014";
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-BE", { day: "numeric", month: "long", year: "numeric" });
}

const ce = React.createElement;

// ── Construction du document PDF ──────────────────────────────────────────────

function buildDocument(suggestions: SuggestionFull[], conflicts: Set<string>, logoPath: string) {
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
              articleLabel(sug) + " \u00d7" + sug.quantity
            ),
            // URL visible pour les suggestions fournisseurs
            sug.ikeaUrl
              ? ce(PdfLink, { src: sug.ikeaUrl, style: styles.urlLink }, "-> " + sug.ikeaUrl)
              : null,
            sug.comment ? ce(Text, { style: styles.comment }, "\u00ab " + sug.comment + " \u00bb") : null,
          ),
        )
      );

      return ce(View, { key: category.id, style: styles.categoryBlock },
        ce(View, { style: styles.categoryRow },
          ce(Text, { style: styles.categoryHeading }, category.name),
          hasConflict ? ce(Text, { style: styles.conflictBadge }, "CONFLIT") : null,
        ),
        ...suggestionRows,
      );
    });

    return ce(View, { key: room.id },
      ce(Text, { style: styles.roomHeading }, room.name),
      ...categorySections,
    );
  });

  // En-tête avec logo ABC
  const header = ce(View, { style: styles.header },
    ce(PdfImage, { src: logoPath, style: styles.logo }),
    ce(View, { style: styles.headerText },
      ce(Text, { style: styles.title }, "Globe 72 \u2014 Besoins mobilier"),
      ce(Text, { style: styles.subtitle }, "Rapport g\u00e9n\u00e9r\u00e9 le " + formatDate(new Date())),
    ),
  );

  return ce(Document, null,
    ce(Page, { size: "A4", style: styles.page },
      header,
      ...roomSections,
    ),
  );
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET() {
  const logoPath = path.join(process.cwd(), "public", "Logo ABC.png");

  const suggestions = (await prisma.suggestion.findMany({
    include: { room: true, needCategory: true, inventoryItem: true },
    orderBy: { createdAt: "asc" },
  })) as unknown as SuggestionFull[];

  const conflicts = detectConflicts(suggestions);
  const doc = buildDocument(suggestions, conflicts, logoPath);
  const buffer = await renderToBuffer(doc);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="rapport_globe72.pdf"',
    },
  });
}
