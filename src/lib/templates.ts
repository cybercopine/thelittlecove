// Post template registry. To add a new template later: add an entry here and
// (optionally) a renderer case in src/components/post/PostView.tsx — unknown
// templates fall back to the Personal Journal layout.

export type FieldDef =
  | { key: string; label: string; type: "text" | "date" | "textarea"; placeholder?: string; hint?: string; italic?: boolean }
  | { key: string; label: string; type: "list"; placeholder?: string; hint?: string }
  | { key: string; label: string; type: "links"; hint?: string };

export type TemplateDef = {
  id: string;
  label: string;
  letter: string;
  description: string;
  defaultCategory?: string;
  fields: FieldDef[];
  usesGallery?: boolean;
};

export const TEMPLATES: TemplateDef[] = [
  {
    id: "journal",
    letter: "A",
    label: "Personal Journal",
    description: "Long-form reflections and stories with a large title, quotes and inline photos.",
    defaultCategory: "journal",
    fields: [],
  },
  {
    id: "note",
    letter: "B",
    label: "Little Note",
    description: "A brief thought on a decorative paper note. Title is optional.",
    defaultCategory: "journal",
    fields: [],
  },
  {
    id: "field_note",
    letter: "C",
    label: "Entomology Field Note",
    description: "Species, scientific name, observation date & place, photos and references.",
    defaultCategory: "entomology",
    usesGallery: true,
    fields: [
      { key: "common_name", label: "Common name", type: "text", placeholder: "Cecropia moth" },
      { key: "scientific_name", label: "Scientific name", type: "text", placeholder: "Hyalophora cecropia", italic: true, hint: "Shown in italics automatically." },
      { key: "observed_on", label: "Observation date", type: "date" },
      { key: "location", label: "Observation location", type: "text", placeholder: "Back garden" },
      { key: "specimen_no", label: "Plate / specimen number", type: "text", placeholder: "04" },
      { key: "references", label: "References & links", type: "links" },
    ],
  },
  {
    id: "recipe",
    letter: "D",
    label: "Recipe Card",
    description: "Ingredients, times, servings, steps and personal notes. Printable.",
    defaultCategory: "food",
    fields: [
      { key: "prep_time", label: "Preparation time", type: "text", placeholder: "10 min" },
      { key: "cook_time", label: "Cooking time", type: "text", placeholder: "25 min" },
      { key: "servings", label: "Servings", type: "text", placeholder: "4" },
      { key: "ingredients", label: "Ingredients (one per line, with measurements)", type: "list", placeholder: "200 g flour" },
      { key: "steps", label: "Steps (one per line)", type: "list", placeholder: "Whisk the eggs…" },
      { key: "notes", label: "Tips & personal notes", type: "textarea" },
    ],
  },
  {
    id: "food_story",
    letter: "E",
    label: "Food Story",
    description: "Editorial writing about meals, cafés and memories, with photos and an optional place.",
    defaultCategory: "food",
    usesGallery: true,
    fields: [{ key: "location", label: "Place (optional)", type: "text", placeholder: "A little café in Kyoto" }],
  },
  {
    id: "ikebana",
    letter: "F",
    label: "Ikebana Gallery",
    description: "A large, gallery-like presentation of an arrangement with materials used.",
    defaultCategory: "japanese",
    usesGallery: true,
    fields: [
      { key: "arrangement_title", label: "Arrangement title", type: "text" },
      { key: "materials", label: "Flowers & materials (one per line)", type: "list" },
      { key: "arranged_on", label: "Arrangement date", type: "date" },
    ],
  },
  {
    id: "haiku",
    letter: "G",
    label: "Haiku / Poetry",
    description: "Centered poetry with preserved line breaks and optional Japanese, romaji & translation.",
    defaultCategory: "japanese",
    fields: [
      { key: "japanese", label: "Japanese text (optional)", type: "textarea", hint: "Line breaks are kept exactly." },
      { key: "romaji", label: "Romanization (optional)", type: "textarea" },
      { key: "english", label: "English / translation", type: "textarea" },
      { key: "poet", label: "Poet (leave blank if it's yours)", type: "text" },
    ],
  },
];

export function getTemplate(id: string | null | undefined): TemplateDef {
  return (TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0])!;
}
