import { useMemo, useState, useEffect } from "react";

import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";

type MainSection = "exterior" | "interior";
type SubSection = "walls" | "wood" | "rails" | "tiles" | "repairs";

type Line = {
  id: string;
  main: MainSection;
  sub: SubSection;
  key: string;        // stable id
  label: string;      // shown in prices table
  sentence: string;   // shown in narrative
  qty: number;
  unit: string;
  unitPrice: number;
}
type OfferStatus = "pending" | "accepted" | "rejected";

type Offer = {
  id: string;
  customer: string;
  project: string;
  note: string;
  createdAt: string; // ISO string
  status: OfferStatus;
  total: number;
  lines: Line[];
};

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────
const SECTION_TITLES: Record<MainSection, string> = {
  exterior: "Εξωτερικά",
  interior: "Εσωτερικά",
};

const SUB_TITLES: Record<SubSection, string> = {
  walls: "Τοίχοι",
  wood: "Ξύλα",
  rails: "Κάγκελα",
  tiles: "Κεραμίδια",
  repairs: "Μερεμέτια",
};

function uuid() {
  return Math.random().toString(36).slice(2);
}
const OFFERS_KEY = "palettepad_offers_v1";

function loadOffers(): Offer[] {
  try {
    const raw = localStorage.getItem(OFFERS_KEY);
    return raw ? (JSON.parse(raw) as Offer[]) : [];
  } catch {
    return [];
  }
}
function persistOffers(data: Offer[]) {
  localStorage.setItem(OFFERS_KEY, JSON.stringify(data));
}

