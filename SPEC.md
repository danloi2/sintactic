# SPEC.md - Analizador Morfosintáctico Interactivo

## 1. Visión General

**Nombre del proyecto**: Sintactic - Analizador Morfosintáctico Interactivo

**Descripción**: Aplicación web moderna para análisis manual e interactivo de oraciones en español, diseñada para estudiantes y profesores de lingüística. Permite tokenizar frases, seleccionar palabras/rangos, asignar etiquetas morfosintácticas y visualizar el análisis de forma visual e intuitiva.

**Usuario objetivo**: Estudiantes de lingística, profesores de español, investigadores en procesamiento del lenguaje natural.

---

## 2. Decisiones Técnicas

### Stack Elegido

| Tecnología | Justificación |
|-------------|----------------|
| **React 19** | Componentes modernos con Server Components-ready, rendimiento optimizado con Concurrent Mode, gran ecosistema |
| **TypeScript 5** | Tipado estructural fuerte esencial para modelo de datos complejo de etiquetas anidadas |
| **Vite 6** | Build tool moderno con HMR instantáneo, optimización ESBuild para producción |
| **Zustand 5** | API minimalista, tipado completo, sin boilerplate, selectores derivados eficientes, perfect para estados complejos |
| **Tailwind CSS 4** | Utility-first, purgue automático, variantes modernas, integración nativa con shadcn/ui |
| **shadcn/ui** | Componentes accesibles, personalizables, copy-paste而非 dependencia, mantenimiento controlado |
| **Radix UI** | Primitivos accesibles para construir componentes propios,輕量級 |
| **dnd-kit** | Solo para reordenación de capas si es necesario, no para selección principal |
| **Zustand persist** | Plugin oficial para persistencia automática con localStorage |
| **UUID** | Para IDs únicos de tokens y etiquetas |

### ¿Por qué no otras opciones?

- **Redux Toolkit**: Boilerplate excesivo para esta complejidad, Zustand es más directo
- **React Query**: No hay fetching de backend en MVP
- **tanstack table**: No es necesario para mostrar tokens
- **Formik/React Hook Form**: No hay formularios tradicionales, el estado es más complejo

---

## 3. Arquitectura de Carpetas

```
sintactic/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
├── public/
│   └── favicon.svg
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── ui/                    # Componentes base shadcn/ui
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── separator.tsx
│   │   │   └── badge.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── analysis/
│   │   │   ├── PhraseInput.tsx
│   │   │   ├── TokenizedPhrase.tsx
│   │   │   ├── Token.tsx
│   │   │   ├── SelectionOverlay.tsx
│   │   │   ├── TagLabel.tsx
│   │   │   └── TagsPanel.tsx
│   │   ├── autocomplete/
│   │   │   ├── Autocomplete.tsx
│   │   │   └── AutocompleteOption.tsx
│   │   └── visualization/
│   │       ├── AnalysisTree.tsx
│   │       └── TagsLegend.tsx
│   ├── hooks/
│   │   ├── useSelection.ts
│   │   ├── useKeyboardNavigation.ts
│   │   ├── useAutocomplete.ts
│   │   └── usePersistence.ts
│   ├── store/
│   │   ├── analysisStore.ts
│   │   ├── tagsStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── token.ts
│   │   ├── tag.ts
│   │   ├── selection.ts
│   │   └── analysis.ts
│   ├── data/
│   │   ├── tags.ts
│   │   └── categories.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   └── tokenizer.ts
│   └── constants/
│       └── index.ts
```

---

## 4. Modelo de Datos TypeScript

### 4.1 Tokens

```typescript
interface Token {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  position: {
    line: number;
    column: number;
  };
}
```

### 4.2 Etiquetas

```typescript
type TagCategory = 'function' | 'phrase' | 'morphology';

interface Tag {
  id: string;
  label: string;
  short: string;
  aliases: string[];
  category: TagCategory;
  color: string;
  description: string;
}
```

### 4.3 Selección

```typescript
type SelectionMode = 'single' | 'range';

interface Selection {
  mode: SelectionMode;
  tokenIds: string[];
  startTokenId: string | null;
  endTokenId: string | null;
}
```

### 4.4 Span (etiqueta aplicada a tokens)

```typescript
interface Span {
  id: string;
  tagId: string;
  tokenIds: string[];
  layer: number;
  createdAt: number;
}
```

### 4.5 Análisis completo

```typescript
interface Analysis {
  id: string;
  phrase: string;
  tokens: Token[];
  spans: Span[];
  currentLayer: number;
  createdAt: number;
  updatedAt: number;
}
```

---

## 5. Sistema de Etiquetas

### 5.1 Funciones Sintácticas

