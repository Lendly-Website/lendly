import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import type { Item } from "@lendly/shared";
import { ItemCard } from "./ItemCard";

const item: Item = {
  id: "item-1",
  ownerId: "owner-1",
  owner: {
    id: "owner-1",
    name: "Ananya Deshpande",
    verificationStatus: "verified",
    averageRating: 4.8,
    reviewCount: 2,
  },
  itemName: "HD Portable Projector",
  category: "Projectors & Event Gear",
  description: "A compact projector for presentations and screenings.",
  images: ["https://example.com/projector.jpg"],
  condition: "like-new",
  totalQuantity: 2,
  availableQuantity: 2,
  location: {
    address: "MIT-ADT Campus",
    locality: "MIT-ADT",
    city: "Pune",
    latitude: 18.489,
    longitude: 73.833,
  },
  rentalPrice: 180,
  borrowingTerms: "Return with the HDMI cable.",
  availability: [
    { startDate: "2026-01-01T00:00:00.000Z", endDate: "2026-03-01T00:00:00.000Z" },
  ],
  listingStatus: "active",
  distanceMeters: 800,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("ItemCard", () => {
  it("shows item price, distance, and owner rating", () => {
    render(
      <MemoryRouter>
        <ItemCard item={item} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: /hd portable projector/i })).toBeInTheDocument();
    expect(screen.getByText("₹180/day")).toBeInTheDocument();
    expect(screen.getByText("800 m")).toBeInTheDocument();
    expect(screen.getByText(/4\.8/)).toBeInTheDocument();
  });
});
