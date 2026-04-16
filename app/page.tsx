"use client";

import { useRouter } from "next/navigation";

const USERS = ["Amy", "Simon", "Rebecca", "Nathalie", "Julien"];

export default function HomePage() {
  const router = useRouter();

  function handleSelect(username: string) {
    localStorage.setItem("username", username);
    router.push("/suggest");
  }

  return (
    <main className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center gap-8 p-8">
      <div className="glass w-full max-w-md px-8 py-8 flex flex-col items-center gap-8">
        {/* Onboarding */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Globe 72 — Besoins mobilier</h1>
          <p className="mt-3 text-sm text-gray-600">
            ABC déménage au Globe 72. Chaque membre de l&apos;équipe peut exprimer
            ses besoins en mobilier pour le bureau locatif et la salle d&apos;attente.
            Sélectionne ton prénom pour commencer.
          </p>
        </div>

        {/* Sélection utilisateur */}
        <p className="text-gray-500">Qui es-tu ?</p>
        <div className="flex flex-wrap justify-center gap-4">
          {USERS.map((name) => (
            <button
              key={name}
              onClick={() => handleSelect(name)}
              className="rounded-xl border-2 border-[#C8C8C8] px-8 py-4 text-lg font-medium transition-colors hover:border-[#2B5BA8] hover:bg-[#EEF4FC] hover:text-[#2B5BA8]"
            >
              {name}
            </button>
          ))}
        </div>

        {/* Section responsable */}
        <div className="w-full border-t border-[#C8C8C8] pt-6 text-center">
          <p className="mb-3 text-sm font-medium text-[#8B2332]">
            Directeur.trice ? Téléchargez le récapitulatif
          </p>
          <a
            href="/api/export"
            download="rapport_globe72.pdf"
            className="inline-block rounded-xl border-2 border-[#8B2332] px-6 py-2.5 text-sm font-semibold text-[#8B2332] transition-colors hover:bg-[#8B2332] hover:text-white"
          >
            Télécharger le rapport PDF
          </a>
        </div>
      </div>
    </main>
  );
}
