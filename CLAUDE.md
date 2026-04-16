# Globe 72 — Outil de collecte de besoins mobilier

## Contexte

Application interne pour ABC (Alliance Bruxelloise Coopérative).
5 utilisateurs (Amy, Simon, Rebecca, Nathalie, Stud) doivent exprimer
leurs besoins en mobilier pour 2 pièces d'un nouveau bureau (Globe 72).
Pas d'auth — chaque user choisit son prénom au lancement (localStorage).
Déployé sur Vercel, DB sur Neon (PostgreSQL).

## Stack (versions avril 2026)

- **Next.js 16.2** (App Router, Turbopack activé par défaut)
- **TypeScript 5.x**
- **Prisma ORM 7.x** + Neon (PostgreSQL)
  - ⚠️ Prisma 7 est ESM-only (plus de CommonJS require)
  - ⚠️ Utilise `prisma.config.ts` à la racine (plus de config dans schema.prisma)
  - ⚠️ Le client est entièrement TypeScript, plus de binaire Rust
- **shadcn/ui** (CLI v4) + **Tailwind v4**
  - ⚠️ Tailwind v4 : plus de `tailwind.config.js`, config via CSS uniquement
  - Initialiser avec : `npx shadcn@latest init`
- **@react-pdf/renderer** (export PDF)
- **Vitest 4.x** + **React Testing Library** (TDD)

## Approche de développement

TDD strict : écrire les tests avant le code.
Commenter les choix techniques non évidents.
Ordre de développement :

1. Prisma schema + `prisma.config.ts` + migrate + seed
2. Tests API (Vitest) → routes CRUD suggestions
3. Implémentation API routes
4. Tests composants (RTL) → SuggestionForm stepper
5. Implémentation composants
6. Page /recap + export PDF
7. Vérification Vercel deploy (env vars Neon)

---

## Schéma Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Room {
  id          Int           @id @default(autoincrement())
  name        String
  dimensions  String
  suggestions Suggestion[]
}

model NeedCategory {
  id          Int           @id @default(autoincrement())
  name        String
  emoji       String
  suggestions Suggestion[]
}

model InventoryItem {
  id          Int          @id @default(autoincrement())
  name        String
  category    String
  quantity    Int
  photoUrl    String?
  notes       String?
  suggestions Suggestion[]
}

model Suggestion {
  id              Int            @id @default(autoincrement())
  room            Room           @relation(fields: [roomId], references: [id])
  roomId          Int
  needCategory    NeedCategory   @relation(fields: [needCategoryId], references: [id])
  needCategoryId  Int
  inventoryItem   InventoryItem? @relation(fields: [inventoryItemId], references: [id])
  inventoryItemId Int?
  ikeaUrl         String?
  ikeaLabel       String?
  suggestedBy     String
  quantity        Int            @default(1)
  comment         String?
  createdAt       DateTime       @default(now())
}
```

### prisma.config.ts (Prisma 7)

```ts
// prisma.config.ts — à la racine du projet
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

---

## Seed data

### Rooms
- "Bureau locatif" — 4.5m x 3.5m
- "Salle d'attente" — 4.5m x 3m

### NeedCategories
- 🖥️ Mobilier de travail
- 🛋️ Assise & accueil
- 🗄️ Rangement
- 🌿 Décoration
- 📋 Communication
- 📦 Autre

### InventoryItems
Les photos sont dans `/public/inventory/{slug}.jpg` (snake_case).

