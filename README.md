# Sintactic

> A professional, academic-grade tool for interactive syntactic analysis of Spanish sentences.

---

## Overview

**Sintactic** is a pedagogical web application designed for linguistics students, teachers, and researchers. It provides a structured, visual environment for building and exporting hierarchical syntactic trees — directly in the browser or as a native desktop app.

The interface enforces strict grammatical rules automatically, guiding users toward linguistically correct analyses while remaining flexible enough for complex, multi-layer sentence structures.

---

## Features

### 🧠 Intelligent Hierarchical Layers
- **Level 1 (Oracional)** is strictly reserved for main sentence functions: Subject (`SN`) and Predicate (`SV`).
- Assigning a function such as "Subject" automatically maps it to its canonical phrase type, preventing common pedagogical errors.
- Structural elements (Nucleus, Determiner, Adjective, etc.) always float to the highest available layer, keeping them close to the token row for clarity.

### ✏️ Grammar & Spell Checking
- **Native browser spell check** underlines misspelled words in real time (requires Spanish language in your browser/OS).
- **LanguageTool API integration** (free, no key required) performs grammar analysis after a short pause and displays inline error cards with one-click correction suggestions.

### 🎨 Rich Visual Feedback
- Color-coded spans with distinct structural vs. morphological palettes.
- Glassmorphism level indicators (`N1`, `N2`...) stay pinned to the left as you scroll.
- Active layer highlighted with a subtle ring so you always know where you're working.
- Multi-token selection via mouse drag (blue selection rectangle) or keyboard (`Shift` + Click).

### 📤 Export
- **PNG image** — exports only the clean analysis sheet (no level indicators or UI controls).
- **JSON file** — saves the full analysis state for later restoration.
- **Import** — load a previously saved JSON to resume work.

### 📚 Educational Tooltips
Hover over any syntactic tag to read its formal name, grammatical category, and theoretical description.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| Tauri 2 | Desktop application wrapper |
| React 19 + TypeScript | Core UI framework |
| Vite 8 | Build tool and dev server |
| Zustand | Global state management with localStorage persistence |
| Tailwind CSS 4 | Styling and responsive layout |
| Radix UI | Accessible headless components (Tooltip, Dropdown, etc.) |
| Lucide React | Icon library |
| html-to-image | PNG export from DOM nodes |
| LanguageTool API | Free grammar checking (Spanish) |

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- **pnpm** (preferred package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/sintactic.git
cd sintactic

# Install dependencies
pnpm install
```

### Development

```bash
pnpm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

#### Web Bundle (Static Files)
```bash
pnpm run build
```

#### Native Linux Desktop App (Tauri)
```bash
# Generates .AppImage and .deb in src-tauri/target/release/bundle/
pnpm run build:linux
```

Output is placed in the `dist/` directory (for web) and `src-tauri/target/` (for desktop).

### Preview Built Output

```bash
# Preview locally (accessible on local network)
pnpm run preview

# Alias with explicit host flag
pnpm run serve
```

---

## Project Structure

```
src/
├── components/
│   ├── analysis/
│   │   ├── TokenizedPhrase.tsx   # Main analysis canvas (layout orchestration)
│   │   ├── PhraseInput.tsx       # Sentence input with grammar checking
│   │   ├── Token.tsx             # Individual word token
│   │   ├── TagsPanel.tsx         # Sidebar tag browser
│   │   └── parts/
│   │       ├── LayerRow.tsx      # Single analysis layer row
│   │       ├── SyntacticSpan.tsx # Syntactic branch (line/bracket + label)
│   │       ├── LevelIndicator.tsx # Glassmorphism Nx level marker
│   │       └── SelectionBox.tsx  # Mouse drag selection rectangle
│   ├── autocomplete/
│   │   ├── Autocomplete.tsx      # Tag search dialog (Ctrl+E)
│   │   └── FunctionSelector.tsx  # Syntactic function picker
│   ├── layout/
│   │   └── Header.tsx            # App header with export/import actions
│   └── ui/                       # Radix UI primitive wrappers
├── data/
│   └── tags.ts                   # Tag dictionary (labels, colors, descriptions)
├── hooks/
│   └── useSelection.ts           # Mouse drag-to-select logic
├── lib/
│   ├── tokenizer.ts              # Sentence → token array splitting
│   └── utils.ts                  # Tailwind class merging utility
├── store/
│   └── index.ts                  # Zustand stores (analysis + UI state)
└── types/
    └── index.ts                  # Shared TypeScript types
```

---

## How to Use

1. **Enter a sentence** in the input box and click **Analyze** (or press `Enter`).
2. **Select one or more words** by clicking or dragging across them.
3. Press `Ctrl+E` (or right-click) to open the **tag picker**.
4. Choose a syntactic category → optionally assign a **syntactic function**.
5. Use the **level controls** (`N1`, `N2`...) to switch between analysis layers.
6. **Export** your work as a PNG image or JSON file from the header toolbar.

---

## License

This project is distributed under the **MIT License**. See the [`LICENSE`](./LICENSE) file for details.
