# Sintactic 🧠

Sintactic is a professional pedagogical tool for syntactic analysis of Spanish sentences. Designed for educational environments, it facilitates the creation, visualization, and export of syntactic trees through an interactive and visually appealing interface.

## 🌟 Key Features

*   **Hierarchical Layer System**: Strictly regulates grammatical analysis. **Level 1 (Orational)** is exclusively reserved for main functions (Subject and Predicate), smartly displacing any other tags to upper levels.
*   **Dynamic Structure Layer**: Internal structure elements (Nucleus, Det, Adjective, etc.) always float to the highest layer (N+1) to remain close to the text.
*   **Pedagogical Auto-corrections**: Automatic application of fundamental grammatical rules (e.g., if you assign "Subject", it maps to a "Nominal Phrase").
*   **Professional Export**: Download your analyses as high-quality **Images (PNG)** for assignments, or as **JSON** files to resume the analysis later.
*   **Educational Tooltips**: Hover over any tag to read its formal and theoretical description.
*   **Advanced Selection**: Support for multiple token selection via mouse dragging or keyboard shortcuts (`Shift` + Click).

## 🚀 Technologies

*   **React 19** + **TypeScript**
*   **Vite** (Build tool and dev server)
*   **Zustand** (Global state management and persistence)
*   **Tailwind CSS** (Styling and responsive design)
*   **Radix UI** + **Lucide Icons** (Accessible and minimalist components)

## 📦 Installation & Usage

1. **Clone the repository** and install dependencies using `pnpm` (recommended):
   ```bash
   pnpm install
   ```

2. **Start the development server**:
   ```bash
   pnpm run dev
   ```
   The application will be available at `http://localhost:5173`.

3. **Build for production**:
   ```bash
   pnpm run build
   ```

## 🛠️ Code Structure

*   `/src/store/index.ts`: The logical core of the application. Contains the Displacement Rule and state management (Zustand).
*   `/src/components/analysis/`: Main UI components. `TokenizedPhrase.tsx` stands out as it dynamically calculates and renders the syntactic tree.
*   `/src/data/tags.ts`: Dictionary of grammatical tags with their colors, aliases, and theoretical descriptions.
*   `/src/lib/tokenizer.ts`: Logic for splitting sentences into tokens, explicitly ignoring whitespaces to maintain an accurate word count.

## 📝 License

This project is distributed under the MIT License. See the `LICENSE` file for more information.