| Nom | Catégorie | Quantité | Photo | Notes |
|-----|-----------|----------|-------|-------|
| Grand bureau (3 parties) | Mobilier de bureau | 1 | grand_bureau_3_parties.jpg | |
| Petits bureaux | Mobilier de bureau | 2 | petits_bureaux.jpg | |
| Bureaux individuels | Mobilier de bureau | 3 | bureaux_individuels.jpg | |
| Fauteuils de bureau | Mobilier de bureau | 3 | fauteuils_de_bureau.jpg | |
| Grande table de réunion | Mobilier de bureau | 1 | grande_table_reunion.jpg | |
| Chaises rouges | Mobilier de bureau | 12 | chaises_rouges.jpg | |
| Chaises normales | Mobilier de bureau | 3 | — | |
| Porte-manteaux | Mobilier de bureau | 2 | — | |
| Armoires hautes en métal | Rangement & stockage | 9 | armoires_hautes_metal.jpg | Une partie prise par le service locatif |
| Armoire haute en bois | Rangement & stockage | 1 | armoire_haute_bois.jpg | |
| Armoires basses | Rangement & stockage | 3 | armoires_basses.jpg | |
| Petits meubles à tiroirs en bois | Rangement & stockage | 2 | petits_meubles_tiroirs_bois.jpg | |
| Petits meubles à tiroirs en métal | Rangement & stockage | 2 | petits_meubles_tiroirs_metal.jpg | |
| Étagères simples en métal (cave) | Rangement & stockage | 18 | etageres_metal_cave.jpg | |
| Airco portatifs | Électroménager | 2 | airco_portatifs.jpg | |
| Ventilateurs | Électroménager | 3 | ventilateurs.jpg | |
| Micro-ondes | Électroménager | 2 | micro_ondes.jpg | |
| Frigos | Électroménager | 2 | frigos.jpg | |
| Britas | Électroménager | 2 | britas.jpg | |
| Four à pain | Électroménager | 1 | four_a_pain.jpg | |
| Senseos | Électroménager | 2 | senseos.jpg | |
| Bouilloire | Électroménager | 1 | bouilloire.jpg | |
| Verres à bière | Vaisselle | 10 | verres_biere.jpg | |
| Verres à vin | Vaisselle | 7 | verres_vin.jpg | |
| Imprimante | Matériel de bureau | 1 | imprimante.jpg | |
| Plieuse | Matériel de bureau | 1 | plieuse.jpg | |
| Plastifieuse | Matériel de bureau | 1 | plastifieuse.jpg | |
| Trancheuse | Matériel de bureau | 2 | trancheuse.jpg | |
| Lampes | Matériel de bureau | 3 | lampes.jpg | |
| Borne Appinest | Informatique | 1 | borne_appinest.jpg | |
| Masques FFP2 | Santé & hygiène | 12 | masques_ffp2.jpg | |
| Gel hydroalcoolique | Santé & hygiène | 10 | gel_hydroalcoolique.jpg | |

---

## UX — Stepper 3 étapes

### Étape 1 — Pièce & catégorie
- Sélection de la pièce (Bureau locatif / Salle d'attente)
- Sélection de la catégorie de besoin (liste fixe, pas d'ajout)

### Étape 2 — Article
- Affichage en priorité des items de l'inventaire existant qui correspondent à la catégorie (cards avec photo, nom, quantité disponible)
- Option "Pas dans l'inventaire → IKEA" : champ URL + label manuel
- Champ quantité (integer, min 1, défaut 1)

### Étape 3 — Commentaire & validation
- Champ commentaire optionnel (textarea)
- Résumé de la suggestion (pièce, catégorie, article, quantité)
- Bouton "Valider"

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Sélection du prénom parmi [Amy, Simon, Rebecca, Nathalie, Stud] → stocké en localStorage → redirect `/suggest` |
| `/suggest` | Stepper 3 étapes |
| `/recap` | Vue n+1 — par pièce, par catégorie, toutes suggestions. Badge ⚠️ conflit si même catégorie + articles différents. Bouton export PDF. |

---

## API Routes

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/suggestions` | Créer une suggestion |
| GET | `/api/suggestions` | Lister (query params: `roomId`, `categoryId`) |
| DELETE | `/api/suggestions/[id]` | Supprimer une suggestion |
| GET | `/api/export` | Générer et renvoyer le rapport PDF |

---

## Rapport PDF (/api/export)

Généré avec `@react-pdf/renderer`.
Structure : titre + date, puis pour chaque pièce → pour chaque catégorie → liste des suggestions (qui, quoi, quantité, commentaire). Conflits mis en évidence (même catégorie, articles différents proposés par des personnes différentes).

---

## Variables d'environnement

```
DATABASE_URL=        # Neon connection string (format : postgresql://...)
```

---

## Notes techniques

- Pas d'authentification. Le prénom est stocké en localStorage côté client.
- Pas de WebSocket — polling simple (interval 30s) sur `/api/suggestions` pour afficher les suggestions des autres en temps réel sur `/recap`.
- Les photos de l'inventaire sont des assets statiques dans `/public/inventory/`. Elles ne sont pas uploadées dynamiquement.
- Déploiement Vercel : ajouter `DATABASE_URL` dans les env vars du projet Vercel.
- Prisma 7 étant ESM-only, s'assurer que les imports utilisent la syntaxe ESM dans tout le projet.
