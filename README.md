# DevDesk ⚡

> **DevDesk** is a modern, high-performance developer workspace built with React 19, Vite, and Tailwind CSS. It combines an advanced two-way live Markdown Studio, a hierarchical JSON Explorer & Beautifier, and a Git-style JSON Diff Comparator into a unified, distraction-free environment.

---

## ✨ Features Overview

### 📝 1. Markdown Studio

A full-featured Markdown workspace engineered with **two-way live synchronization** between the raw source editor and the rendered preview pane.

- **Editable Preview Pane**:
  - The rendered preview pane is directly editable (`contenteditable`). Any in-place edits (text modifications, table edits, list changes, checkmarks) instantly serialize back to clean Markdown without breaking syntax.
- **LaTeX Math Equations (KaTeX)**:
  - Inline math: `$E = mc^2$`
  - Block/Display math: `$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$`
  - Rendered with KaTeX in real time with an interactive equation card in preview and a formula insertion modal with common templates.
- **Footnotes & Citations**:
  - Full footnote syntax: `[^1]` inline citations and `[^1]: Footnote text` at the document footer.
  - Smooth-scroll bidirectional navigation: clicking an inline footnote reference badge jumps straight to its definition, and clicking the return arrow jumps back.
  - Dedicated footnote insertion dialog via the toolbar `[^]` button.
- **Inline HTML Support**:
  - Renders and preserves HTML tags including `<sub>`, `<sup>`, `<kbd>`, `<mark>`, `<details>`, `<summary>`, `<u>`, and `<span>`.
  - Dedicated subscript (`X₂`) and superscript (`X²`) toolbar buttons with round-trip DOM-to-Markdown preservation.
- **Backslash Character Escaping**:
  - Preceding Markdown symbols with a backslash (e.g., `\# Not a header`, `\*literal asterisk\*`, `\[not a link\]`) treats them as literal characters and preserves escaping across preview edits.
- **MS Word-Style Table Grid**:
  - Interactive 8×8 grid picker in the toolbar to insert Markdown tables with custom row and column counts at the exact cursor position.
- **Link Insertion & Preview "Follow Link" Tooltip**:
  - Link modal with URL and label inputs (auto-captures highlighted text).
  - Hovering or clicking links inside the preview pane displays an accessible floating popover with a **"Follow link"** action that opens links securely in a new browser tab (`target="_blank"`).
- **Image Insertion**:
  - Image insertion modal with image URL and alt text fields, placed right at the cursor.
- **Lists & Checklists**:
  - Multi-line toggling for Bulleted lists (`- `) and Numbered lists (`1. `).
  - Interactive Task lists (`- [ ] ` and `- [x] `) with clickable checkmarks in the preview pane that update the markdown source.
- **Mermaid Diagrams**:
  - Fenced code blocks with `mermaid` syntax automatically render into interactive SVG diagrams (flowcharts, sequence diagrams, class diagrams, etc.).
- **Blockquote Toggle**:
  - Single-click insertion and toggling of blockquotes (`> `) across single or multiple lines.
- **Persistent View Modes**:
  - **Split View**: Side-by-side source editor and editable preview pane.
  - **Editor View**: Focused distraction-free Markdown coding.
  - **Preview View**: Full-width document preview.
  - Zero-unmount architecture: switching view modes retains scroll positions, undo/redo states, and preview DOM state.
- **Export & Utilities**:
  - Copy raw Markdown or rendered HTML.
  - One-click document export (`.md` or `.html`).
  - Real-time word, character, and line counters.

---

### 🔍 2. JSON Explorer & Beautifier

An interactive, visual JSON inspector for debugging, formatting, and inspecting complex payload structures.

- **Hierarchical Tree View**:
  - Deeply nested objects and arrays with expand/collapse toggles.
  - Color-coded depth indentation guides for quick hierarchy scanning.
- **Data Type Badges**:
  - Visual badges identifying node types (`string`, `number`, `boolean`, `null`, `object`, `array`).
- **Hover Copy**:
  - Quick copy button on every node value to copy values directly to the clipboard.
- **Instant Search & Highlight**:
  - Real-time query filtering that highlights matching keys and values.
  - Automatically expands collapsed ancestor branches to reveal query results.
- **Formatting Tools**:
  - Beautify JSON with 2-space indentation, 4-space indentation, or tabs.
  - Minify JSON to single-line strings.
  - Real-time JSON validation with clear syntax error indicators.

---

### 🔀 3. JSON Diff Comparator

A visual diff engine designed to inspect changes between two JSON documents.

- **Git-Style Inline Diff**:
  - Unified line-by-line diff view highlighting additions (`+`, green) and deletions (`-`, red).
- **Deep Object Comparison**:
  - Recursive comparison detecting modified values, missing keys, and added properties across nested hierarchies.
  - Flexible comparison modes: **Full (Keys + Values)** or **Keys Only**.
- **Difference Inspector**:
  - Bottom summary panel displaying every difference with its full JSON path, change type, and before/after values.
- **Utility Actions**:
  - One-click input swap (`A ↔ B`).
  - Beautify inputs.
  - Collapsible diff list with badge counters for additions, deletions, and modifications.

---

## ⌨️ Global Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| <kbd>⌘</kbd> + <kbd>1</kbd> / <kbd>Ctrl</kbd> + <kbd>1</kbd> | Switch to **Markdown Studio** |
| <kbd>⌘</kbd> + <kbd>2</kbd> / <kbd>Ctrl</kbd> + <kbd>2</kbd> | Switch to **JSON Explorer** |
| <kbd>⌘</kbd> + <kbd>3</kbd> / <kbd>Ctrl</kbd> + <kbd>3</kbd> | Switch to **JSON Diff** |
| <kbd>⌘</kbd> + <kbd>\</kbd> / <kbd>Ctrl</kbd> + <kbd>\</kbd> | Collapse / Expand Sidebar |
| <kbd>⌘</kbd> + <kbd>B</kbd> / <kbd>Ctrl</kbd> + <kbd>B</kbd> | Bold selection (in Markdown Editor) |
| <kbd>⌘</kbd> + <kbd>I</kbd> / <kbd>Ctrl</kbd> + <kbd>I</kbd> | Italic selection (in Markdown Editor) |

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Bundler & Tooling**: [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Markdown Parsing**: [Marked](https://marked.js.org/)
- **Math Rendering**: [KaTeX](https://katex.org/)
- **Diagrams**: [Mermaid](https://mermaid.js.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Linter**: [Oxlint](https://oxc.rs/)

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm`, `pnpm`, or `yarn`

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/your-username/dev-desk.git
cd dev-desk
npm install
```

### Development Server

Start the local development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

DevDesk will be running at `http://localhost:5173`.

### Production Build

Compile and bundle the application for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Code Quality & Linting

Run Oxlint to check code quality:

```bash
npm run lint
```

---

## 📁 Project Structure

```text
dev-desk/
├── src/
│   ├── components/
│   │   ├── JsonDiff.jsx         # Git-style JSON comparison engine
│   │   ├── JsonExplorer.jsx     # JSON tree view, search & beautifier
│   │   ├── MarkdownStudio.jsx   # Two-way sync markdown & preview studio
│   │   └── Sidebar.jsx          # Collapsible navigation sidebar
│   ├── App.jsx                  # Main application shell & global shortcuts
│   ├── index.css                # Global design system & KaTeX / Markdown styles
│   └── main.jsx                 # React root mount
├── public/                      # Static assets
├── package.json                 # Project configuration & dependencies
├── vite.config.js               # Vite build configuration
└── README.md                    # Project documentation
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
