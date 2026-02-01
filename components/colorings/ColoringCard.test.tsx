import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/tests/utils/test-utils";
import { ColoringCard } from "./ColoringCard";
import type {
  ColoringDTO,
  LibraryColoringDTO,
  GalleryColoringListItem,
} from "@/app/types";

vi.mock("@/hooks/useInView", () => ({
  useInView: () => [{ current: null }, true],
}));

vi.mock("@/hooks/useColoringImage", () => ({
  useColoringImage: (_id: string | undefined, _enabled: boolean) => ({
    imageUrl: "https://example.com/coloring.png",
  }),
}));

const baseColoring: ColoringDTO = {
  id: "col-1",
  imageUrl: "https://example.com/img.png",
  prompt: "Kot grający na gitarze",
  tags: ["kot", "zwierzęta", "muzyka"],
  ageGroup: "4-8",
  style: "klasyczny",
  createdAt: "2025-01-15T10:00:00Z",
  favoritesCount: 0,
};

const galleryColoring: GalleryColoringListItem = {
  ...baseColoring,
  id: "gal-1",
  imageUrl: undefined,
  favoritesCount: 5,
};

const libraryColoring: LibraryColoringDTO = {
  ...baseColoring,
  id: "lib-1",
  imageUrl: "https://example.com/lib.png",
  addedAt: "2025-01-20T12:00:00Z",
  isLibraryFavorite: true,
  isGlobalFavorite: false,
};

