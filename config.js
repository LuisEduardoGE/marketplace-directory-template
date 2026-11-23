/*
 * Marketplace configuration — the only file you need to edit to brand this template.
 *
 * Everything shown on the page (name, logo, floors, colours, contact, button text,
 * every UI label) comes from here; the shop list comes from the CSV in `dataUrl`.
 * See README.md for the CSV columns.
 */
window.MARKETPLACE_CONFIG = {
  name: "Sample Food Market",
  logo: "assets/logo.svg",          // header logo (SVG/PNG); use your own artwork
  lang: "en",                       // <html lang>
  dataUrl: "data/shops.csv",

  // Floor buttons, top to bottom, and the one selected on first load.
  floors: ["2", "1", "0"],
  defaultFloor: "0",

  theme: {
    header: "#0B0B0B",              // header + active floor button
    accent: "#E07D65",              // price badge
    button: "#007b99",              // primary buttons
    buttonHover: "#005f77",
  },

  // Optional call-to-action on each shop's detail view. A shop's own
  // `external_url` (CSV) wins; set `fallbackUrl: ""` to hide the button for
  // shops without one, or set `orderButton: null` to remove it entirely.
  orderButton: { label: "Visit shop", fallbackUrl: "" },

  contact: { email: "support@example.com", phone: "+00 000 000 000" },

  // UI text. Translate freely — a Portuguese set is in README.md.
  labels: {
    search: "Search",
    searchTitle: "Search shops",
    searchPlaceholder: "Search by name or category…",
    noResults: "No results found.",
    filters: "Filters",
    filterTitle: "Filter shops",
    floors: "Floors",
    floor: "Floor",
    status: "Status",
    all: "All",
    open: "Open",
    closed: "Closed",
    price: "Price",
    categories: "Categories",
    apply: "Apply",
    reset: "Reset",
    previous: "Previous",
    next: "Next",
    page: "Page",
    of: "of",
    hours: "Opening hours",
    contactTitle: "Contact",
    contactText: "Need help? Reach us at",
    settingsTitle: "Settings",
    settingsText: "Nothing to configure yet.",
    days: {
      Monday: "Monday", Tuesday: "Tuesday", Wednesday: "Wednesday", Thursday: "Thursday",
      Friday: "Friday", Saturday: "Saturday", Sunday: "Sunday",
    },
  },
};
