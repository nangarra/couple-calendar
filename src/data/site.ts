export const site = {
  name: "Couples Calendar",
  copyright: "© Nangarra Games / Aurora - 2022",
  legal:
    "All material is copyrighted and meant only for private use for the ones that bought the calendar. None of the materials may be reproduced for commercial interest.",
};

export const menu = [
  { label: "Home", href: "/" },
  { label: "About Aurora", href: "/about" },
  { label: "Share your experience", href: "/feedback" },
];

// Hatches whose QR code offers a choice between two days.
export const choices = [{ slug: "day-2-or-9", days: [2, 9] }];

export const daySlug = (d: { day: number; slug?: string }) => d.slug ?? `day-${d.day}`;
