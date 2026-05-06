import { Tag } from "@/types";

export const tags: Tag[] = [
  // 1. Tipos de sintagmas (phrase)
  {
    id: "sn",
    label: "Sintagma Nominal",
    short: "SN",
    aliases: ["sn", "s.n.", "sintagma nominal", "nominal"],
    category: "phrase",
    color: "#EF4444",
    description: "Su núcleo es un sustantivo o pronombre.",
  },
  {
    id: "sv",
    label: "Sintagma Verbal",
    short: "SV",
    aliases: ["sv", "s.v.", "sintagma verbal", "verbal"],
    category: "phrase",
    color: "#22C55E",
    description: "Su núcleo es un verbo. Forma el predicado.",
  },
  {
    id: "sprep",
    label: "Sintagma Preposicional",
    short: "SPrep",
    aliases: ["sprep", "s.prep", "sp", "sintagma preposicional", "preposicional"],
    category: "phrase",
    color: "#8B5CF6",
    description: "Empieza con una preposición + un SN.",
  },
  {
    id: "sadj",
    label: "Sintagma Adjetival",
    short: "SAdj",
    aliases: ["sadj", "s.adj", "sintagma adjetival", "adjetival"],
    category: "phrase",
    color: "#3B82F6",
    description: "Su núcleo es un adjetivo.",
  },
  {
    id: "sadv",
    label: "Sintagma Adverbial",
    short: "SAdv",
    aliases: ["sadv", "s.adv", "sintagma adverbial", "adverbial"],
    category: "phrase",
    color: "#F59E0B",
    description: "Su núcleo es un adverbio.",
  },

  // 2. Funciones sintácticas (function)
  {
    id: "sujeto",
    label: "Sujeto",
    short: "Suj",
    aliases: ["suj", "sujeto", "subject"],
    category: "function",
    color: "#6366F1",
    description: "Es quien realiza la acción o de quien se dice algo.",
  },
  {
    id: "predicado",
    label: "Predicado",
    short: "Pred",
    aliases: ["pred", "predicado", "predicate"],
    category: "function",
    color: "#EC4899",
    description: "Lo que se dice del sujeto.",
  },
  {
    id: "cd",
    label: "Complemento Directo",
    short: "CD",
    aliases: ["cd", "c.d.", "od", "objeto directo"],
    category: "function",
    color: "#F97316",
    description: "Recibe directamente la acción del verbo.",
  },
  {
    id: "ci",
    label: "Complemento Indirecto",
    short: "CI",
    aliases: ["ci", "c.i.", "oi", "objeto indirecto"],
    category: "function",
    color: "#10B981",
    description: "Indica a quién o para quién se hace la acción.",
  },
  {
    id: "cc",
    label: "Complemento Circunstancial",
    short: "CC",
    aliases: ["cc", "c.c.", "lugar", "tiempo", "modo", "causa", "ccl", "cct", "ccm", "ccc"],
    category: "function",
    color: "#14B8A6",
    description: "Indica circunstancias: lugar, tiempo, modo, causa…",
  },
  {
    id: "creg",
    label: "Complemento de Régimen",
    short: "CReg",
    aliases: ["creg", "c.reg.", "cr", "suplemento"],
    category: "function",
    color: "#06B6D4",
    description: "Va con verbos que exigen preposición.",
  },
  {
    id: "cagente",
    label: "Complemento Agente",
    short: "CAg",
    aliases: ["cag", "c.ag.", "agente", "complemento agente"],
    category: "function",
    color: "#F43F5E",
    description: "En oraciones pasivas, indica quién realiza la acción.",
  },
  {
    id: "cpred",
    label: "Complemento Predicativo",
    short: "CPred",
    aliases: ["cpred", "c.pred.", "cp", "predicativo"],
    category: "function",
    color: "#84CC46",
    description: "Aporta una cualidad del sujeto o del CD.",
  },
  {
    id: "atributo",
    label: "Atributo",
    short: "Atrib",
    aliases: ["atrib", "atr", "atributo"],
    category: "function",
    color: "#3B82F6",
    description: "Aparece con verbos copulativos (ser, estar, parecer).",
  },
  {
    id: "termino",
    label: "Término",
    short: "T",
    aliases: ["t", "term", "termino", "término"],
    category: "function",
    color: "#94A3B8",
    description: "Elemento dentro de un SPrep (después de la preposición).",
  },
  {
    id: "complemento-nombre",
    label: "Compl. del Nombre",
    short: "CN",
    aliases: ["cn", "complemento del nombre", "c.n."],
    category: "function",
    color: "#EC4899",
    description: "Sintagma que complementa a un nombre.",
  },

  // 3. Enlaces (connector)
  {
    id: "enlace",
    label: "Enlace",
    short: "Enl",
    aliases: ["enl", "enlace", "prep", "preposicion"],
    category: "connector",
    color: "#475569",
    description: "Preposiciones o elementos que conectan palabras.",
  },

  // 4. Estructura interna (structure)
  {
    id: "nucleo",
    label: "Núcleo",
    short: "N",
    aliases: ["nucleo", "núcleo", "head"],
    category: "structure",
    color: "#A855F7",
    description: "Palabra principal del sintagma.",
  },
  {
    id: "determinante",
    label: "Determinante",
    short: "Det",
    aliases: ["det", "determinante", "article"],
    category: "structure",
    color: "#FACC15",
    description: "Palabra que acompaña y determina al sustantivo.",
  },
  {
    id: "modificador",
    label: "Modificador",
    short: "Mod",
    aliases: ["mod", "modificador", "modifier"],
    category: "structure",
    color: "#64748B",
    description: "Aporta información extra al núcleo.",
  },
];

export const getTagsByCategory = (category: Tag["category"]): Tag[] => {
  return tags.filter((tag) => tag.category === category);
};

export const findTagByAlias = (query: string): Tag | undefined => {
  const lowerQuery = query.toLowerCase().trim();
  return tags.find(
    (tag) =>
      tag.id === lowerQuery ||
      tag.label.toLowerCase() === lowerQuery ||
      tag.short.toLowerCase() === lowerQuery ||
      tag.aliases.some((alias) => alias.toLowerCase() === lowerQuery)
  );
};

export const filterTags = (query: string): Tag[] => {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return tags;

  return tags.filter(
    (tag) =>
      tag.label.toLowerCase().includes(lowerQuery) ||
      tag.short.toLowerCase().includes(lowerQuery) ||
      tag.description.toLowerCase().includes(lowerQuery) ||
      tag.aliases.some((alias) => alias.toLowerCase().includes(lowerQuery))
  );
};