| ID | Label | Short | Aliases | Color |
|---|-------|-------|---------|-------|
| sujeto | Sujeto | Suj | [suj, sujeto] | #8B5CF6 |
| predicado | Predicado | Pred | [pred, predicado] | #EC4899 |
| cd | Complemento Directo | CD | [cd, c.d., od] | #F59E0B |
| ci | Complemento Indirecto | CI | [ci, c.i., oi] | #10B981 |
| atributo | Atributo | Attr | [attr, atributo] | #3B82F6 |
| cp | Complemento Predicativo | CP | [cp, c.p.] | #6366F1 |
| cr | Complemento de Régimen | CR | [cr, c.r.] | #14B8A6 |
| ccl | CCL (Lugar) | CCL | [ccl, lugar] | #F97316 |
| cct | CCT (Tiempo) | CCT | [cct, tiempo] | #84CC46 |
| ccm | CCM (Modo) | CCM | [ccm, modo] | #22D3EE |
| ccc | CCC (Causa) | CCC | [ccc, causa] | #A855F7 |

### 5.2 Sintagmas

| ID | Label | Short | Aliases | Color |
|---|-------|-------|---------|-------|
| sn | Sintagma Nominal | SN | [sn, s.n.] | #EF4444 |
| sv | Sintagma Verbal | SV | [sv, s.v.] | #22C55E |
| sadj | Sintagma Adjetival | SAdj | [sadj, s.adj] | #3B82F6 |
| sadv | Sintagma Adverbial | SAdv | [sadv, s.adv] | #F59E0B |
| sprep | Sintagma Preposicional | SPrep | [sprep, s.prep, sp] | #8B5CF6 |

### 5.3 Morfología

| ID | Label | Short | Aliases | Color |
|---|-------|-------|---------|-------|
| sustantivo | Sustantivo | N | [n, sust, nombre] | #EF4444 |
| verbo | Verbo | V | [v, vrb] | #22C55E |
| adjetivo | Adjetivo | Adj | [adj, adjetivo] | #3B82F6 |
| adverbio | Adverbio | Adv | [adv, adverbio] | #F59E0B |
| pronombre | Pronombre | Pron | [pron, pronombre] | #8B5CF6 |
| determinante | Determinante | Det | [det, determinante, art] | #EC4899 |
| preposicion | Preposición | Prep | [prep, preposicion, pre] | #14B8A6 |
| conjuncion | Conjunción | Conj | [conj, conjuncion, con] | #F97316 |

---

## 6. Estado Global (Zustand)

### 6.1 Análisis Store

```typescript
interface AnalysisStore {
  // Estado
  currentAnalysis: Analysis | null;
  phrase: string;
  tokens: Token[];
  spans: Span[];
  currentLayer: number;
  
  // Acciones
  setPhrase: (phrase: string) => void;
  tokenize: () => void;
  addSpan: (tagId: string, tokenIds: string[]) => void;
  removeSpan: (spanId: string) => void;
  updateSpan: (spanId: string, updates: Partial<Span>) => void;
  setCurrentLayer: (layer: number) => void;
  clearAnalysis: () => void;
}
```

### 6.2 UI Store

```typescript
interface UIStore {
  // Estado
  selectedTokens: string[];
  selectionMode: SelectionMode;
  activeTagId: string | null;
  isTagPanelOpen: boolean;
  isAutocompleteOpen: boolean;
  autocompleteQuery: string;
  highlightedTokens: string[];
  
  // Acciones
  setSelectedTokens: (tokenIds: string[]) => void;
  addToSelection: (tokenId: string) => void;
  removeFromSelection: (tokenId: string) => void;
  toggleTokenSelection: (tokenId: string) => void;
  clearSelection: () => void;
  setActiveTagId: (tagId: string | null) => void;
  setAutocompleteOpen: (open: boolean) => void;
  setAutocompleteQuery: (query: string) => void;
  highlightTokens: (tokenIds: string[]) => void;
  clearHighlights: () => void;
}
```

---

## 7. Componentes Principales

### 7.1 PhraseInput

- Textarea multilínea para entrada de frase
- Tokenización automática en tiempo real
- Placeholder: "Escribe una oración para analizar..."
- Keyboard shortcut: Ctrl/Cmd + Enter para analizar

### 7.2 TokenizedPhrase

- Renderizado de tokens como elementos interactivos
- Espacios preservados entre tokens
- Soporte para selección click, shift+click, drag
- Indicador visual de tokens seleccionados

### 7.3 Token

- Elemento individualmente seleccionable
- Hover state con tooltip de posición
- Click para seleccionar
- Shift+Click para selección en rango
- Visual feedback inmediato

### 7.4 AutocompletePopup

- Aparece al escribir en input de etiqueta
- Filtra etiquetas por alias, label, o descripción
- Navegación con flechas
- Enter para confirmar, Escape para cerrar
- Muestra categoría y color de cada resultado

### 7.5 TagLabel

- Badge mostrando etiqueta asignada
- Color de fondo según categoría
- Click para editar o eliminar
- Animación de entrada/salida

### 7.6 TagsPanel

- Panel lateral derecho
- Lista de todas las etiquetas disponibles
- Agrupadas por categoría
- Búsqueda rápida
- Arrastrar si es necesario

---

## 8. Flujo de Interacción

### 8.1 Flujo Principal