describe("ColoringCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("render – common content", () => {
    it("renders prompt (short)", () => {
      render(
        <ColoringCard coloring={baseColoring} variant="gallery" />
      );
      expect(screen.getByText("Kot grający na gitarze")).toBeInTheDocument();
    });

    it("truncates prompt when longer than 60 characters", () => {
      const longPrompt =
        "Bardzo długa kolorowanka z wieloma słowami opisującymi scenę w lesie z zwierzętami i drzewami";
      render(
        <ColoringCard
          coloring={{ ...baseColoring, prompt: longPrompt }}
          variant="gallery"
        />
      );
      expect(
        screen.getByText(longPrompt.slice(0, 60) + "...")
      ).toBeInTheDocument();
      expect(screen.getByTitle(longPrompt)).toBeInTheDocument();
    });

    it("renders up to 3 tags and +N badge when more", () => {
      const manyTags = ["a", "b", "c", "d", "e"];
      render(
        <ColoringCard
          coloring={{ ...baseColoring, tags: manyTags }}
          variant="gallery"
        />
      );
      expect(screen.getByText("a")).toBeInTheDocument();
      expect(screen.getByText("b")).toBeInTheDocument();
      expect(screen.getByText("c")).toBeInTheDocument();
      expect(screen.getByText("+2")).toBeInTheDocument();
    });

    it("renders age group and style labels", () => {
      render(
        <ColoringCard coloring={baseColoring} variant="gallery" />
      );
      expect(screen.getByText("4-8 lat")).toBeInTheDocument();
      expect(screen.getByText("Klasyczny")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(
        <ColoringCard
          coloring={baseColoring}
          variant="gallery"
          className="custom-class"
        />
      );
      const article = container.querySelector("article.custom-class");
      expect(article).toBeInTheDocument();
    });

    it("has accessible aria-label with prompt", () => {
      render(
        <ColoringCard coloring={baseColoring} variant="gallery" />
      );
      expect(
        screen.getByRole("button", { name: /Kolorowanka: Kot grający na gitarze/i })
      ).toBeInTheDocument();
    });
  });

  describe("variant: generated", () => {
    it("has role checkbox and aria-checked", () => {
      render(
        <ColoringCard
          coloring={baseColoring}
          variant="generated"
          isSelected={false}
        />
      );
      const card = screen.getByRole("checkbox", {
        name: /Kolorowanka: Kot grający na gitarze/i,
      });
      expect(card).toHaveAttribute("aria-checked", "false");
    });

    it("shows checked state when isSelected is true", () => {
      render(
        <ColoringCard
          coloring={baseColoring}
          variant="generated"
          isSelected={true}
        />
      );
      const card = screen.getByRole("checkbox", {
        name: /Kolorowanka: Kot grający na gitarze/i,
      });
      expect(card).toHaveAttribute("aria-checked", "true");
    });

    it("calls onSelect with toggled value on click", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <ColoringCard
          coloring={baseColoring}
          variant="generated"
          isSelected={false}
          onSelect={onSelect}
        />
      );
      await user.click(
        screen.getByRole("checkbox", {
          name: /Kolorowanka: Kot grający na gitarze/i,
        })
      );
      expect(onSelect).toHaveBeenCalledWith(true);
    });

    it("calls onSelect(false) when already selected and clicked", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();
      render(
        <ColoringCard
          coloring={baseColoring}
          variant="generated"
          isSelected={true}
          onSelect={onSelect}
        />
      );
      await user.click(
        screen.getByRole("checkbox", {
          name: /Kolorowanka: Kot grający na gitarze/i,
        })
      );
      expect(onSelect).toHaveBeenCalledWith(false);
    });
  });

  describe("variant: gallery", () => {
    it("has role button", () => {
      render(
        <ColoringCard coloring={galleryColoring} variant="gallery" />
      );
      expect(
        screen.getByRole("button", { name: /Kolorowanka:/i })
      ).toBeInTheDocument();
    });

    it("shows favorites count when favoritesCount > 0", () => {
      render(
        <ColoringCard coloring={galleryColoring} variant="gallery" />
      );
      expect(
        screen.getByLabelText("5 polubień")
      ).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
    });

    it("does not show favorites badge when favoritesCount is 0", () => {
      render(
        <ColoringCard coloring={baseColoring} variant="gallery" />
      );
      expect(screen.queryByLabelText(/polubień/)).not.toBeInTheDocument();
    });

    it("calls onClick with coloring when card is clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <ColoringCard
          coloring={galleryColoring}
          variant="gallery"
          onClick={onClick}
        />
      );
      await user.click(
        screen.getByRole("button", { name: /Kolorowanka:/i })
      );
      expect(onClick).toHaveBeenCalledWith(galleryColoring);
    });
  });

  describe("variant: library", () => {
    it("shows library favorite badge when isLibraryFavorite is true", () => {
      render(
        <ColoringCard coloring={libraryColoring} variant="library" />
      );
      expect(
        screen.getByLabelText("Ulubione w bibliotece")
      ).toBeInTheDocument();
      expect(screen.getByText("Ulubione")).toBeInTheDocument();
    });

    it("shows added date in Polish format", () => {
      render(
        <ColoringCard coloring={libraryColoring} variant="library" />
      );
      expect(screen.getByText(/Dodano/)).toBeInTheDocument();
      expect(screen.getByText(/20 sty 2025/)).toBeInTheDocument();
    });

    it("calls onClick with coloring when card is clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <ColoringCard
          coloring={libraryColoring}
          variant="library"
          onClick={onClick}
        />
      );
      await user.click(
        screen.getByRole("button", { name: /Kolorowanka:/i })
      );
      expect(onClick).toHaveBeenCalledWith(libraryColoring);
    });
  });

  describe("keyboard", () => {
    it("triggers click on Enter key", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <ColoringCard
          coloring={baseColoring}
          variant="gallery"
          onClick={onClick}
        />
      );
      const card = screen.getByRole("button", { name: /Kolorowanka:/i });
      card.focus();
      await user.keyboard("{Enter}");
      expect(onClick).toHaveBeenCalledWith(baseColoring);
    });

    it("triggers click on Space key", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(
        <ColoringCard
          coloring={baseColoring}
          variant="gallery"
          onClick={onClick}
        />
      );
      const card = screen.getByRole("button", { name: /Kolorowanka:/i });
      card.focus();
      await user.keyboard(" ");
      expect(onClick).toHaveBeenCalledWith(baseColoring);
    });
  });

  describe("edge cases", () => {
    it("renders without tags when tags array is empty", () => {
      render(
        <ColoringCard
          coloring={{ ...baseColoring, tags: [] }}
          variant="gallery"
        />
      );
      expect(screen.getByText("Kot grający na gitarze")).toBeInTheDocument();
      expect(screen.queryByText("+0")).not.toBeInTheDocument();
    });

    it("gallery variant without onClick does not throw on click", async () => {
      const user = userEvent.setup();
      render(
        <ColoringCard coloring={galleryColoring} variant="gallery" />
      );
      await user.click(
        screen.getByRole("button", { name: /Kolorowanka:/i })
      );
      // No throw
    });
  });
});