// Normalize Greek: lowercase + strip accents so "αστάρι" == "ασταρι"
function normalizeGreek(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    // remove diacritics
    .replace(/[\u0300-\u036f]/g, "")
    // collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

// Split keywords by comma or whitespace
function splitKeywords(blob: string): string[] {
  return blob
    .split(/[\s,]+/g)
    .map((t) => normalizeGreek(t))
    .filter(Boolean);
}

// ──────────────────────────────────────────────────────────────────────────────
// Catalog (sentences + pricing) for each (main, sub, job)
// Jobs supported: sanding=τρίψιμο, clean=καθαρισμα, primer=αστάρι, paint2/paint3=χρώμα 2/3, varnish=βερνίκι, repairs=μερεμέτια
// ──────────────────────────────────────────────────────────────────────────────
type JobKey =
  | "sanding"
  | "clean"
  | "primer"
  | "paint2"
  | "paint3"
  | "varnish"
  | "repairs"
  | "spackle"; // σπατουλάρισμα


type CatalogItem = {
  main: MainSection;
  sub: SubSection;
  job: JobKey;
  unit: string;
  defaultPrice: number;
  label: string;    // for price table
  sentence: string; // narrative
};

const CATALOG: CatalogItem[] = [
  // EXTERIOR — Τοίχοι
  {
    main: "exterior", sub: "walls", job: "sanding",
    unit: "m²", defaultPrice: 5,
    label: "Τοίχοι — Τρίψιμο (εξωτερικά)",
    sentence: "Τρίψιμο για προετοιμασία των επιφανειών.",
  },
  {
    main: "exterior", sub: "walls", job: "primer",
    unit: "m²", defaultPrice: 3,
    label: "Τοίχοι — Αστάρι (1 χέρι)",
    sentence: "Ένα χέρι αστάρι, για την καλύτερη πρόσφυση και αντοχή του χρώματος.",
  },
  {
    main: "exterior", sub: "walls", job: "paint2",
    unit: "m²", defaultPrice: 9,
    label: "Τοίχοι — Βάψιμο (2 χέρια)",
    sentence: "Βάψιμο τοίχου με 2 χέρια ακρυλικά χρώματα, ειδικά για εξωτερικούς χώρους.",
  },
  {
  main: "exterior", sub: "walls", job: "spackle",
  unit: "m²", defaultPrice: 6.5,
  label: "Τοίχοι — Σπατουλάρισμα (εξωτερικά)",
  sentence: "Σπατουλάρισμα για επιπεδοποίηση και διόρθωση ατελειών.",
},
  {
    main: "exterior", sub: "walls", job: "paint3",
    unit: "m²", defaultPrice: 12,
    label: "Τοίχοι — Βάψιμο (3 χέρια)",
    sentence:
      "Βάψιμο τοίχου με 3 χέρια ακρυλικά χρώματα, ειδικά για εξωτερικούς χώρους, ανθεκτικά στον ήλιο, την υγρασία και τις καιρικές συνθήκες.",
  },

  // EXTERIOR — Ξύλα
  {
    main: "exterior", sub: "wood", job: "sanding",
    unit: "m²", defaultPrice: 6,
    label: "Ξύλα — Τρίψιμο (εξωτερικά)",
    sentence: "Τρίψιμο για απομάκρυνση παλαιών στρώσεων και ατελειών.",
  },
  {
    main: "exterior", sub: "wood", job: "clean",
    unit: "m²", defaultPrice: 2.5,
    label: "Ξύλα — Καθάρισμα (εξωτερικά)",
    sentence: "Καθάρισμα επιφανειών για απομάκρυνση σκόνης και ρύπων πριν την εφαρμογή.",
  },
  {
    main: "exterior", sub: "wood", job: "primer",
    unit: "m²", defaultPrice: 3,
    label: "Ξύλα — Αστάρι",
    sentence: "Εφαρμογή ασταριού για καλύτερη πρόσφυση και προστασία του υποστρώματος.",
  },
  {
    main: "exterior", sub: "wood", job: "paint2",
    unit: "m²", defaultPrice: 8.5,
    label: "Ξύλα — Βάψιμο (2 χέρια)",
    sentence: "Βάψιμο με 2 χέρια χρώμα, για προστασία και αισθητικό αποτέλεσμα.",
  },
  {
    main: "exterior", sub: "wood", job: "paint3",
    unit: "m²", defaultPrice: 10.5,
    label: "Ξύλα — Βάψιμο (3 χέρια)",
    sentence: "Βάψιμο με 3 χέρια χρώμα, για ενισχυμένη προστασία και ομοιόμορφο φινίρισμα.",
  },
  {
    main: "exterior", sub: "wood", job: "varnish",
    unit: "m²", defaultPrice: 9,
    label: "Ξύλα — Βερνίκι",
    sentence: "Εφαρμογή βερνικιού για μακροχρόνια προστασία και ανάδειξη της υφής.",
  },

  // EXTERIOR — Κάγκελα
  {
    main: "exterior", sub: "rails", job: "sanding",
    unit: "m²", defaultPrice: 6.5,
    label: "Κάγκελα — Τρίψιμο",
    sentence: "Τρίψιμο για αφαίρεση παλαιών στρώσεων και οξείδωσης.",
  },
  {
  main: "exterior", sub: "rails", job: "varnish",
  unit: "m²", defaultPrice: 9.5,
  label: "Κάγκελα — Βερνίκι",
  sentence: "Εφαρμογή βερνικιού για προστασία από οξείδωση και ομοιόμορφο φινίρισμα.",
},
  {
    main: "exterior", sub: "rails", job: "clean",
    unit: "m²", defaultPrice: 2.5,
    label: "Κάγκελα — Καθάρισμα",
    sentence: "Καθάρισμα μεταλλικών επιφανειών για σωστή πρόσφυση.",
  },
  {
    main: "exterior", sub: "rails", job: "primer",
    unit: "m²", defaultPrice: 3,
    label: "Κάγκελα — Αστάρι",
    sentence: "Αστάρι αντισκωριακό για προστασία και καλύτερη πρόσφυση.",
  },
  {
    main: "exterior", sub: "rails", job: "paint2",
    unit: "m²", defaultPrice: 9,
    label: "Κάγκελα — Βάψιμο (2 χέρια)",
    sentence: "Βάψιμο με 2 χέρια κατάλληλα μεταλλικά χρώματα για αντοχή στις καιρικές συνθήκες.",
  },
  {
    main: "exterior", sub: "rails", job: "paint3",
    unit: "m²", defaultPrice: 11,
    label: "Κάγκελα — Βάψιμο (3 χέρια)",
    sentence: "Βάψιμο με 3 χέρια για μέγιστη προστασία και ομοιόμορφο αποτέλεσμα.",
  },

  // EXTERIOR — Κεραμίδια
  {
    main: "exterior", sub: "tiles", job: "clean",
    unit: "m²", defaultPrice: 3,
    label: "Κεραμίδια — Καθάρισμα",
    sentence: "Καθάρισμα κεραμιδιών για απομάκρυνση ρύπων και βιοfilm.",
  },
  {
    main: "exterior", sub: "tiles", job: "paint2",
    unit: "m²", defaultPrice: 10,
    label: "Κεραμίδια — Βάψιμο (2 χέρια)",
    sentence: "Βάψιμο με 2 χέρια χρώμα, για προστασία της επιφάνειας και ομοιόμορφο αισθητικό αποτέλεσμα.",
  },
  {
    main: "exterior", sub: "tiles", job: "paint3",
    unit: "m²", defaultPrice: 12,
    label: "Κεραμίδια — Βάψιμο (3 χέρια)",
    sentence: "Βάψιμο με 3 χέρια για ενισχυμένη προστασία και αντοχή.",
  },

  // EXTERIOR — Μερεμέτια
  {
    main: "exterior", sub: "repairs", job: "repairs",
    unit: "τεμ.", defaultPrice: 30,
    label: "Μερεμέτια (εξωτερικά)",
    sentence: "Εργασίες μερεμετιών για την αποκατάσταση και επισκευή φθορών.",
  },

  // INTERIOR — Τοίχοι
  {
    main: "interior", sub: "walls", job: "sanding",
    unit: "m²", defaultPrice: 5,
    label: "Τοίχοι — Τρίψιμο (εσωτερικά)",
    sentence: "Τρίψιμο ώστε να δημιουργηθεί λεία επιφάνεια.",
  },
  {
    main: "interior", sub: "walls", job: "primer",
    unit: "m²", defaultPrice: 3,
    label: "Τοίχοι — Αστάρωμα",
    sentence: "Αστάρωμα, για την καλύτερη πρόσφυση του χρώματος.",
  },
  {
  main: "interior", sub: "walls", job: "spackle",
  unit: "m²", defaultPrice: 6,
  label: "Τοίχοι — Σπατουλαριστά",
  sentence: "Σπατουλαριστά για επιπεδοποίηση των τοίχων.",
},

  {
    main: "interior", sub: "walls", job: "paint2",
    unit: "m²", defaultPrice: 8,
    label: "Τοίχοι — Βάψιμο (2 χέρια)",
    sentence: "Βάψιμο με 2 χέρια πλαστικά χρώματα, κατάλληλα για εσωτερικούς χώρους.",
  },
  {
    main: "interior", sub: "walls", job: "paint3",
    unit: "m²", defaultPrice: 11,
    label: "Τοίχοι — Βάψιμο (3 χέρια)",
    sentence:
      "Βάψιμο με 3 χέρια πλαστικά χρώματα, κατάλληλα για εσωτερικούς χώρους, με αντοχή στο πλύσιμο και ομοιόμορφο φινίρισμα.",
  },
  {
    main: "interior", sub: "walls", job: "clean",
    unit: "m²", defaultPrice: 2.5,
    label: "Τοίχοι — Καθάρισμα (εσωτερικά)",
    sentence: "Καθάρισμα επιφανειών πριν από τις εργασίες για σωστή πρόσφυση.",
  },

  // INTERIOR — Ξύλα
  {
    main: "interior", sub: "wood", job: "sanding",
    unit: "m²", defaultPrice: 5.5,
    label: "Ξύλα — Τρίψιμο (εσωτερικά)",
    sentence: "Τρίψιμο για απομάκρυνση ατελειών και παλαιών στρώσεων.",
  },
  {
    main: "interior", sub: "wood", job: "clean",
    unit: "m²", defaultPrice: 2.5,
    label: "Ξύλα — Καθάρισμα (εσωτερικά)",
    sentence: "Καθάρισμα ξύλινων επιφανειών πριν την εφαρμογή υλικών.",
  },
  {
    main: "interior", sub: "wood", job: "primer",
    unit: "m²", defaultPrice: 3,
    label: "Ξύλα — Αστάρι",
    sentence: "Αστάρι για σταθεροποίηση και πρόσφυση.",
  },
  {
    main: "interior", sub: "wood", job: "paint2",
    unit: "m²", defaultPrice: 8,
    label: "Ξύλα — Βάψιμο (2 χέρια)",
    sentence: "Βάψιμο με 2 χέρια χρώμα, για προστασία και αισθητικό αποτέλεσμα.",
  },
  {
    main: "interior", sub: "wood", job: "paint3",
    unit: "m²", defaultPrice: 10,
    label: "Ξύλα — Βάψιμο (3 χέρια)",
    sentence: "Βάψιμο με 3 χέρια για ενισχυμένη κάλυψη και φινίρισμα.",
  },
  {
    main: "interior", sub: "wood", job: "varnish",
    unit: "m²", defaultPrice: 8.5,
    label: "Ξύλα — Βερνίκι",
    sentence: "Εφαρμογή βερνικιού για ανθεκτικότητα και ανάδειξη της υφής.",
  },

  // INTERIOR — Κάγκελα
  {
    main: "interior", sub: "rails", job: "sanding",
    unit: "m²", defaultPrice: 6,
    label: "Κάγκελα — Τρίψιμο (εσωτερικά)",
    sentence: "Τρίψιμο μεταλλικών επιφανειών για αφαίρεση φθορών.",
  },
  {
    main: "interior", sub: "rails", job: "clean",
    unit: "m²", defaultPrice: 2.5,
    label: "Κάγκελα — Καθάρισμα (εσωτερικά)",
    sentence: "Καθάρισμα για απομάκρυνση ρύπων και σωστή πρόσφυση.",
  },
  {
    main: "interior", sub: "rails", job: "primer",
    unit: "m²", defaultPrice: 3,
    label: "Κάγκελα — Αστάρι",
    sentence: "Αντισκωριακό αστάρι για προστασία και πρόσφυση.",
  },
  {
    main: "interior", sub: "rails", job: "paint2",
    unit: "m²", defaultPrice: 8.5,
    label: "Κάγκελα — Βάψιμο (2 χέρια)",
    sentence: "Βάψιμο με 2 χέρια μεταλλικά χρώματα.",
  },
  {
  main: "interior", sub: "rails", job: "varnish",
  unit: "m²", defaultPrice: 9,
  label: "Κάγκελα — Βερνίκι (εσωτερικά)",
  sentence: "Εφαρμογή βερνικιού για προστασία και αισθητικό αποτέλεσμα.",
},
  {
    main: "interior", sub: "rails", job: "paint3",
    unit: "m²", defaultPrice: 10.5,
    label: "Κάγκελα — Βάψιμο (3 χέρια)",
    sentence: "Βάψιμο με 3 χέρια για υψηλή αντοχή.",
  },

  // INTERIOR — Κεραμίδια (σπάνιο αλλά στηρίζουμε ίδιο μοτίβο)
  {
    main: "interior", sub: "tiles", job: "clean",
    unit: "m²", defaultPrice: 3,
    label: "Κεραμίδια — Καθάρισμα (εσωτερικά)",
    sentence: "Καθάρισμα επιφανειών κεραμιδιών.",
  },
  {
    main: "interior", sub: "tiles", job: "paint2",
    unit: "m²", defaultPrice: 9.5,
    label: "Κεραμίδια — Βάψιμο (2 χέρια, εσωτερικά)",
    sentence: "Βάψιμο με 2 χέρια για ομοιόμορφο αποτέλεσμα.",
  },
  {
    main: "interior", sub: "tiles", job: "paint3",
    unit: "m²", defaultPrice: 11.5,
    label: "Κεραμίδια — Βάψιμο (3 χέρια, εσωτερικά)",
    sentence: "Βάψιμο με 3 χέρια για ενισχυμένη αντοχή.",
  },

  // INTERIOR — Μερεμέτια
  {
    main: "interior", sub: "repairs", job: "repairs",
    unit: "τεμ.", defaultPrice: 25,
    label: "Μερεμέτια (εσωτερικά)",
    sentence: "Εργασίες μερεμετιών για την αποκατάσταση και επισκευή φθορών.",
  },
];

// Index for fast lookup
const CATALOG_INDEX = CATALOG.reduce((m, item) => {
  m[`${item.main}:${item.sub}:${item.job}`] = item;
  return m;
}, {} as Record<string, CatalogItem>);

// Map normalized tokens to job keys
function tokenToJob(token: string): JobKey | null {
  if (!token) return null;
  if (token === "τριψιμο") return "sanding";
  if (token === "καθαρισμα") return "clean";
  if (token === "ασταρι" || token === "ασταρωμα") return "primer";
  if (token === "βερνικι") return "varnish";
  if (token === "μερεμετια" || token === "μερεμετι") return "repairs";
  if (token === "σπατουλαρισμα" || token === "σπατουλαριστα" || token === "σπατουλα") return "spackle"; // ✅ add this
  if (token === "χρωμα") return null; // handled via coat selector (2/3)
  return null;
}


// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────
export default function OfferBuilder() {
  // Header fields
  const [customer, setCustomer] = useState("");
  const [project, setProject] = useState("");
  const [note, setNote] = useState("");
  // Saved offers (stored in localStorage)
const [offers, setOffers] = useState<Offer[]>(() => loadOffers());
useEffect(() => {
  persistOffers(offers);
}, [offers]);

// Offer status + creation date
const [status] = useState<"pending" | "accepted" | "rejected">("pending");

const [createdAt] = useState(new Date());

// Customers list
const [clients, setClients] = useState<string[]>(["Πελάτης Α", "Πελάτης Β"]);
const [newCustomer, setNewCustomer] = useState("");

  // Main section selector
  const [main, setMain] = useState<MainSection>("exterior");

  // Expand/collapse state per subsection
  const [expanded, setExpanded] = useState<Record<SubSection, boolean>>({
    walls: true,
    wood: true,
    rails: false,
    tiles: false,
    repairs: false,
  });

  // Keywords text per subsection
  const [kw, setKw] = useState<Record<SubSection, string>>({
    walls: "",
    wood: "",
    rails: "",
    tiles: "",
    repairs: "",
  });

  // Pending coat prompts: each time "χρώμα" is seen, add a prompt entry
  const [coatPrompts, setCoatPrompts] = useState<
    { id: string; main: MainSection; sub: SubSection }[]
  >([]);

  // Lines (priced items + sentences)
  const [lines, setLines] = useState<Line[]>([]);

  // VAT
  const [vatEnabled, setVatEnabled] = useState(true);
  const [vatRate, setVatRate] = useState(24);

  // Add a line if not present (by key)
  function addLine(item: CatalogItem) {
    setLines((prev) => {
      const key = `${item.main}:${item.sub}:${item.job}`;
      if (prev.some((l) => l.key === key)) return prev;
      return [
        ...prev,
        {
          id: uuid(),
          main: item.main,
          sub: item.sub,
          key,
          label: item.label,
          sentence: item.sentence,
          qty: 1,
          unit: item.unit,
          unitPrice: item.defaultPrice,
        },
      ];
    });
  }

  // Parse a subsection keywords string
  function parseSubsection(sub: SubSection) {
    const tokens = splitKeywords(kw[sub]);
    const newCoats: { id: string; main: MainSection; sub: SubSection }[] = [];

    tokens.forEach((t) => {
      if (t === "χρωμα") {
        newCoats.push({ id: uuid(), main, sub });
        return;
      }
      const job = tokenToJob(t);
      if (!job) return;
      const item = CATALOG_INDEX[`${main}:${sub}:${job}`];
      if (item) addLine(item);
    });

    if (newCoats.length) {
      setCoatPrompts((prev) => [...prev, ...newCoats]);
    }
  }

  // Handle a coat prompt selection
  function resolveCoatPrompt(id: string, coats: "2" | "3") {
    setCoatPrompts((prev) => {
      const p = prev.find((x) => x.id === id);
      if (p) {
        const job: JobKey = coats === "2" ? "paint2" : "paint3";
        const item = CATALOG_INDEX[`${p.main}:${p.sub}:${job}`];
        if (item) addLine(item);
      }
      return prev.filter((x) => x.id !== id);
    });
  }

  // Update/Remove line
  function updateLine(id: string, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  
// Print: we’ll use Tailwind's print utilities to hide the left column
function handlePrint() {
  window.print();
}
// Save a new offer
function saveNewOffer() {
  const chosenCustomer =
    customer === "__new" ? (newCustomer || "").trim() : (customer || "").trim();

  if (!chosenCustomer) {
    alert("Συμπλήρωσε πελάτη πριν την αποθήκευση.");
    return;
  }

  const newOffer: Offer = {
    id: uuid(),
    customer: chosenCustomer,
    project: (project || "").trim(),
    note: (note || "").trim(),
    createdAt: new Date().toISOString(),
    status: "pending",
    total,
    // deep clone lines so later edits in the builder don't mutate saved offers
    lines: JSON.parse(JSON.stringify(lines)),
  };

  setOffers((prev) => [newOffer, ...prev]);

  if (customer === "__new" && newCustomer.trim()) {
    setClients((prev) => [...prev, newCustomer.trim()]);
    setCustomer(newCustomer.trim());
    setNewCustomer("");
  }

  alert("Η προσφορά αποθηκεύτηκε ως «Εκκρεμεί».");
}

// Change status of an offer
function setOfferStatus(id: string, next: OfferStatus) {
  setOffers((prev) =>
    prev.map((o) => (o.id === id ? { ...o, status: next } : o))
  );
}

// Delete an offer
function deleteOffer(id: string) {
  if (confirm("Διαγραφή προσφοράς;")) {
    setOffers((prev) => prev.filter((o) => o.id !== id));
  }
}

// Export to Word (.docx)
async function handleExportDocx() {
  // Helper: group lines by section/subsection
  const subs: SubSection[] = ["walls", "wood", "rails", "tiles", "repairs"];
  const mains: MainSection[] = ["exterior", "interior"];

  const grouped: Record<MainSection, Record<SubSection, Line[]>> = {
    exterior: { walls: [], wood: [], rails: [], tiles: [], repairs: [] },
    interior: { walls: [], wood: [], rails: [], tiles: [], repairs: [] },
  };
  lines.forEach((l) => grouped[l.main][l.sub].push(l));

  const children: Array<Paragraph | Table> = [];

  // Title
  children.push(
    new Paragraph({
      text: "ΠΡΟΣΦΟΡΑ ΕΡΓΑΣΙΑΣ",
      heading: HeadingLevel.TITLE,
    })
  );

  // Header info
  if (customer) {
    children.push(new Paragraph({ text: `Πελάτης: ${customer}` }));
  }
  if (project) {
    children.push(new Paragraph({ text: `Έργο: ${project}` }));
  }
  children.push(
    new Paragraph({ text: `Ημερομηνία: ${new Date().toLocaleDateString()}` })
  );
  children.push(new Paragraph({ text: " " }));

  // Narrative (sentences)
  mains.forEach((m) => {
    const any = subs.some((s) => grouped[m][s].length > 0);
    if (!any) return;

    children.push(
      new Paragraph({
        text: m === "exterior" ? "Εξωτερικά" : "Εσωτερικά",
        heading: HeadingLevel.HEADING_2,
      })
    );

    subs.forEach((s) => {
      const items = grouped[m][s];
      if (items.length === 0) return;

      children.push(
        new Paragraph({
          text: SUB_TITLES[s],
          heading: HeadingLevel.HEADING_3,
        })
      );

      if (s === "walls") {
        children.push(
          new Paragraph({
            text:
              m === "exterior"
                ? "Οι εργασίες που θα πραγματοποιηθούν στον εξωτερικό χώρο περιλαμβάνουν:"
                : "Στο εσωτερικό τμήμα θα γίνουν οι εξής εργασίες:",
          })
        );
      }

      items.forEach((l) => {
        children.push(new Paragraph({ text: l.sentence }));
      });

      children.push(new Paragraph({ text: "—" }));
    });
  });

  // Notes
  if (note?.trim()) {
    children.push(
      new Paragraph({ text: "Σημείωση", heading: HeadingLevel.HEADING_2 })
    );
    note.split(/\r?\n/).forEach((line) => {
      if (line.trim()) children.push(new Paragraph({ text: line.trim() }));
    });
    children.push(new Paragraph({ text: "—" }));
  }

  // Prices (grouped, bullet-like list with price)
  mains.forEach((m) => {
    const any = subs.some((s) => grouped[m][s].length > 0);
    if (!any) return;

    children.push(
      new Paragraph({
        text: m === "exterior" ? "Τιμές — Εξωτερικά" : "Τιμές — Εσωτερικά",
        heading: HeadingLevel.HEADING_2,
      })
    );

    subs.forEach((s) => {
      const items = grouped[m][s];
      if (items.length === 0) return;

      children.push(
        new Paragraph({
          text: SUB_TITLES[s],
          heading: HeadingLevel.HEADING_3,
        })
      );

      // Build a 2-column table (· work | €price)
      const rows: TableRow[] = items.map((l) => {
        const short = l.label.replace(/^.*?— /, "");
        const price = (l.qty * l.unitPrice).toFixed(2);

        return new TableRow({
          children: [
            new TableCell({
              width: { size: 70, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ text: `· ${short}` })],
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
            }),
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: `€${price}` })],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
              margins: { top: 80, bottom: 80, left: 80, right: 80 },
            }),
          ],
        });
      });

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows,
        })
      );

      children.push(new Paragraph({ text: " " }));
    });
  });

  // Totals
  children.push(new Paragraph({ text: " " }));
  children.push(
    new Paragraph({
      text: `Υποσύνολο: €${subtotal.toFixed(2)}`,
      heading: HeadingLevel.HEADING_3,
    })
  );
  if (vatEnabled) {
    children.push(
      new Paragraph({
        text: `ΦΠΑ ${vatRate}%: €${vatAmount.toFixed(2)}`,
        heading: HeadingLevel.HEADING_3,
      })
    );
  }
  children.push(
    new Paragraph({
      text: `Σύνολο: €${total.toFixed(2)}`,
      heading: HeadingLevel.HEADING_2,
    })
  );

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const fileNameSafe = (customer || project || "offer")
    .toString()
    .replace(/[^\p{L}\p{N}\-_ ]/gu, "");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileNameSafe || "offer"}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}


  // Derived totals
  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.qty * l.unitPrice, 0),
    [lines]
  );
  const vatAmount = useMemo(
    () => (vatEnabled ? (subtotal * vatRate) / 100 : 0),
    [subtotal, vatEnabled, vatRate]
  );
  const total = subtotal + vatAmount;
  // Sentences grouped by main > sub (from current lines)
