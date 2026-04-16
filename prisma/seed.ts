// prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Rooms ---
  const rooms = await Promise.all([
    prisma.room.upsert({
      where: { id: 1 },
      update: {},
      create: { name: "Bureau locatif", dimensions: "4.5m x 3.5m" },
    }),
    prisma.room.upsert({
      where: { id: 2 },
      update: {},
      create: { name: "Salle d'attente", dimensions: "4.5m x 3m" },
    }),
  ]);
  console.log(`Seeded ${rooms.length} rooms`);

  // --- NeedCategories ---
  const categories = await Promise.all([
    prisma.needCategory.upsert({
      where: { id: 1 },
      update: {},
      create: { name: "Mobilier de travail", emoji: "🖥️" },
    }),
    prisma.needCategory.upsert({
      where: { id: 2 },
      update: {},
      create: { name: "Assise & accueil", emoji: "🛋️" },
    }),
    prisma.needCategory.upsert({
      where: { id: 3 },
      update: {},
      create: { name: "Rangement", emoji: "🗄️" },
    }),
    prisma.needCategory.upsert({
      where: { id: 4 },
      update: {},
      create: { name: "Décoration", emoji: "🌿" },
    }),
    prisma.needCategory.upsert({
      where: { id: 5 },
      update: {},
      create: { name: "Communication", emoji: "📋" },
    }),
    prisma.needCategory.upsert({
      where: { id: 6 },
      update: {},
      create: { name: "Autre", emoji: "📦" },
    }),
  ]);
  console.log(`Seeded ${categories.length} need categories`);

  // --- InventoryItems ---
  const items: {
    name: string;
    category: string;
    quantity: number;
    photoUrl: string | null;
    notes: string | null;
  }[] = [
    // Mobilier de bureau
    {
      name: "Grand bureau (3 parties)",
      category: "Mobilier de bureau",
      quantity: 1,
      photoUrl: "/inventory/grand_bureau_3_parties.jpg",
      notes: null,
    },
    {
      name: "Petits bureaux",
      category: "Mobilier de bureau",
      quantity: 2,
      photoUrl: "/inventory/petits_bureaux.jpg",
      notes: null,
    },
    {
      name: "Bureaux individuels",
      category: "Mobilier de bureau",
      quantity: 3,
      photoUrl: "/inventory/bureaux_individuels.jpg",
      notes: null,
    },
    {
      name: "Fauteuils de bureau",
      category: "Mobilier de bureau",
      quantity: 3,
      photoUrl: "/inventory/fauteuils_de_bureau.jpg",
      notes: null,
    },
    {
      name: "Grande table de réunion",
      category: "Mobilier de bureau",
      quantity: 1,
      photoUrl: "/inventory/grande_table_reunion.jpg",
      notes: null,
    },
    {
      name: "Chaises rouges",
      category: "Mobilier de bureau",
      quantity: 12,
      photoUrl: "/inventory/chaises_rouges.jpg",
      notes: null,
    },
    {
      name: "Chaises normales",
      category: "Mobilier de bureau",
      quantity: 3,
      photoUrl: null,
      notes: null,
    },
    {
      name: "Porte-manteaux",
      category: "Mobilier de bureau",
      quantity: 2,
      photoUrl: null,
      notes: null,
    },
    // Rangement & stockage
    {
      name: "Armoires hautes en métal",
      category: "Rangement & stockage",
      quantity: 9,
      photoUrl: "/inventory/armoires_hautes_metal.jpg",
      notes: "Une partie prise par le service locatif",
    },
    {
      name: "Armoire haute en bois",
      category: "Rangement & stockage",
      quantity: 1,
      photoUrl: "/inventory/armoire_haute_bois.jpg",
      notes: null,
    },
    {
      name: "Armoires basses",
      category: "Rangement & stockage",
      quantity: 3,
      photoUrl: "/inventory/armoires_basses.jpg",
      notes: null,
    },
    {
      name: "Petits meubles à tiroirs en bois",
      category: "Rangement & stockage",
      quantity: 2,
      photoUrl: "/inventory/petits_meubles_tiroirs_bois.jpg",
      notes: null,
    },
    {
      name: "Petits meubles à tiroirs en métal",
      category: "Rangement & stockage",
      quantity: 2,
      photoUrl: "/inventory/petits_meubles_tiroirs_metal.jpg",
      notes: null,
    },
    {
      name: "Étagères simples en métal (cave)",
      category: "Rangement & stockage",
      quantity: 18,
      photoUrl: "/inventory/etageres_metal_cave.jpg",
      notes: null,
    },
    // Électroménager
    {
      name: "Airco portatifs",
      category: "Électroménager",
      quantity: 2,
      photoUrl: "/inventory/airco_portatifs.jpg",
      notes: null,
    },
    {
      name: "Ventilateurs",
      category: "Électroménager",
      quantity: 3,
      photoUrl: "/inventory/ventilateurs.jpg",
      notes: null,
    },
    {
      name: "Micro-ondes",
      category: "Électroménager",
      quantity: 2,
      photoUrl: "/inventory/micro_ondes.jpg",
      notes: null,
    },
    {
      name: "Frigos",
      category: "Électroménager",
      quantity: 2,
      photoUrl: "/inventory/frigos.jpg",
      notes: null,
    },
    {
      name: "Britas",
      category: "Électroménager",
      quantity: 2,
      photoUrl: "/inventory/britas.jpg",
      notes: null,
    },
    {
      name: "Four à pain",
      category: "Électroménager",
      quantity: 1,
      photoUrl: "/inventory/four_a_pain.jpg",
      notes: null,
    },
    {
      name: "Senseos",
      category: "Électroménager",
      quantity: 2,
      photoUrl: "/inventory/senseos.jpg",
      notes: null,
    },
    {
      name: "Bouilloire",
      category: "Électroménager",
      quantity: 1,
      photoUrl: "/inventory/bouilloire.jpg",
      notes: null,
    },
    // Vaisselle
    {
      name: "Verres à bière",
      category: "Vaisselle",
      quantity: 10,
      photoUrl: "/inventory/verres_biere.jpg",
      notes: null,
    },
    {
      name: "Verres à vin",
      category: "Vaisselle",
      quantity: 7,
      photoUrl: "/inventory/verres_vin.jpg",
      notes: null,
    },
    // Matériel de bureau
    {
      name: "Imprimante",
      category: "Matériel de bureau",
      quantity: 1,
      photoUrl: "/inventory/imprimante.jpg",
      notes: null,
    },
    {
      name: "Plieuse",
      category: "Matériel de bureau",
      quantity: 1,
      photoUrl: "/inventory/plieuse.jpg",
      notes: null,
    },
    {
      name: "Plastifieuse",
      category: "Matériel de bureau",
      quantity: 1,
      photoUrl: "/inventory/plastifieuse.jpg",
      notes: null,
    },
    {
      name: "Trancheuse",
      category: "Matériel de bureau",
      quantity: 2,
      photoUrl: "/inventory/trancheuse.jpg",
      notes: null,
    },
    {
      name: "Lampes",
      category: "Matériel de bureau",
      quantity: 3,
      photoUrl: "/inventory/lampes.jpg",
      notes: null,
    },
    // Informatique
    {
      name: "Borne Appinest",
      category: "Informatique",
      quantity: 1,
      photoUrl: "/inventory/borne_appinest.jpg",
      notes: null,
    },
    // Santé & hygiène
    {
      name: "Masques FFP2",
      category: "Santé & hygiène",
      quantity: 12,
      photoUrl: "/inventory/masques_ffp2.jpg",
      notes: null,
    },
    {
      name: "Gel hydroalcoolique",
      category: "Santé & hygiène",
      quantity: 10,
      photoUrl: "/inventory/gel_hydroalcoolique.jpg",
      notes: null,
    },
  ];

  // deleteMany + createMany pour un seed idempotent propre
  await prisma.suggestion.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.inventoryItem.createMany({ data: items });
  console.log(`Seeded ${items.length} inventory items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
