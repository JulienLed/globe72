// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SuggestClient } from "@/app/suggest/SuggestClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const defaultProps = {
  rooms: [],
  categories: [],
  inventoryItems: [],
  stockTaken: {},
};

// GET on mount returns null (no prior idea); POST/PATCH returns an idea with given id
function mockFetchNoExisting(postId = 1) {
  vi.stubGlobal("fetch", vi.fn().mockImplementation((_url: string, opts?: RequestInit) => {
    const isWrite = opts?.method === "POST" || opts?.method === "PATCH";
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(isWrite ? { id: postId, text: "Mon idée", suggestedBy: "Amy" } : null),
    });
  }));
}

// GET on mount returns an existing idea
function mockFetchExistingIdea(idea = { id: 7, text: "Afficher le logo en vitrine", suggestedBy: "Amy" }) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(idea),
  }));
}

beforeEach(() => {
  localStorage.setItem("username", "Amy");
  vi.restoreAllMocks();
  // Default: no existing idea (GET returns null)
  mockFetchNoExisting();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Vue pré-stepper ───────────────────────────────────────────────────────────

describe("SuggestClient — vue pré-stepper", () => {
  it("affiche les deux cards avant de démarrer le stepper", () => {
    render(<SuggestClient {...defaultProps} />);
    expect(screen.getByText("Nouvelle suggestion")).toBeInTheDocument();
    expect(screen.getByText("Signalétique")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /commencer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enregistrer/i })).toBeInTheDocument();
  });

  it("n'affiche pas le stepper avant de cliquer sur Commencer", () => {
    render(<SuggestClient {...defaultProps} />);
    expect(screen.getByText(/comment rendre ce lieu/i)).toBeInTheDocument();
  });

  it("affiche le stepper et masque les cards après clic sur Commencer", async () => {
    const user = userEvent.setup();
    render(<SuggestClient {...defaultProps} />);
    await user.click(screen.getByRole("button", { name: /commencer/i }));
    expect(screen.queryByText("Signalétique")).not.toBeInTheDocument();
  });

  it("la card Signalétique est grisée après soumission réussie", async () => {
    const user = userEvent.setup();
    render(<SuggestClient {...defaultProps} />);
    await user.type(screen.getByRole("textbox"), "Mon idée signalétique");
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));

    await waitFor(() => expect(screen.getByRole("textbox")).toBeDisabled());
    expect(screen.queryByRole("button", { name: /enregistrer/i })).not.toBeInTheDocument();
  });
});

// ── Flow modification ─────────────────────────────────────────────────────────

describe("SuggestClient — flow modification", () => {
  async function submitSignage(user: ReturnType<typeof userEvent.setup>) {
    mockFetchNoExisting(42);
    render(<SuggestClient {...defaultProps} />);
    await user.type(screen.getByRole("textbox"), "Mon idée initiale");
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));
    await waitFor(() => expect(screen.getByRole("button", { name: /modifier/i })).toBeInTheDocument());
  }

  it("affiche le bouton Modifier après soumission", async () => {
    const user = userEvent.setup();
    await submitSignage(user);
    expect(screen.getByRole("button", { name: /modifier/i })).toBeInTheDocument();
  });

  it("re-active la textarea après clic sur Modifier", async () => {
    const user = userEvent.setup();
    await submitSignage(user);
    await user.click(screen.getByRole("button", { name: /modifier/i }));
    expect(screen.getByRole("textbox")).not.toBeDisabled();
  });

  it("la card se grise à nouveau après re-soumission", async () => {
    const user = userEvent.setup();
    await submitSignage(user);
    await user.click(screen.getByRole("button", { name: /modifier/i }));
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));
    await waitFor(() => expect(screen.getByRole("textbox")).toBeDisabled());
    expect(screen.getByRole("button", { name: /modifier/i })).toBeInTheDocument();
  });
});

// ── Restauration depuis l'API au montage ──────────────────────────────────────

describe("SuggestClient — restauration depuis l'API", () => {
  it("affiche l'état sauvegardé au montage si une idée existe", async () => {
    mockFetchExistingIdea();
    render(<SuggestClient {...defaultProps} />);

    await waitFor(() => expect(screen.getByRole("button", { name: /modifier/i })).toBeInTheDocument());
    expect(screen.getByRole("textbox")).toHaveValue("Afficher le logo en vitrine");
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});