const sentencesBy: Record<MainSection, Record<SubSection, string[]>> = {
  exterior: { walls: [], wood: [], rails: [], tiles: [], repairs: [] },
  interior: { walls: [], wood: [], rails: [], tiles: [], repairs: [] },
};
lines.forEach((l) => {
  sentencesBy[l.main][l.sub].push(l.sentence);
  
});


  const visibleSubs: SubSection[] = ["walls", "wood", "rails", "tiles", "repairs"];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-6">
        {/* LEFT: Controls */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-semibold">Offer Builder</h1>

          {/* Customer / Project */}
 <label className="text-sm text-neutral-300">Πελάτης</label>
<select
  value={customer}
  onChange={(e) => setCustomer(e.target.value)}
  className="bg-neutral-800 rounded-xl px-3 py-2 outline-none focus:ring-2 ring-neutral-600"
>
  <option value="">-- Επιλέξτε Πελάτη --</option>
  {clients.map((c) => (
    <option key={c} value={c}>{c}</option>
  ))}
  <option value="__new">➕ Προσθήκη Νέου Πελάτη</option>
</select>

{/* Project field should be OUTSIDE */}
<label className="text-sm text-neutral-300 mt-2 block">Έργο</label>
<input
  value={project}
  onChange={(e) => setProject(e.target.value)}
  className="bg-neutral-800 rounded-xl px-3 py-2 outline-none focus:ring-2 ring-neutral-600"
  placeholder="Διεύθυνση ή περιγραφή έργου"
/>


{customer === "__new" && (
  <div className="mt-2 flex gap-2">
    <input
      value={newCustomer}
      onChange={(e) => setNewCustomer(e.target.value)}
      placeholder="Όνομα νέου πελάτη"
      className="flex-1 bg-neutral-800 rounded-xl px-3 py-2 outline-none"
    />
    <button
      onClick={() => {
        if (newCustomer.trim()) {
          setClients((prev) => [...prev, newCustomer]);
          setCustomer(newCustomer);
          setNewCustomer("");
        }
      }}
      className="px-3 py-2 rounded-xl bg-green-600 hover:bg-green-700"
    >
      Αποθήκευση
    </button>
  </div>
)}


          {/* Main section selector */}
          <div className="grid gap-2 bg-neutral-900/60 rounded-xl p-4">
            <label className="text-sm text-neutral-300">Section</label>
            <select
              className="bg-neutral-800 rounded-xl px-3 py-2 outline-none focus:ring-2 ring-neutral-600"
              value={main}
              onChange={(e) => setMain(e.target.value as MainSection)}
            >
              <option value="exterior">Εξωτερικά</option>
              <option value="interior">Εσωτερικά</option>
            </select>
          </div>

          {/* Subsections (collapsible) */}
          <div className="grid gap-3">
            {visibleSubs.map((sub) => {
              const isOpen = expanded[sub];
              const pending = coatPrompts.filter((p) => p.main === main && p.sub === sub);

              return (
                <div key={sub} className="bg-neutral-900/60 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{SUB_TITLES[sub]}</h3>
                    <button
                      className="text-sm opacity-80 hover:opacity-100"
                      onClick={() =>
                        setExpanded((prev) => ({ ...prev, [sub]: !prev[sub] }))
                      }
                    >
                      {isOpen ? "−" : "+"}
                    </button>
                  </div>

                  {isOpen && (
                    <>
                      <label className="text-sm text-neutral-300 mt-2 block">
                        Keywords (comma or space separated)
                      </label>
                      <textarea
                        value={kw[sub]}
                        onChange={(e) =>
                          setKw((prev) => ({ ...prev, [sub]: e.target.value }))
                        }
                        className="bg-neutral-800 rounded-xl px-3 py-2 min-h-[70px] outline-none focus:ring-2 ring-neutral-600 w-full"
                        placeholder="e.g., τρίψιμο, αστάρι, χρώμα, καθάρισμα, βερνίκι, μερεμέτια"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => parseSubsection(sub)}
                          className="rounded-xl px-3 py-2 bg-white/10 hover:bg-white/20"
                        >
                          🎯 Parse {SUB_TITLES[sub]}
                        </button>
                        <div className="text-xs text-neutral-400">
                          χρώμα → choose 2 or 3 coats
                        </div>
                      </div>

                      {/* Coat prompts inline for this sub */}
                      {pending.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {pending.map((p) => (
                            <div
                              key={p.id}
                              className="bg-neutral-800 rounded-lg p-2 flex items-center gap-2"
                            >
                              <span className="text-sm">
                                {SUB_TITLES[p.sub]}: coats for “χρώμα”
                              </span>
                              <select
                                className="bg-neutral-700 rounded px-2 py-1"
                                defaultValue=""
                                onChange={(e) =>
                                  e.target.value
                                    ? resolveCoatPrompt(
                                        p.id,
                                        e.target.value as "2" | "3"
                                      )
                                    : null
                                }
                              >
                                <option value="" disabled>
                                  Choose…
                                </option>
                                <option value="2">2 χέρια</option>
                                <option value="3">3 χέρια</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Prices editor */}
          <div className="grid gap-3 bg-neutral-900/60 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Τιμές</h2>
            </div>

            {lines.length === 0 ? (
              <div className="text-sm text-neutral-400">
                No items yet. Add keywords above, then edit quantities and prices here.
              </div>
            ) : (
              <div className="space-y-2">
                {visibleSubs.map((sub) => {
  const items = lines.filter((l) => l.sub === sub);
  if (items.length === 0) return null;
  return (
    <div key={sub} className="mb-4">
      <h3 className="font-semibold mb-2">{SUB_TITLES[sub]}</h3>
      {items.map((l) => (
        <div
          key={l.id}
          className="flex items-center gap-3 mb-2 bg-neutral-800/60 rounded-xl p-2"
        >
          <span className="flex-1 text-sm">{l.label.replace(/^.*?— /, "")}</span>
          <input
            className="w-24 bg-neutral-700 rounded-lg px-2 py-1 text-right"
            type="number"
            step="0.1"
            min={0}
            value={l.unitPrice}
            onChange={(e) =>
              updateLine(l.id, { unitPrice: Number(e.target.value) })
            }
            placeholder="€"
          />
        </div>
      ))}
    </div>
  );
})}

              </div>
            )}
          </div>


{/* VAT */}
<div className="grid gap-2 bg-neutral-900/60 rounded-xl p-4">
  <div className="flex items-center gap-2">
    <input
      id="vat"
      type="checkbox"
      checked={vatEnabled}
      onChange={(e) => setVatEnabled(e.target.checked)}
    />
    <label htmlFor="vat">Include VAT</label>
    {vatEnabled && (
      <div className="flex items-center gap-2 ml-4">
        <span className="text-sm text-neutral-300">Rate</span>
        <input
          type="number"
          min={0}
          max={100}
          value={vatRate}
          onChange={(e) => setVatRate(Number(e.target.value))}
          className="w-20 bg-neutral-800 rounded-lg px-2 py-1 outline-none focus:ring-2 ring-neutral-600"
        />
        <span>%</span>
      </div>
    )}
  </div>
</div>

{/* Notes */}
<div className="grid gap-2 bg-neutral-900/60 rounded-xl p-4">
  <label htmlFor="notes" className="text-sm text-neutral-300">Σημειώσεις</label>
  <textarea
    id="notes"
    value={note}
    onChange={(e) => setNote(e.target.value)}
    className="bg-neutral-800 rounded-xl px-3 py-2 min-h-[80px] outline-none focus:ring-2 ring-neutral-600"
    placeholder="Γράψε εδώ ό,τι θέλεις να εμφανιστεί στην ενότητα «Σημείωση» (π.χ. Η σκαλωσιά περιλαμβάνεται...)"
  />
</div>

{/* Save Offer Button */}
<div className="grid gap-2 bg-neutral-900/60 rounded-xl p-4">
  <button
    onClick={saveNewOffer}
    className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
  >
    💾 Αποθήκευση Προσφοράς
  </button>
</div>

{/* Offers List */}
<div id="offers-list" className="grid gap-3 bg-neutral-900/60 rounded-xl p-4">
  <div className="flex items-center justify-between">
    <h2 className="font-medium">Προσφορές</h2>
    <span className="text-xs opacity-60">{offers.length}</span>
  </div>

  {offers.length === 0 ? (
    <div className="text-sm text-neutral-400">
      Δεν υπάρχουν αποθηκευμένες προσφορές.
    </div>
  ) : (
    <div className="space-y-2">
      {offers.map((o) => (
        <div key={o.id} className="bg-neutral-800/60 rounded-xl p-3">
          <div className="text-sm">
            <div><span className="opacity-70">Πελάτης:</span> {o.customer || "—"}</div>
            {o.project && (
              <div><span className="opacity-70">Έργο:</span> {o.project}</div>
            )}
            <div>
              <span className="opacity-70">Ημερομηνία:</span>{" "}
              {new Date(o.createdAt).toLocaleDateString()}
            </div>
            <div className="mt-1">
              <span className="opacity-70">Κατάσταση:</span>{" "}
              {o.status === "pending"
                ? "Εκκρεμεί"
                : o.status === "accepted"
                ? "Εγκρίθηκε"
                : "Απορρίφθηκε"}
            </div>
            <div className="mt-1">
              <span className="opacity-70">Σύνολο:</span> €{o.total.toFixed(2)}
            </div>
          </div>

          <div className="flex gap-2 mt-3">
            {o.status === "pending" && (
              <button
                onClick={() => setOfferStatus(o.id, "accepted")}
                className="px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-sm"
              >
                ✅ Αποδοχή
              </button>
            )}
            <button
              onClick={() => deleteOffer(o.id)}
              className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-sm"
            >
              🗑️ Διαγραφή
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>  
</div>  
 {/* ✅ only this one closes it */}

{/* RIGHT: Preview */}
<div className="bg-white text-neutral-900 rounded-2xl p-6">
  <div className="max-w-2xl mx-auto">
    {/* Header */}
    <header className="border-b pb-3 mb-4 flex items-start justify-between">
      <div>
        <h2 className="text-2xl font-semibold">ΠΡΟΣΦΟΡΑ ΕΡΓΑΣΙΑΣ</h2>
        <div className="text-sm mt-1 space-y-1">
          {customer && (<div><span className="opacity-60">Πελάτης:</span> {customer}</div>)}
          {project && (<div><span className="opacity-60">Έργο:</span> {project}</div>)}
          <div className="opacity-60">Ημερομηνία Δημιουργίας: {createdAt.toLocaleDateString()}</div>
          <div className="opacity-60">
            Κατάσταση: {status === "pending" ? "Εκκρεμεί" : status === "accepted" ? "Εγκρίθηκε" : "Απορρίφθηκε"}
          </div>
        </div>
      </div>

      <div className="flex gap-2 print:hidden">
        <button
          onClick={handlePrint}
          className="px-3 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-100"
        >
          Print
        </button>
        <button
          onClick={handleExportDocx}
          className="px-3 py-2 rounded-lg border border-neutral-300 hover:bg-neutral-100"
        >
          Export .docx
        </button>
      </div>
    </header>

    {/* Narrative */}
    {(["exterior","interior"] as MainSection[]).map((m) => {
      const anySubs = (["walls","wood","rails","tiles","repairs"] as SubSection[])
        .some((sub) => sentencesBy[m][sub].length > 0);
      if (!anySubs) return null;

      return (
        <div key={`prev-${m}`} className="mb-4">
          <h3 className="text-lg font-semibold mb-1">{SECTION_TITLES[m]}</h3>

          {(["walls","wood","rails","tiles","repairs"] as SubSection[]).map((sub) => {
            const list = sentencesBy[m][sub];
            if (list.length === 0) return null;
            return (
              <div key={`prev-${m}-${sub}`} className="mb-3">
                <div className="font-semibold">{SUB_TITLES[sub]}</div>
                {sub === "walls" && (
                  <p className="mb-1 opacity-90">
                    {m === "exterior"
                      ? "Οι εργασίες που θα πραγματοποιηθούν στον εξωτερικό χώρο περιλαμβάνουν:"
                      : "Στο εσωτερικό τμήμα θα γίνουν οι εξής εργασίες:"}
                  </p>
                )}
                <div className="space-y-1">
                  {list.map((s, i) => (
                    <p key={i}>{s}</p>
                  ))}
                </div>
                <p className="my-2">---</p>
              </div>
            );
          })}
        </div>
      );
    })}

    {/* Note */}
    {note && (
      <>
        <h3 className="text-lg font-semibold mb-1">Σημείωση</h3>
        <p className="mb-4">{note}</p>
      </>
    )}

    {/* Prices */}
    {lines.length > 0 && (
      <>
        <p className="my-2">---</p>
        <h3 className="text-lg font-semibold mb-2">Τιμές</h3>
        {visibleSubs.map((sub) => {
          const items = lines.filter((l) => l.sub === sub);
          if (items.length === 0) return null;
          return (
            <div key={sub} className="mb-4">
              <h3 className="font-semibold">{SUB_TITLES[sub]}</h3>
              <ul className="ml-4 space-y-1">
                {items.map((l) => (
                  <li key={l.id} className="flex justify-between">
                    <span>· {l.label.replace(/^.*?— /, "")}</span>
                    <span>€{(l.qty * l.unitPrice).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {/* Totals */}
        <div className="mt-4 ml-auto w-full sm:w-80">
          <div className="flex justify-between py-1 text-sm">
            <span className="opacity-70">Υποσύνολο</span>
            <span>€{subtotal.toFixed(2)}</span>
          </div>
          {vatEnabled && (
            <div className="flex justify-between py-1 text-sm">
              <span className="opacity-70">ΦΠΑ {vatRate}%</span>
              <span>€{vatAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 text-base font-medium border-t mt-2">
            <span>Σύνολο</span>
            <span>€{total.toFixed(2)}</span>
          </div>
        </div>
      </>
    )}
  </div>
</div>
  </div>
</div>
);
}