```
1. Usuario escribe oración en PhraseInput
   ↓
2. Sistema tokeniza automáticamente al presionar Ctrl+Enter
   ↓
3. Tokens se renderizan en TokenizedPhrase
   ↓
4. Usuario hace click/shift+click en tokens
   ↓
5. Tokens seleccionados se resaltan
   ↓
6. Usuario escribe en Autocomplete o selecciona de panel
   ↓
7. Span se crea y aplica a tokens seleccionados
   ↓
8. Visualización actualiza con TagLabel sobre tokens
   ↓
9. Guardado automático en localStorage
```

### 8.2 Selección de Texto

| Acción | Comportamiento |
|--------|----------------|
| Click en token | Selecciona solo ese token |
| Shift+Click | Selecciona rango desde último click |
| Ctrl/Cmd+Click | Añade/quita token individual |
| Escape | Limpia selección |

### 8.3 Autocomplete

| Acción | Comportamiento |
|--------|----------------|
| Escribir en input | Filtra etiquetas en tiempo real |
| Flecha abajo/arriba | Navega resultados |
| Enter | Confirma selección |
| Escape | Cierra popup |
| Click fuera | Cierra popup |

---

## 9. UI/UX Design

### 9.1 Paleta de Colores

```css
--background: #0A0A0B;
--foreground: #FAFAFA;
--card: #18181B;
--card-foreground: #FAFAFA;
--popover: #18181B;
--popover-foreground: #FAFAFA;
--primary: #8B5CF6;
--primary-foreground: #FFFFFF;
--secondary: #27272A;
--secondary-foreground: #FAFAFA;
--muted: #27272A;
--muted-foreground: #A1A1AA;
--accent: #27272A;
--accent-foreground: #FAFAFA;
--destructive: #EF4444;
--destructive-foreground: #FFFFFF;
--border: #27272A;
--input: #27272A;
--ring: #8B5CF6;
```

### 9.2 Tipografía

- **Font principal**: JetBrains Mono (para tokens), Inter (para UI)
- **Tamaños**:
  - h1: 2rem (32px)
  - h2: 1.5rem (24px)
  - h3: 1.25rem (20px)
  - body: 0.875rem (14px)
  - small: 0.75rem (12px)

### 9.3 Espaciado

- Base: 4px
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px

### 9.4 Animaciones

- Transiciones: 150ms ease-out
- Hover tokens: scale(1.02), background cambio
- Tag label entry: fade + slide desde arriba
- Autocomplete: fade + scale desde 0.95

---

## 10. Rendimiento

### 10.1 Optimizaciones

- UseMemo para tokens derivados
- UseMemo para etiquetas filtradas
- Selectores Zustand para re-renders mínimos
- CSS containment en tokens
- Virtualización si más de 100 tokens

### 10.2 Limitaciones

- Máximo 500 tokens por análisis
- Máximo 50 spans por capa
- Máximo 10 capas
- Debounce en tokenización: 300ms

---

## 11. Accesibilidad

- ARIA labels en todos los elementos interactivos
- Keyboard navigation completa
- Focus managementvisible
- Soporte para lectores de pantalla
- Contraste WCAG AA mínimo

---

## 12. Responsive

### Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Adaptaciones

- Mobile: Panel de etiquetas en bottom sheet
- Tablet: Layout adaptable
- Desktop: Layout completo con sidebar

---

## 13. Persistencia

### 13.1 Datos a guardar

```typescript
interface PersistedData {
  analyses: Analysis[];
  currentAnalysisId: string | null;
  userPreferences: {
    theme: 'dark' | 'light';
    showShortcuts: boolean;
  };
}
```

### 13.2 Estrategia

- Zustand persist middleware
- Auto-save cada 5 segundos si hay cambios
- Exportación/importación JSON manual
- Clave: 'sintactic-data'

---

## 14. Plan de Implementación por Fases

### Fase 1: MVP (Semana 1)

- [x] Setup de proyecto
- [x] Modelo de datos básica
- [x] PhraseInput con tokenización
- [x] Renderizado de tokens
- [x] Selección básica (click)
- [x] Sistema de etiquetas estático
- [x] Aplicar etiqueta a selección
- [x] Persistencia básica

### Fase 2: Interactividad (Semana 2)

- [ ] Autocomplete con búsqueda
- [ ] Selección con teclado
- [ ] Múltiples etiquetas por token
- [ ] Capas de análisis
- [ ] Panel de etiquetas

### Fase 3: Visualización (Semana 3)

- [ ] Vista de árbol sintáctico
- [ ] Leyenda de colores
- [ ] Exportación a JSON
- [ ] Estadísticas

### Fase 4: Escalabilidad (Semana 4)

- [ ] Sugerencias IA (mock)
- [ ] Modo profesor/alumno
- [ ] Ejercicios
- [ ] Backend preparation

---

## 15. API Externa Futura

La arquitectura está preparada para:

```typescript
interface NLPService {
  analyze(phrase: string): Promise<AnalysisSuggestion[]>;
  suggestTags(phrase: string, tokens: Token[]): Promise<TagSuggestion[]>;
  validateAnalysis(analysis: Analysis): Promise<ValidationResult>;
}
```

Endpoints futuros:
- POST /api/analyze
- POST /api/suggest
- POST /api/validate