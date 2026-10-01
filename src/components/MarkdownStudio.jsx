import React, { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  FolderOpen, Save, FileOutput, FileText as FileTextIcon,
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, FileCode, CheckSquare,
  Image as ImageIcon, Table as TableIcon, Link as LinkIcon, ExternalLink, X,
  RefreshCw, Eye, Edit3, LayoutTemplate,
  Sigma, Superscript, Subscript,
} from 'lucide-react';

// Configure marked
marked.setOptions({ breaks: true, gfm: true });

const DEFAULT_MD = `# Markdown Studio 🚀

Welcome to the fully editable markdown studio. You can edit directly in this preview pane or in the markdown source on the left!

## Headings Demonstration

### Heading Level 3
#### Heading Level 4
##### Heading Level 5
###### Heading Level 6

---

## Rich Text Formatting

This paragraph demonstrates **bold text**, *italic text*, ***bold and italic***, and ~~strikethrough text~~. You can also use \`inline code tokens\` directly within sentences.

Here is a link to [DevDesk Documentation](https://github.com) and an embedded image:

![DevDesk Graphic](https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80)

---

## Math Equations (LaTeX)

Inline math: Mass-energy equivalence is $E = mc^2$, and the Pythagorean theorem is $a^2 + b^2 = c^2$.

Display math equations:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}
$$

---

## Footnotes Demonstration

Footnotes allow citing references[^1] and adding explanatory notes[^math-ref] cleanly.
Click any footnote link in the preview pane to jump directly to its definition below!

---

## Inline HTML Elements

Standard HTML tags can be embedded for advanced typographic and layout control:
- Chemical formulas: H<sub>2</sub>O and Glucose: C<sub>6</sub>H<sub>12</sub>O<sub>6</sub>
- Exponents & Powers: 2<sup>10</sup> = 1024 and 10<sup>6</sup> = 1,000,000
- Keyboard shortcuts: <kbd>Cmd</kbd> + <kbd>K</kbd> or <kbd>Ctrl</kbd> + <kbd>C</kbd>
- Highlighted text: <mark>Important note</mark> for all developers
- Underlined text: <u>Underlined styling</u>

<details>
<summary>Click to view expandable section</summary>

Here is hidden content revealed inside a native \`<details>\` tag!
You can edit directly inside this expandable block.
</details>

---

## Escaping Characters

Preceding markdown characters with a backslash (\\) treats them as literal characters:

\\# This is NOT a heading — it is a literal paragraph starting with a hash.
\\*This text is surrounded by literal asterisks, not italic.\\*
\\[This text is enclosed in brackets, not a markdown link.\\]
\\\`This is surrounded by literal backticks, not inline code.\\\`

---

## Blockquotes

> **Tip:** Every single element in this preview pane is directly editable!
> Try clicking on any text, table cell, or diagram definition to edit it live.

---

## Lists & Task Lists

### Bullet List (Nested)
- Modern Developer Tools
  - Fast JSON Explorer
  - Git-style JSON Diff
- Rich Markdown Preview
  - Two-way Live Sync
  - Mermaid Diagram Support

### Ordered List (Nested)
1. Write or paste your Markdown
2. Edit visually in the preview pane
   1. Click directly on headings or paragraphs
   2. Edit table rows and columns
3. Export to HTML or PDF

### Interactive Task List
- [x] Make preview pane completely editable
- [x] Validate all markdown elements
- [x] Support LaTeX math equations ($inline$ & $$display$$)
- [x] Support Footnotes ([^1] & definitions)
- [x] Support Inline HTML (<sub>, <sup>, <kbd>, <mark>, <details>)
- [x] Support Escaping Characters with backslash (\\#)

---

## Code Blocks

\`\`\`javascript
// Editable JavaScript Code Block
function greetDeveloper(name, tool) {
  const message = \`Welcome \${name} to \${tool}!\`;
  console.log(message);
  return { success: true, timestamp: Date.now() };
}

greetDeveloper('Engineer', 'DevDesk');
\`\`\`

---

## Interactive Table

| Feature | Category | Editable | Status |
| :--- | :---: | :---: | ---: |
| Headings & Paragraphs | Text | ✅ Yes | Production |
| Math Equations (LaTeX) | Math | ✅ Yes | Production |
| Footnotes & References | Citations | ✅ Yes | Production |
| Inline HTML Tags | Layout | ✅ Yes | Production |
| Escaped Characters | Text | ✅ Yes | Production |
| Tables & Cells | Data | ✅ Yes | Production |
| Mermaid Diagrams | Diagrams | ✅ Yes | Production |

---

## Mermaid Diagram

\`\`\`mermaid
graph TD
    A[Edit in Preview] --> B{Parse Live DOM}
    B -->|Convert to MD| C[Update Source Editor]
    C -->|Two-Way Sync| D[Preserve All Elements]
    D --> E[Happy Developer 🎉]
\`\`\`

---

[^1]: Footnotes provide helpful citations and explanations without cluttering the main content.
[^math-ref]: The Gaussian integral $\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$ was first calculated by Carl Friedrich Gauss.
`;

function ToolbarButton({ onClick, title, children, active = false }) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={`flex items-center justify-center w-7 h-7 rounded-md text-xs transition-all duration-150 ${
        active
          ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/30'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/60'
      }`}
    >
      {children}
    </button>
  );
}

function ActionButton({ onClick, icon: Icon, label, title, variant = 'default' }) {
  const styles = {
    default: 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/50 hover:border-slate-600',
    primary: 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/30 hover:border-indigo-500/50',
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${styles[variant]}`}
    >
      <Icon size={13} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ── Pre-process Math & Footnotes before Marked ─────────────────
function preprocessMarkdown(markdown) {
  // 1. Footnotes extraction
  const footnoteDefs = new Map();
  const defRegex = /^\[\^([a-zA-Z0-9_-]+)\]:\s*([\s\S]*?)(?=(?:\n\[\^[a-zA-Z0-9_-]+\]:)|\n\n|$)/gm;
  let text = markdown.replace(defRegex, (m, id, content) => {
    footnoteDefs.set(id, content.trim());
    return '';
  });

  // Replace inline footnote references
  text = text.replace(/\[\^([a-zA-Z0-9_-]+)\]/g, (m, id) => {
    return `<sup class="footnote-ref" data-fn-id="${id}"><a href="#fn-${id}" id="fnref-${id}" class="text-indigo-400 hover:text-indigo-300 font-mono text-[10px] px-1 py-0.5 rounded bg-indigo-950/50 border border-indigo-500/30 font-semibold inline-block cursor-pointer" title="Jump to footnote [${id}]">[${id}]</a></sup>`;
  });

  // 2. Protect display math: $$ formula $$
  const displayMath = [];
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (m, formula) => {
    const idx = displayMath.length;
    displayMath.push(formula.trim());
    return `\n\n<div data-math-block-placeholder="${idx}"></div>\n\n`;
  });

  // 3. Protect inline math: $ formula $
  const inlineMath = [];
  text = text.replace(/(?<!\\)\$([^\s$](?:[^$]*?[^\s$])?)\$(?!\d)/g, (m, formula) => {
    const idx = inlineMath.length;
    inlineMath.push(formula.trim());
    return `<span data-math-inline-placeholder="${idx}"></span>`;
  });

  return { text, displayMath, inlineMath, footnoteDefs };
}

// ── Post-process Math & Footnotes into HTML ────────────────────
function postprocessMarkdown(html, { displayMath, inlineMath, footnoteDefs }) {
  let result = html;

  // 1. Inject display math blocks
  if (displayMath && displayMath.length > 0) {
    displayMath.forEach((formula, idx) => {
      let rendered;
      try {
        rendered = katex.renderToString(formula, { displayMode: true, throwOnError: false });
      } catch (e) {
        rendered = `<span class="text-rose-400">LaTeX Error: ${e.message}</span>`;
      }
      const block =
        `<div class="math-block my-4 rounded-xl overflow-hidden border border-indigo-500/30 bg-slate-950/80 shadow-lg" data-mdtype="math-block">` +
        `<div class="flex items-center justify-between px-3 py-1.5 bg-indigo-950/50 border-b border-indigo-500/20 text-xs font-mono select-none" contenteditable="false">` +
        `<div class="flex items-center gap-2 text-indigo-300 font-semibold"><span class="w-2 h-2 rounded-full bg-violet-400"></span><span>Math Block (LaTeX)</span></div>` +
        `<span class="text-indigo-400/60 text-[11px]">Edit LaTeX below to update</span>` +
        `</div>` +
        `<div class="math-rendered p-4 overflow-x-auto flex justify-center bg-slate-900/40 select-none text-slate-100" contenteditable="false">${rendered}</div>` +
        `<div class="px-3 py-1 bg-slate-900/80 border-t border-slate-800 text-[11px] font-mono text-slate-500 select-none" contenteditable="false">LaTeX Equation (editable):</div>` +
        `<pre class="math-source p-3 m-0 overflow-x-auto text-xs font-mono text-indigo-200 bg-slate-950 outline-none border-t border-slate-800/60" contenteditable="true" spellcheck="false" style="tab-size: 2;">${formula}</pre>` +
        `</div>`;
      result = result.replace(new RegExp(`<p>\\s*<div data-math-block-placeholder="${idx}"></div>\\s*</p>|<div data-math-block-placeholder="${idx}"></div>`, 'g'), block);
    });
  }

  // 2. Inject inline math spans
  if (inlineMath && inlineMath.length > 0) {
    inlineMath.forEach((formula, idx) => {
      let rendered;
      try {
        rendered = katex.renderToString(formula, { displayMode: false, throwOnError: false });
      } catch {
        rendered = `<span class="text-rose-400 font-mono text-xs">$${formula}$</span>`;
      }
      const inline = `<span class="math-inline inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 align-middle" data-mdtype="math-inline" data-latex="${encodeURIComponent(formula)}" title="LaTeX: $${formula}$"><span class="math-rendered select-none" contenteditable="false">${rendered}</span></span>`;
      result = result.replace(new RegExp(`<span data-math-inline-placeholder="${idx}"></span>`, 'g'), inline);
    });
  }

  // 3. Inject footnotes section
  if (footnoteDefs && footnoteDefs.size > 0) {
    const items = [];
    for (const [id, def] of footnoteDefs.entries()) {
      const defHtml = marked.parseInline(def);
      items.push(
        `<li class="footnote-item flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 transition-colors" data-mdtype="footnote-item" data-fn-id="${id}" id="fn-${id}">` +
        `<span class="footnote-label font-mono text-[11px] text-indigo-400 font-semibold select-none pt-0.5" contenteditable="false">[${id}]</span>` +
        `<div class="footnote-content flex-1 text-slate-300 outline-none" contenteditable="true">${defHtml}</div>` +
        `<a href="#fnref-${id}" class="footnote-backref text-indigo-400/80 hover:text-indigo-300 px-1 select-none text-xs" contenteditable="false" title="Jump to reference">↩</a>` +
        `</li>`
      );
    }
    const fnSection =
      `<div class="footnotes-section my-8 pt-4 border-t border-slate-800 text-xs text-slate-400" data-mdtype="footnotes-section">` +
      `<div class="flex items-center gap-1.5 font-semibold text-slate-300 mb-3 select-none" contenteditable="false">` +
      `<span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>` +
      `<span>Footnotes</span>` +
      `</div>` +
      `<ol class="footnotes-list space-y-2 list-none p-0 m-0">${items.join('')}</ol>` +
      `</div>`;
    result += fnSection;
  }

  return result;
}

// ── Mermaid renderer (runs FIRST on raw marked HTML) ──────────
async function renderMermaid(html) {
  const mermaidRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;
  const matches = [...html.matchAll(mermaidRegex)];
  if (matches.length === 0) return html;

  try {
    const mermaid = (await import('mermaid')).default;
    mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });

    let result = html;
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const code = match[1]
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

      try {
        const id = `mermaid-${Date.now()}-${i}`;
        const { svg } = await mermaid.render(id, code);
        result = result.replace(match[0],
          `<div class="mermaid-block my-4 rounded-xl overflow-hidden border border-indigo-500/30 bg-slate-950/80 shadow-lg" data-mdtype="mermaid-block">` +
          `<div class="flex items-center justify-between px-3 py-1.5 bg-indigo-950/50 border-b border-indigo-500/20 text-xs font-mono select-none" contenteditable="false">` +
          `<div class="flex items-center gap-2 text-indigo-300 font-semibold"><span class="w-2 h-2 rounded-full bg-indigo-400"></span><span>Mermaid Diagram</span></div>` +
          `<span class="text-indigo-400/60 text-[11px]">Edit definition below to update</span>` +
          `</div>` +
          `<div class="mermaid-svg-wrap p-4 overflow-x-auto flex justify-center bg-slate-900/40 select-none" contenteditable="false">${svg}</div>` +
          `<div class="px-3 py-1 bg-slate-900/80 border-t border-slate-800 text-[11px] font-mono text-slate-500 select-none" contenteditable="false">Diagram Definition (editable):</div>` +
          `<pre class="mermaid-source p-3 m-0 overflow-x-auto text-xs font-mono text-indigo-200 bg-slate-950 outline-none border-t border-slate-800/60" contenteditable="true" spellcheck="false" style="tab-size: 2;">${code}</pre>` +
          `</div>`
        );
      } catch (e) {
        result = result.replace(match[0],
          `<div class="mermaid-block my-4 rounded-xl overflow-hidden border border-rose-500/40 bg-slate-950/80" data-mdtype="mermaid-block">` +
          `<div class="flex items-center justify-between px-3 py-1.5 bg-rose-950/40 border-b border-rose-500/20 text-xs font-mono select-none" contenteditable="false">` +
          `<span class="text-rose-400 font-semibold">⚠️ Mermaid Syntax Error</span>` +
          `<span class="text-rose-400/60 text-[11px]">${e.message || 'Check syntax'}</span>` +
          `</div>` +
          `<pre class="mermaid-source p-3 m-0 overflow-x-auto text-xs font-mono text-indigo-200 bg-slate-950 outline-none" contenteditable="true" spellcheck="false">${code}</pre>` +
          `</div>`
        );
      }
    }
    return result;
  } catch { return html; }
}

// ── Mark code blocks and tables as protected containers ──────────
function protectSpecialBlocks(html) {
  // 1. Code blocks (excluding mermaid)
  html = html.replace(/<pre><code(?: class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g, (full, lang, content) => {
    if (lang === 'mermaid') return full;
    const decoded = content
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    return (
      `<div class="code-block-wrap my-4 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-md" data-mdtype="code-block" data-lang="${lang || ''}">` +
      `<div class="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400 select-none" contenteditable="false">` +
      `<div class="flex items-center gap-1.5">` +
      `<span class="w-2.5 h-2.5 rounded-full bg-rose-500/70 inline-block"></span>` +
      `<span class="w-2.5 h-2.5 rounded-full bg-amber-500/70 inline-block"></span>` +
      `<span class="w-2.5 h-2.5 rounded-full bg-emerald-500/70 inline-block"></span>` +
      `<span class="text-indigo-400 font-semibold uppercase tracking-wider text-[11px] ml-1.5">${lang || 'code'}</span>` +
      `</div>` +
      `<span class="text-slate-500 text-[11px]">editable code block</span>` +
      `</div>` +
      `<pre class="code-content p-3.5 m-0 overflow-x-auto text-sm font-mono text-slate-200 outline-none" contenteditable="true" spellcheck="false" style="tab-size: 2;">${decoded}</pre>` +
      `</div>`
    );
  });

  // 2. Tables with interactive row/col controls
  html = html.replace(/<table[\s\S]*?<\/table>/g, (match) => {
    return (
      `<div class="table-wrap my-4 rounded-lg overflow-hidden border border-slate-800 bg-slate-900/30" data-mdtype="table-wrap">` +
      `<div class="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 select-none" contenteditable="false">` +
      `<span class="font-semibold text-slate-300">Table (editable cells)</span>` +
      `<div class="flex items-center gap-1.5">` +
      `<button class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs transition" data-action="add-row" title="Add Row">+ Row</button>` +
      `<button class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs transition" data-action="add-col" title="Add Column">+ Col</button>` +
      `<button class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 text-xs transition" data-action="del-row" title="Delete Row">- Row</button>` +
      `<button class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 text-xs transition" data-action="del-col" title="Delete Column">- Col</button>` +
      `</div>` +
      `</div>` +
      `<div class="overflow-x-auto p-2">${match}</div>` +
      `</div>`
    );
  });

  // 3. Task checkboxes
  html = html.replace(/<input([^>]*?)disabled=""([^>]*?)type="checkbox"/g, '<input$1$2type="checkbox" class="task-checkbox"');
  html = html.replace(/<input([^>]*?)disabled([^>]*?)type="checkbox"/g, '<input$1$2type="checkbox" class="task-checkbox"');
  html = html.replace(/<input([^>]*?)type="checkbox"([^>]*?)disabled=""/g, '<input$1type="checkbox"$2 class="task-checkbox"');
  html = html.replace(/<input([^>]*?)type="checkbox"([^>]*?)disabled/g, '<input$1type="checkbox"$2 class="task-checkbox"');

  return html;
}

// ── Inline DOM nodes to Markdown helper ────────────────────────
function inlineDomToMarkdown(node) {
  const buf = [];
  function walk(n) {
    if (n.nodeType === Node.TEXT_NODE) {
      buf.push(n.textContent.replace(/\|/g, '\\|'));
      return;
    }
    if (n.nodeType !== Node.ELEMENT_NODE) return;
    const tag = n.tagName.toLowerCase();
    const mdType = n.dataset && n.dataset.mdtype;

    if (mdType === 'math-inline') {
      buf.push('$' + decodeURIComponent(n.dataset.latex || '') + '$');
      return;
    }
    if (tag === 'sup' && n.dataset.fnId) {
      buf.push(`[^${n.dataset.fnId}]`);
      return;
    }

    switch (tag) {
      case 'strong': case 'b': {
        const text = inlineDomToMarkdown(n).trim();
        if (text) buf.push(`**${text}**`);
        break;
      }
      case 'em': case 'i': {
        const text = inlineDomToMarkdown(n).trim();
        if (text) buf.push(`*${text}*`);
        break;
      }
      case 'del': case 's': case 'strike': {
        const text = inlineDomToMarkdown(n).trim();
        if (text) buf.push(`~~${text}~~`);
        break;
      }
      case 'code':
        buf.push('`' + n.textContent.replace(/`/g, '\\`').replace(/\|/g, '\\|') + '`');
        break;
      case 'a': {
        const text = inlineDomToMarkdown(n).trim() || n.getAttribute('href') || 'link';
        buf.push(`[${text}](${n.getAttribute('href') || ''})`);
        break;
      }
      case 'img':
        buf.push(`![${n.getAttribute('alt') || ''}](${n.getAttribute('src') || ''})`);
        break;
      case 'br':
        buf.push('<br>');
        break;
      case 'sub':
        buf.push(`<sub>${inlineDomToMarkdown(n).trim()}</sub>`);
        break;
      case 'sup':
        buf.push(`<sup>${inlineDomToMarkdown(n).trim()}</sup>`);
        break;
      case 'kbd':
        buf.push(`<kbd>${n.textContent.trim()}</kbd>`);
        break;
      case 'mark':
        buf.push(`<mark>${inlineDomToMarkdown(n).trim()}</mark>`);
        break;
      case 'u':
        buf.push(`<u>${inlineDomToMarkdown(n).trim()}</u>`);
        break;
      case 'span': {
        const style = n.getAttribute('style');
        if (style) {
          buf.push(`<span style="${style}">${inlineDomToMarkdown(n).trim()}</span>`);
        } else {
          n.childNodes.forEach(walk);
        }
        break;
      }
      default:
        n.childNodes.forEach(walk);
        break;
    }
  }
  node.childNodes.forEach(walk);
  return buf.join('').replace(/\r?\n/g, ' ').trim();
}

// ── Convert <table> DOM element to GFM table string ──────────
function tableElToMarkdown(tableEl) {
  const trs = [...tableEl.querySelectorAll('tr')];
  if (!trs.length) return '';

  const rowCells = trs.map(tr => [...tr.querySelectorAll('th, td')]);
  const numCols = Math.max(...rowCells.map(cells => cells.length));
  if (numCols === 0) return '';

  const headerCells = rowCells[0];
  const aligns = Array.from({ length: numCols }, (_, i) => {
    const cell = headerCells[i];
    if (!cell) return '---';
    const align = (cell.getAttribute('align') || cell.style.textAlign || '').toLowerCase();
    if (align === 'center') return ':---:';
    if (align === 'right') return '---:';
    return '---';
  });

  const lines = [];

  // Header row
  const headerLine = '| ' + Array.from({ length: numCols }, (_, i) => {
    const cell = headerCells[i];
    return cell ? inlineDomToMarkdown(cell) : '';
  }).join(' | ') + ' |';
  lines.push(headerLine);

  // Separator row
  lines.push('| ' + aligns.join(' | ') + ' |');

  // Body rows
  for (let r = 1; r < rowCells.length; r++) {
    const cells = rowCells[r];
    const rowLine = '| ' + Array.from({ length: numCols }, (_, i) => {
      const cell = cells[i];
      return cell ? inlineDomToMarkdown(cell) : '';
    }).join(' | ') + ' |';
    lines.push(rowLine);
  }

  return lines.join('\n');
}

// ── Convert List elements (ul / ol) to Markdown with indentation
function listToMarkdown(listEl, indent = '') {
  const isOrdered = listEl.tagName.toLowerCase() === 'ol';
  const start = parseInt(listEl.getAttribute('start') || '1', 10);
  const items = [...listEl.children].filter(c => c.tagName.toLowerCase() === 'li');
  const buf = [];

  items.forEach((li, idx) => {
    const bullet = isOrdered ? `${start + idx}. ` : '- ';

    // Check for GFM task list checkbox
    const checkbox = li.querySelector(':scope > input[type="checkbox"]');
    const checkStr = checkbox ? (checkbox.checked ? '[x] ' : '[ ] ') : '';

    const textParts = [];
    const nestedLists = [];

    li.childNodes.forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const cTag = child.tagName.toLowerCase();
        if (cTag === 'input' && child.type === 'checkbox') return;
        if (cTag === 'ul' || cTag === 'ol') {
          nestedLists.push(child);
          return;
        }
      }
      if (child.nodeType === Node.TEXT_NODE) {
        textParts.push(child.textContent);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const cTag = child.tagName.toLowerCase();
        switch (cTag) {
          case 'strong': case 'b': {
            const t = child.textContent.trim();
            if (t) textParts.push(`**${t}**`);
            break;
          }
          case 'em': case 'i': {
            const t = child.textContent.trim();
            if (t) textParts.push(`*${t}*`);
            break;
          }
          case 'del': case 's': case 'strike': {
            const t = child.textContent.trim();
            if (t) textParts.push(`~~${t}~~`);
            break;
          }
          case 'code':
            textParts.push('`' + child.textContent.replace(/`/g, '\\`') + '`');
            break;
          case 'a':
            textParts.push(`[${child.textContent.trim() || 'link'}](${child.getAttribute('href') || ''})`);
            break;
          default:
            textParts.push(child.textContent);
            break;
        }
      }
    });

    const itemText = textParts.join('').replace(/\s+/g, ' ').trim();
    buf.push(`${indent}${bullet}${checkStr}${itemText}`);

    // Process nested lists with 2-space indentation
    nestedLists.forEach(nestedList => {
      buf.push(listToMarkdown(nestedList, indent + '  '));
    });
  });

  return buf.join('\n');
}

// Helper: insert a block element at range inside preview root safely
function insertBlockAtRange(range, blockNode, previewRoot) {
  let node = range.startContainer;
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode;
  }

  // Walk up until direct child of previewRoot
  while (node && node.parentNode && node.parentNode !== previewRoot) {
    node = node.parentNode;
  }

  if (node && node.parentNode === previewRoot) {
    if (!node.textContent.trim()) {
      previewRoot.replaceChild(blockNode, node);
    } else {
      node.after(blockNode);
    }
  } else {
    range.deleteContents();
    range.insertNode(blockNode);
  }
}

// ── DOM → Markdown (walks live DOM, respects data-mdtype) ─────
function domToMarkdown(root) {
  const buf = [];

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      buf.push(node.textContent);
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node;
    const tag = el.tagName.toLowerCase();
    const mdType = el.dataset && el.dataset.mdtype;

    // Special protected blocks
    if (mdType) {
      if (mdType === 'mermaid-block') {
        const pre = el.querySelector('pre.mermaid-source');
        const src = pre ? (pre.innerText || pre.textContent || '') : '';
        const clean = src.replace(/^\n+/, '').replace(/\s+$/, '');
        buf.push('\n\n```mermaid\n' + clean + '\n```\n\n');
        return;
      }
      if (mdType === 'code-block') {
        const lang = el.dataset.lang || '';
        const pre = el.querySelector('pre.code-content') || el.querySelector('pre');
        const src = pre ? (pre.innerText || pre.textContent || '') : '';
        const clean = src.replace(/^\n+/, '').replace(/\s+$/, '');
        buf.push('\n\n' + (lang ? '```' + lang + '\n' : '```\n') + clean + '\n```\n\n');
        return;
      }
      if (mdType === 'table-wrap') {
        const tbl = el.querySelector('table');
        if (tbl) {
          buf.push('\n\n' + tableElToMarkdown(tbl) + '\n\n');
        }
        return;
      }
      if (mdType === 'math-block') {
        const pre = el.querySelector('pre.math-source') || el.querySelector('pre');
        const src = pre ? (pre.innerText || pre.textContent || '') : '';
        buf.push('\n\n$$\n' + src.trim() + '\n$$\n\n');
        return;
      }
      if (mdType === 'footnotes-section') {
        const items = el.querySelectorAll('li[data-mdtype="footnote-item"]');
        if (items.length > 0) {
          buf.push('\n\n');
          items.forEach(item => {
            const fnId = item.dataset.fnId;
            const contentEl = item.querySelector('.footnote-content');
            const contentText = contentEl ? inlineDomToMarkdown(contentEl) : '';
            buf.push(`[^${fnId}]: ${contentText}\n`);
          });
          buf.push('\n');
        }
        return;
      }
      if (mdType === 'math-inline') {
        buf.push('$' + decodeURIComponent(el.dataset.latex || '') + '$');
        return;
      }
    }

    if (tag === 'sup' && el.dataset.fnId) {
      buf.push(`[^${el.dataset.fnId}]`);
      return;
    }

    // Ignore contenteditable="false" helper UI
    if (el.getAttribute('contenteditable') === 'false') {
      return;
    }

    // Standard markdown elements
    switch (tag) {
      case 'h1': buf.push('\n\n# ');    walkChildren(el); buf.push('\n\n'); break;
      case 'h2': buf.push('\n\n## ');   walkChildren(el); buf.push('\n\n'); break;
      case 'h3': buf.push('\n\n### ');  walkChildren(el); buf.push('\n\n'); break;
      case 'h4': buf.push('\n\n#### '); walkChildren(el); buf.push('\n\n'); break;
      case 'h5': buf.push('\n\n##### ');walkChildren(el); buf.push('\n\n'); break;
      case 'h6': buf.push('\n\n###### ');walkChildren(el); buf.push('\n\n'); break;
      case 'p': {
        buf.push('\n\n');
        let text = walkChildrenToText(el);
        text = text.split('\n').map(line => {
          if (/^#{1,6}\s/.test(line) || /^[>]\s/.test(line) || /^[-*+]\s/.test(line) || /^\d+\.\s/.test(line)) {
            return '\\' + line;
          }
          return line;
        }).join('\n');
        buf.push(text);
        buf.push('\n\n');
        break;
      }
      case 'br': buf.push('\n'); break;

      case 'strong': case 'b': {
        const text = walkChildrenToText(el).trim();
        if (text) buf.push(`**${text}**`);
        break;
      }
      case 'em': case 'i': {
        const text = walkChildrenToText(el).trim();
        if (text) buf.push(`*${text}*`);
        break;
      }
      case 'del': case 's': case 'strike': {
        const text = walkChildrenToText(el).trim();
        if (text) buf.push(`~~${text}~~`);
        break;
      }
      case 'code': {
        if (el.closest('pre')) {
          walkChildren(el);
          break;
        }
        buf.push('`' + el.textContent.replace(/`/g, '\\`') + '`');
        break;
      }
      case 'blockquote': {
        const innerText = walkChildrenToText(el).trim();
        if (!innerText) {
          break;
        }
        buf.push('\n\n');
        const quoted = innerText.split('\n').map(l => l.trim() ? `> ${l}` : '>').join('\n');
        buf.push(quoted + '\n\n');
        break;
      }
      case 'ul': case 'ol': {
        if (el.parentElement && el.parentElement.tagName.toLowerCase() === 'li') {
          break;
        }
        buf.push('\n\n' + listToMarkdown(el, '') + '\n\n');
        break;
      }
      case 'li': {
        walkChildren(el);
        break;
      }
      case 'a': {
        const text = walkChildrenToText(el).trim() || el.getAttribute('href') || 'link';
        const href = el.getAttribute('href') || '';
        const title = el.getAttribute('title');
        buf.push(`[${text}](${href}${title ? ` "${title}"` : ''})`);
        break;
      }
      case 'img': {
        const alt = el.getAttribute('alt') || '';
        const src = el.getAttribute('src') || '';
        const title = el.getAttribute('title');
        buf.push(`![${alt}](${src}${title ? ` "${title}"` : ''})`);
        break;
      }
      case 'hr': {
        buf.push('\n\n---\n\n');
        break;
      }
      case 'table': {
        buf.push('\n\n' + tableElToMarkdown(el) + '\n\n');
        break;
      }
      case 'details': {
        const summary = el.querySelector('summary');
        const summaryText = summary ? walkChildrenToText(summary) : 'Details';
        const clone = el.cloneNode(true);
        const cloneSummary = clone.querySelector('summary');
        if (cloneSummary) cloneSummary.remove();
        const bodyText = walkChildrenToText(clone).trim();
        buf.push(`\n\n<details>\n<summary>${summaryText}</summary>\n\n${bodyText}\n</details>\n\n`);
        break;
      }
      case 'sub': buf.push(`<sub>${walkChildrenToText(el)}</sub>`); break;
      case 'sup': buf.push(`<sup>${walkChildrenToText(el)}</sup>`); break;
      case 'kbd': buf.push(`<kbd>${el.textContent}</kbd>`); break;
      case 'mark': buf.push(`<mark>${walkChildrenToText(el)}</mark>`); break;
      case 'u': buf.push(`<u>${walkChildrenToText(el)}</u>`); break;
      default: {
        walkChildren(el);
        break;
      }
    }
  }

  function walkChildren(parent) {
    parent.childNodes.forEach(child => walk(child));
  }

  function walkChildrenToText(parent) {
    const subBuf = [];
    function subWalk(n) {
      if (n.nodeType === Node.TEXT_NODE) {
        subBuf.push(n.textContent);
        return;
      }
      if (n.nodeType !== Node.ELEMENT_NODE) return;
      const tag = n.tagName.toLowerCase();
      const mdType = n.dataset && n.dataset.mdtype;

      if (mdType === 'math-inline') {
        subBuf.push('$' + decodeURIComponent(n.dataset.latex || '') + '$');
        return;
      }
      if (tag === 'sup' && n.dataset.fnId) {
        subBuf.push(`[^${n.dataset.fnId}]`);
        return;
      }

      switch (tag) {
        case 'strong': case 'b': {
          const t = walkChildrenToText(n).trim();
          if (t) subBuf.push(`**${t}**`);
          break;
        }
        case 'em': case 'i': {
          const t = walkChildrenToText(n).trim();
          if (t) subBuf.push(`*${t}*`);
          break;
        }
        case 'del': case 's': case 'strike': {
          const t = walkChildrenToText(n).trim();
          if (t) subBuf.push(`~~${t}~~`);
          break;
        }
        case 'code':
          subBuf.push('`' + n.textContent.replace(/`/g, '\\`') + '`');
          break;
        case 'a': {
          const t = walkChildrenToText(n).trim() || n.getAttribute('href') || 'link';
          subBuf.push(`[${t}](${n.getAttribute('href') || ''})`);
          break;
        }
        case 'br':
          subBuf.push('\n');
          break;
        case 'sub':
          subBuf.push(`<sub>${walkChildrenToText(n)}</sub>`);
          break;
        case 'sup':
          subBuf.push(`<sup>${walkChildrenToText(n)}</sup>`);
          break;
        case 'kbd':
          subBuf.push(`<kbd>${n.textContent}</kbd>`);
          break;
        case 'mark':
          subBuf.push(`<mark>${walkChildrenToText(n)}</mark>`);
          break;
        case 'u':
          subBuf.push(`<u>${walkChildrenToText(n)}</u>`);
          break;
        case 'span': {
          const style = n.getAttribute('style');
          if (style) {
            subBuf.push(`<span style="${style}">${walkChildrenToText(n)}</span>`);
          } else {
            n.childNodes.forEach(subWalk);
          }
          break;
        }
        default:
          n.childNodes.forEach(subWalk);
          break;
      }
    }
    parent.childNodes.forEach(subWalk);
    return subBuf.join('');
  }

  root.childNodes.forEach(child => walk(child));

  return buf.join('').replace(/\n{3,}/g, '\n\n').trim();
}

export default function MarkdownStudio() {
  const [source, setSource] = useState(DEFAULT_MD);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [viewMode, setViewMode] = useState('split');
  const [fileHandle, setFileHandle] = useState(null);
  const [fileName, setFileName] = useState('untitled.md');
  const [isRendering, setIsRendering] = useState(false);

  // Format bar popover states
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [tableHoverGrid, setTableHoverGrid] = useState({ rows: 3, cols: 3 });

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  // Link modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Math modal state
  const [showMathModal, setShowMathModal] = useState(false);
  const [mathType, setMathType] = useState('inline'); // 'inline' | 'block'
  const [mathFormula, setMathFormula] = useState('');

  // Link tooltip state (for preview pane clicks)
  const [linkTooltip, setLinkTooltip] = useState({
    visible: false,
    url: '',
    linkText: '',
    top: 0,
    left: 0,
  });

  const sourceRef             = useRef(null);
  const previewRef            = useRef(null);
  const tablePickerRef        = useRef(null);
  const renderTimeoutRef      = useRef(null);
  const syncingRef            = useRef(null);
  const isPreviewFocusedRef   = useRef(false);
  const lastSourceFromPreview = useRef(null);

  // ── Precision Cursor & Selection Tracking ────────────────────
  const savedSelectionRef = useRef({
    pane: 'source', // 'source' or 'preview'
    textareaRange: { start: 0, end: 0 },
    previewRange: null,
  });

  const recordSelection = useCallback(() => {
    const ta = sourceRef.current;
    if (document.activeElement === ta) {
      savedSelectionRef.current = {
        pane: 'source',
        textareaRange: { start: ta.selectionStart ?? 0, end: ta.selectionEnd ?? 0 },
        previewRange: null,
      };
      return;
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && previewRef.current && previewRef.current.contains(sel.anchorNode)) {
      savedSelectionRef.current = {
        pane: 'preview',
        textareaRange: null,
        previewRange: sel.getRangeAt(0).cloneRange(),
      };
      return;
    }

    if (savedSelectionRef.current.pane === 'preview' && savedSelectionRef.current.previewRange) {
      return;
    }
    if (ta) {
      savedSelectionRef.current = {
        pane: 'source',
        textareaRange: { start: ta.selectionStart ?? 0, end: ta.selectionEnd ?? 0 },
        previewRange: null,
      };
    }
  }, []);

  // Update cursor position continuously
  useEffect(() => {
    const handleSelectionChange = () => {
      const ta = sourceRef.current;
      if (document.activeElement === ta) {
        savedSelectionRef.current = {
          pane: 'source',
          textareaRange: { start: ta.selectionStart ?? 0, end: ta.selectionEnd ?? 0 },
          previewRange: null,
        };
        return;
      }
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && previewRef.current && previewRef.current.contains(sel.anchorNode)) {
        savedSelectionRef.current = {
          pane: 'preview',
          textareaRange: null,
          previewRange: sel.getRangeAt(0).cloneRange(),
        };
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  // Close table picker & link tooltip on outside click or scroll
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tablePickerRef.current && !tablePickerRef.current.contains(e.target)) {
        setShowTablePicker(false);
      }
      if (linkTooltip.visible && !e.target.closest('.link-tooltip-popover') && !e.target.closest('a')) {
        setLinkTooltip(prev => ({ ...prev, visible: false }));
      }
    };
    const handleScroll = (e) => {
      if (linkTooltip.visible && !e.target.closest?.('.link-tooltip-popover')) {
        setLinkTooltip(prev => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [linkTooltip.visible, showTablePicker]);

  // ── Render Markdown Pipeline ──────────────────────────────────
  const renderMarkdown = useCallback(async (md) => {
    setIsRendering(true);
    try {
      const { text: processedMd, displayMath, inlineMath, footnoteDefs } = preprocessMarkdown(md);
      const rawHtml     = marked.parse(processedMd);
      const withMermaid = await renderMermaid(rawHtml);
      const withSpecial = protectSpecialBlocks(withMermaid);
      const finalHtml   = postprocessMarkdown(withSpecial, { displayMath, inlineMath, footnoteDefs });
      setRenderedHtml(finalHtml);
    } catch (e) {
      setRenderedHtml(`<p class="text-rose-400">Render error: ${e.message}</p>`);
    } finally {
      setIsRendering(false);
    }
  }, []);

  useEffect(() => {
    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => renderMarkdown(source), 300);
    return () => clearTimeout(renderTimeoutRef.current);
  }, [source, renderMarkdown]);

  // ── Write preview DOM imperatively ────────────────────────────
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || !renderedHtml) return;

    if (isPreviewFocusedRef.current) return;
    if (source === lastSourceFromPreview.current && preview.innerHTML) return;

    preview.innerHTML = renderedHtml;
  }, [renderedHtml, source, viewMode]);

  // ── Scroll sync ──────────────────────────────────────────────
  useEffect(() => {
    const editor  = sourceRef.current;
    const preview = previewRef.current;
    if (!editor || !preview || viewMode !== 'split') return;

    const onEditorScroll = () => {
      if (syncingRef.current === 'preview') return;
      syncingRef.current = 'editor';
      const pct = editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
      preview.scrollTop = pct * (preview.scrollHeight - preview.clientHeight);
      requestAnimationFrame(() => { syncingRef.current = null; });
    };
    const onPreviewScroll = () => {
      setLinkTooltip(prev => prev.visible ? { ...prev, visible: false } : prev);
      if (syncingRef.current === 'editor') return;
      syncingRef.current = 'preview';
      const pct = preview.scrollTop / (preview.scrollHeight - preview.clientHeight || 1);
      editor.scrollTop = pct * (editor.scrollHeight - editor.clientHeight);
      requestAnimationFrame(() => { syncingRef.current = null; });
    };

    editor.addEventListener('scroll', onEditorScroll, { passive: true });
    preview.addEventListener('scroll', onPreviewScroll, { passive: true });
    return () => {
      editor.removeEventListener('scroll', onEditorScroll);
      preview.removeEventListener('scroll', onPreviewScroll);
    };
  }, [viewMode, renderedHtml]);

  // ── File System Access API ───────────────────────────────────
  const handleOpen = useCallback(async () => {
    try {
      if ('showOpenFilePicker' in window) {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown'] } }],
        });
        const file = await handle.getFile();
        const text = await file.text();
        lastSourceFromPreview.current = null;
        setSource(text);
        setFileHandle(handle);
        setFileName(file.name);
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,text/markdown';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const text = await file.text();
          lastSourceFromPreview.current = null;
          setSource(text);
          setFileName(file.name);
        };
        input.click();
      }
    } catch (e) { if (e.name !== 'AbortError') console.error('Open error:', e); }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      if (fileHandle) {
        const w = await fileHandle.createWritable();
        await w.write(source); await w.close();
      } else if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
        });
        const w = await handle.createWritable();
        await w.write(source); await w.close();
        setFileHandle(handle);
        setFileName((await handle.getFile()).name);
      } else {
        const blob = new Blob([source], { type: 'text/markdown' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = fileName; a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) { if (e.name !== 'AbortError') console.error('Save error:', e); }
  }, [fileHandle, fileName, source]);

  // ── Keyboard shortcuts ───────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 's') { e.preventDefault(); handleSave(); }
        if (e.key === 'o') { e.preventDefault(); handleOpen(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave, handleOpen]);

  const handleExportHTML = () => {
    const html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>${fileName.replace('.md', '')}</title>\n  <style>\n    body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}\n    pre{background:#f5f5f5;padding:1em;border-radius:6px;overflow-x:auto}\n    code{background:#f0f0f0;padding:2px 5px;border-radius:3px}\n    blockquote{border-left:4px solid #ddd;margin:0;padding-left:1em;color:#666}\n    table{border-collapse:collapse;width:100%}\n    th,td{border:1px solid #ddd;padding:8px 12px}\n    th{background:#f5f5f5}\n  </style>\n</head>\n<body>${renderedHtml}</body>\n</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = fileName.replace('.md', '.html'); a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const pw = window.open('', '_blank');
    pw.document.write(`<!DOCTYPE html><html><head><style>body{font-family:system-ui;max-width:800px;margin:40px auto;line-height:1.6}pre{background:#f5f5f5;padding:1em;border-radius:4px}code{background:#f0f0f0;padding:2px 4px;border-radius:3px}@media print{body{margin:0}}</style></head><body>${renderedHtml}</body></html>`);
    pw.document.close(); pw.focus();
    setTimeout(() => { pw.print(); pw.close(); }, 500);
  };

  // ── Preview editing handlers ─────────────────────────────────
  const handlePreviewFocus = useCallback(() => {
    isPreviewFocusedRef.current = true;
    savedSelectionRef.current.pane = 'preview';
    recordSelection();
  }, [recordSelection]);

  const handlePreviewBlur = useCallback((e) => {
    if (previewRef.current && e.relatedTarget && previewRef.current.contains(e.relatedTarget)) {
      return;
    }
    isPreviewFocusedRef.current = false;
    if (previewRef.current) {
      const md = domToMarkdown(previewRef.current);
      if (md.trim()) {
        lastSourceFromPreview.current = md;
        setSource(md);
        renderMarkdown(md);
      }
    }
  }, [renderMarkdown]);

  const handlePreviewInput = useCallback(() => {
    if (!previewRef.current) return;
    const md = domToMarkdown(previewRef.current);
    if (md.trim()) {
      lastSourceFromPreview.current = md;
      setSource(md);
    }
  }, []);

  // Backspace handler: delete empty blockquotes cleanly
  const handlePreviewKeyDown = useCallback((e) => {
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const node = sel.anchorNode;
      const el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
      const bq = el?.closest('blockquote');
      if (bq) {
        const text = bq.textContent.trim();
        if (!text) {
          e.preventDefault();
          const p = document.createElement('p');
          p.innerHTML = '<br>';
          bq.parentNode?.replaceChild(p, bq);
          const range = document.createRange();
          range.setStart(p, 0);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          handlePreviewInput();
        }
      }
    }
  }, [handlePreviewInput]);

  // Handle link clicks (show tooltip with 'Follow link') & table buttons & checkboxes
  const handlePreviewClick = useCallback((e) => {
    const link = e.target.closest('a');
    if (link) {
      e.preventDefault();
      const href = link.getAttribute('href') || '';

      // Footnote jump (in-page anchor)
      if (href.startsWith('#fn-') || href.startsWith('#fnref-')) {
        const targetId = href.slice(1);
        const targetEl = previewRef.current?.querySelector(`[id="${targetId}"]`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          targetEl.classList.add('bg-indigo-500/30');
          setTimeout(() => targetEl.classList.remove('bg-indigo-500/30'), 1500);
        }
        return;
      }

      const rect = link.getBoundingClientRect();
      setLinkTooltip({
        visible: true,
        url: href,
        linkText: link.textContent || href,
        top: rect.bottom + 6,
        left: Math.max(10, Math.min(rect.left, window.innerWidth - 320)),
      });
      return;
    } else {
      setLinkTooltip(prev => prev.visible ? { ...prev, visible: false } : prev);
    }

    if (e.target.matches('input[type="checkbox"]')) {
      setTimeout(handlePreviewInput, 0);
      return;
    }

    const btn = e.target.closest('button[data-action]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      const action = btn.dataset.action;
      const wrap = btn.closest('[data-mdtype="table-wrap"]');
      if (!wrap) return;
      const table = wrap.querySelector('table');
      if (!table) return;

      if (action === 'add-row') {
        let tbody = table.querySelector('tbody');
        if (!tbody) {
          tbody = document.createElement('tbody');
          table.appendChild(tbody);
        }
        const trs = [...table.querySelectorAll('tr')];
        const colCount = trs[0] ? trs[0].querySelectorAll('th, td').length : 2;
        const newTr = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
          const td = document.createElement('td');
          td.textContent = `Cell ${trs.length}-${i + 1}`;
          newTr.appendChild(td);
        }
        tbody.appendChild(newTr);
      } else if (action === 'add-col') {
        const trs = [...table.querySelectorAll('tr')];
        trs.forEach((tr, rIdx) => {
          if (rIdx === 0 && tr.querySelector('th')) {
            const th = document.createElement('th');
            th.textContent = `Col ${tr.children.length + 1}`;
            tr.appendChild(th);
          } else {
            const td = document.createElement('td');
            td.textContent = `Data`;
            tr.appendChild(td);
          }
        });
      } else if (action === 'del-row') {
        const trs = [...table.querySelectorAll('tr')];
        if (trs.length > 2) {
          const lastTr = trs[trs.length - 1];
          lastTr.remove();
        }
      } else if (action === 'del-col') {
        const trs = [...table.querySelectorAll('tr')];
        const colCount = trs[0] ? trs[0].querySelectorAll('th, td').length : 0;
        if (colCount > 1) {
          trs.forEach(tr => {
            const cells = tr.querySelectorAll('th, td');
            if (cells.length) {
              cells[cells.length - 1].remove();
            }
          });
        }
      }

      handlePreviewInput();
    }
  }, [handlePreviewInput]);

  // ── Source textarea change ───────────────────────────────────
  const handleSourceChange = (e) => {
    lastSourceFromPreview.current = null;
    setSource(e.target.value);
  };

  // ── Insert Table at EXACT cursor position ────────────────────
  const insertTable = (rows, cols) => {
    const safeCols = Math.max(1, cols);
    const safeRows = Math.max(2, rows);
    const headerRow = '| ' + Array.from({ length: safeCols }, (_, i) => `Header ${i + 1}`).join(' | ') + ' |';
    const sepRow = '| ' + Array.from({ length: safeCols }, () => '---').join(' | ') + ' |';
    const dataRows = Array.from({ length: safeRows - 1 }, () => {
      return '| ' + Array.from({ length: safeCols }, () => 'Cell').join(' | ') + ' |';
    });
    const tableMd = '\n\n' + [headerRow, sepRow, ...dataRows].join('\n') + '\n\n';

    const saved = savedSelectionRef.current;

    // Case 1: Active in PREVIEW pane
    if (saved.pane === 'preview' && previewRef.current) {
      const sel = window.getSelection();
      let range = saved.previewRange;
      if (!range || !previewRef.current.contains(range.commonAncestorContainer)) {
        if (sel && sel.rangeCount && previewRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
          range = sel.getRangeAt(0);
        }
      }

      if (range && previewRef.current.contains(range.commonAncestorContainer)) {
        const wrap = document.createElement('div');
        wrap.className = 'table-wrap my-4 rounded-lg overflow-hidden border border-slate-800 bg-slate-900/30';
        wrap.dataset.mdtype = 'table-wrap';
        wrap.innerHTML = `
          <div class="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 select-none" contenteditable="false">
            <span class="font-semibold text-slate-300">Table (editable cells)</span>
            <div class="flex items-center gap-1.5">
              <button class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs transition" data-action="add-row" title="Add Row">+ Row</button>
              <button class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs transition" data-action="add-col" title="Add Column">+ Col</button>
              <button class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 text-xs transition" data-action="del-row" title="Delete Row">- Row</button>
              <button class="px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 text-xs transition" data-action="del-col" title="Delete Column">- Col</button>
            </div>
          </div>
          <div class="overflow-x-auto p-2">
            <table class="w-full">
              <thead><tr>${Array.from({ length: safeCols }, (_, i) => `<th>Header ${i + 1}</th>`).join('')}</tr></thead>
              <tbody>${Array.from({ length: safeRows - 1 }, () => `<tr>${Array.from({ length: safeCols }, () => `<td>Cell</td>`).join('')}</tr>`).join('')}</tbody>
            </table>
          </div>
        `;

        insertBlockAtRange(range, wrap, previewRef.current);

        const nextP = document.createElement('p');
        nextP.innerHTML = '<br>';
        wrap.after(nextP);

        const firstTh = wrap.querySelector('th');
        if (firstTh) {
          const newRange = document.createRange();
          newRange.selectNodeContents(firstTh);
          sel.removeAllRanges();
          sel.addRange(newRange);
        }

        handlePreviewInput();
        setShowTablePicker(false);
        return;
      }
    }

    // Case 2: Active in SOURCE editor (or fallback)
    const ta = sourceRef.current;
    if (ta) {
      const start = saved.textareaRange?.start ?? ta.selectionStart ?? source.length;
      const end = saved.textareaRange?.end ?? ta.selectionEnd ?? start;
      const newText = source.substring(0, start) + tableMd + source.substring(end);
      lastSourceFromPreview.current = null;
      setSource(newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + tableMd.length, start + tableMd.length);
      }, 0);
    } else {
      lastSourceFromPreview.current = null;
      setSource(prev => prev + tableMd);
    }

    setShowTablePicker(false);
  };

  // ── Insert Image at EXACT cursor position ────────────────────
  const handleInsertImage = () => {
    const finalUrl = imageUrl.trim();
    if (!finalUrl) return;
    const finalAlt = imageAlt.trim() || 'image';
    const imageMd = `![${finalAlt}](${finalUrl})`;

    const saved = savedSelectionRef.current;

    // Case 1: Active in PREVIEW pane
    if (saved.pane === 'preview' && previewRef.current) {
      const sel = window.getSelection();
      let range = saved.previewRange;
      if (!range || !previewRef.current.contains(range.commonAncestorContainer)) {
        if (sel && sel.rangeCount && previewRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
          range = sel.getRangeAt(0);
        }
      }

      if (range && previewRef.current.contains(range.commonAncestorContainer)) {
        sel.removeAllRanges();
        sel.addRange(range);
        range.deleteContents();

        const img = document.createElement('img');
        img.src = finalUrl;
        img.alt = finalAlt;
        range.insertNode(img);

        const space = document.createTextNode(' ');
        img.after(space);
        const newRange = document.createRange();
        newRange.setStartAfter(space);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);

        handlePreviewInput();
        setImageUrl('');
        setImageAlt('');
        setShowImageModal(false);
        return;
      }
    }

    // Case 2: Active in SOURCE editor (or fallback)
    const ta = sourceRef.current;
    if (ta) {
      const start = saved.textareaRange?.start ?? ta.selectionStart ?? source.length;
      const end = saved.textareaRange?.end ?? ta.selectionEnd ?? start;
      const newText = source.substring(0, start) + imageMd + source.substring(end);
      lastSourceFromPreview.current = null;
      setSource(newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + imageMd.length, start + imageMd.length);
      }, 0);
    } else {
      lastSourceFromPreview.current = null;
      setSource(prev => prev + '\n\n' + imageMd + '\n\n');
    }

    setImageUrl('');
    setImageAlt('');
    setShowImageModal(false);
  };

  // ── Insert Link at EXACT cursor position ─────────────────────
  const handleInsertLink = () => {
    const finalUrl = linkUrl.trim();
    if (!finalUrl) return;
    const finalText = linkText.trim() || finalUrl;
    const linkMd = `[${finalText}](${finalUrl})`;

    const saved = savedSelectionRef.current;

    // Case 1: Active in PREVIEW pane
    if (saved.pane === 'preview' && previewRef.current) {
      const sel = window.getSelection();
      let range = saved.previewRange;
      if (!range || !previewRef.current.contains(range.commonAncestorContainer)) {
        if (sel && sel.rangeCount && previewRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
          range = sel.getRangeAt(0);
        }
      }

      if (range && previewRef.current.contains(range.commonAncestorContainer)) {
        sel.removeAllRanges();
        sel.addRange(range);
        range.deleteContents();

        const a = document.createElement('a');
        a.href = finalUrl;
        a.textContent = finalText;
        range.insertNode(a);

        const space = document.createTextNode(' ');
        a.after(space);
        const newRange = document.createRange();
        newRange.setStartAfter(space);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);

        handlePreviewInput();
        setLinkUrl('');
        setLinkText('');
        setShowLinkModal(false);
        return;
      }
    }

    // Case 2: Active in SOURCE editor (or fallback)
    const ta = sourceRef.current;
    if (ta) {
      const start = saved.textareaRange?.start ?? ta.selectionStart ?? source.length;
      const end = saved.textareaRange?.end ?? ta.selectionEnd ?? start;
      const newText = source.substring(0, start) + linkMd + source.substring(end);
      lastSourceFromPreview.current = null;
      setSource(newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + linkMd.length, start + linkMd.length);
      }, 0);
    } else {
      lastSourceFromPreview.current = null;
      setSource(prev => prev + linkMd);
    }

    setLinkUrl('');
    setLinkText('');
    setShowLinkModal(false);
  };

  // ── Insert LaTeX Math Equation ──────────────────────────────
  const handleInsertMath = (formula, isBlock) => {
    const cleanFormula = formula.trim() || 'E = mc^2';
    const mathMd = isBlock ? `\n\n$$\n${cleanFormula}\n$$\n\n` : `$${cleanFormula}$`;

    const saved = savedSelectionRef.current;

    // Case 1: Active in PREVIEW pane
    if (saved.pane === 'preview' && previewRef.current) {
      const sel = window.getSelection();
      let range = saved.previewRange;
      if (!range || !previewRef.current.contains(range.commonAncestorContainer)) {
        if (sel && sel.rangeCount && previewRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
          range = sel.getRangeAt(0);
        }
      }

      if (range && previewRef.current.contains(range.commonAncestorContainer)) {
        sel.removeAllRanges();
        sel.addRange(range);
        range.deleteContents();

        if (isBlock) {
          const block = document.createElement('div');
          block.className = 'math-block my-4 rounded-xl overflow-hidden border border-indigo-500/30 bg-slate-950/80 shadow-lg';
          block.dataset.mdtype = 'math-block';
          let rendered;
          try {
            rendered = katex.renderToString(cleanFormula, { displayMode: true, throwOnError: false });
          } catch (e) {
            rendered = `<span class="text-rose-400">Error: ${e.message}</span>`;
          }
          block.innerHTML =
            `<div class="flex items-center justify-between px-3 py-1.5 bg-indigo-950/50 border-b border-indigo-500/20 text-xs font-mono select-none" contenteditable="false">` +
            `<div class="flex items-center gap-2 text-indigo-300 font-semibold"><span class="w-2 h-2 rounded-full bg-violet-400"></span><span>Math Block (LaTeX)</span></div>` +
            `<span class="text-indigo-400/60 text-[11px]">Edit LaTeX below to update</span>` +
            `</div>` +
            `<div class="math-rendered p-4 overflow-x-auto flex justify-center bg-slate-900/40 select-none text-slate-100" contenteditable="false">${rendered}</div>` +
            `<div class="px-3 py-1 bg-slate-900/80 border-t border-slate-800 text-[11px] font-mono text-slate-500 select-none" contenteditable="false">LaTeX Equation (editable):</div>` +
            `<pre class="math-source p-3 m-0 overflow-x-auto text-xs font-mono text-indigo-200 bg-slate-950 outline-none border-t border-slate-800/60" contenteditable="true" spellcheck="false" style="tab-size: 2;">${cleanFormula}</pre>`;
          insertBlockAtRange(range, block, previewRef.current);
        } else {
          const span = document.createElement('span');
          span.className = 'math-inline inline-flex items-center mx-1 px-1.5 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 align-middle';
          span.dataset.mdtype = 'math-inline';
          span.dataset.latex = encodeURIComponent(cleanFormula);
          let rendered;
          try {
            rendered = katex.renderToString(cleanFormula, { displayMode: false, throwOnError: false });
          } catch {
            rendered = `<span class="text-rose-400">$${cleanFormula}$</span>`;
          }
          span.innerHTML = `<span class="math-rendered select-none" contenteditable="false">${rendered}</span>`;
          range.insertNode(span);
        }

        handlePreviewInput();
        setShowMathModal(false);
        setMathFormula('');
        return;
      }
    }

    // Case 2: Active in SOURCE editor (or fallback)
    const ta = sourceRef.current;
    if (ta) {
      const start = saved.textareaRange?.start ?? ta.selectionStart ?? source.length;
      const end = saved.textareaRange?.end ?? ta.selectionEnd ?? start;
      const newText = source.substring(0, start) + mathMd + source.substring(end);
      lastSourceFromPreview.current = null;
      setSource(newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + mathMd.length, start + mathMd.length);
      }, 0);
    } else {
      lastSourceFromPreview.current = null;
      setSource(prev => prev + '\n\n' + mathMd + '\n\n');
    }

    setShowMathModal(false);
    setMathFormula('');
  };

  // ── Insert Footnote Reference & Definition ───────────────────
  const handleInsertFootnote = () => {
    recordSelection();
    const matches = [...source.matchAll(/\[\^(\d+)\]/g)].map(m => parseInt(m[1], 10)).filter(n => !isNaN(n));
    const nextNum = matches.length > 0 ? Math.max(...matches) + 1 : 1;
    const refText = `[^${nextNum}]`;
    const defText = `\n\n[^${nextNum}]: Footnote ${nextNum} description\n`;

    const saved = savedSelectionRef.current;

    // Case 1: Active in PREVIEW pane
    if (saved.pane === 'preview' && previewRef.current) {
      const sel = window.getSelection();
      let range = saved.previewRange;
      if (range && previewRef.current.contains(range.commonAncestorContainer)) {
        sel.removeAllRanges();
        sel.addRange(range);
        const sup = document.createElement('sup');
        sup.className = 'footnote-ref';
        sup.dataset.fnId = String(nextNum);
        sup.innerHTML = `<a href="#fn-${nextNum}" id="fnref-${nextNum}" class="text-indigo-400 font-mono text-[10px] px-1 py-0.5 rounded bg-indigo-950/50 border border-indigo-500/30 font-semibold">[${nextNum}]</a>`;
        range.deleteContents();
        range.insertNode(sup);

        // Find or create footnotes section in preview
        let fnSection = previewRef.current.querySelector('.footnotes-section');
        if (!fnSection) {
          fnSection = document.createElement('div');
          fnSection.className = 'footnotes-section my-8 pt-4 border-t border-slate-800 text-xs text-slate-400';
          fnSection.dataset.mdtype = 'footnotes-section';
          fnSection.innerHTML =
            `<div class="flex items-center gap-1.5 font-semibold text-slate-300 mb-3 select-none" contenteditable="false">` +
            `<span class="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>` +
            `<span>Footnotes</span>` +
            `</div>` +
            `<ol class="footnotes-list space-y-2 list-none p-0 m-0"></ol>`;
          previewRef.current.appendChild(fnSection);
        }
        const list = fnSection.querySelector('.footnotes-list') || fnSection;
        const li = document.createElement('li');
        li.className = 'footnote-item flex items-start gap-2 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 transition-colors';
        li.dataset.mdtype = 'footnote-item';
        li.dataset.fnId = String(nextNum);
        li.id = `fn-${nextNum}`;
        li.innerHTML =
          `<span class="footnote-label font-mono text-[11px] text-indigo-400 font-semibold select-none pt-0.5" contenteditable="false">[${nextNum}]</span>` +
          `<div class="footnote-content flex-1 text-slate-300 outline-none" contenteditable="true">Footnote ${nextNum} description</div>` +
          `<a href="#fnref-${nextNum}" class="footnote-backref text-indigo-400/80 hover:text-indigo-300 px-1 select-none text-xs" contenteditable="false" title="Jump to reference">↩</a>`;
        list.appendChild(li);

        handlePreviewInput();
        return;
      }
    }

    // Case 2: Active in SOURCE editor
    const ta = sourceRef.current;
    if (ta) {
      const start = saved.textareaRange?.start ?? ta.selectionStart ?? source.length;
      const end = saved.textareaRange?.end ?? ta.selectionEnd ?? start;
      const newSource = source.substring(0, start) + refText + source.substring(end) + defText;
      lastSourceFromPreview.current = null;
      setSource(newSource);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + refText.length, start + refText.length);
      }, 0);
    } else {
      setSource(prev => prev + refText + defText);
    }
  };

  // ── Toolbar formatting ───────────────────────────────────────
  const insertMarkdown = (before, after = '', placeholder = 'text') => {
    const saved = savedSelectionRef.current;
    const ta = sourceRef.current;

    // ─────────────────────────────────────────────────────────────
    // BRANCH 1: SOURCE EDITOR (TEXTAREA)
    // ─────────────────────────────────────────────────────────────
    if (ta && (saved.pane === 'source' || document.activeElement === ta || viewMode === 'editor')) {
      const start = saved.textareaRange?.start ?? ta.selectionStart ?? 0;
      const end   = saved.textareaRange?.end   ?? ta.selectionEnd   ?? start;

      // Handle Line-based Formats: Bullet List, Numbered List, Task List, Blockquote
      const isBulletList   = before === '- ';
      const isNumberedList = before === '1. ';
      const isTaskList     = before === '- [ ] ';
      const isBlockquote   = before === '> ';

      if (isBulletList || isNumberedList || isTaskList || isBlockquote) {
        const lineStart = source.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = source.indexOf('\n', end);
        const lineLimit = lineEnd === -1 ? source.length : lineEnd;
        const targetBlock = source.substring(lineStart, lineLimit);
        const lines = targetBlock.split('\n');

        let newLines = [];

        if (isBulletList) {
          const allBulleted = lines.every(l => l.startsWith('- ') || l.startsWith('* '));
          if (allBulleted) {
            newLines = lines.map(l => l.replace(/^[-*]\s+/, ''));
          } else {
            newLines = lines.map(l => {
              const stripped = l.replace(/^(\d+\.\s+|- \[[ x]\]\s+|[-*]\s+)/, '');
              return `- ${stripped}`;
            });
          }
        } else if (isNumberedList) {
          const allNumbered = lines.every(l => /^\d+\.\s+/.test(l));
          if (allNumbered) {
            newLines = lines.map(l => l.replace(/^\d+\.\s+/, ''));
          } else {
            newLines = lines.map((l, idx) => {
              const stripped = l.replace(/^(\d+\.\s+|- \[[ x]\]\s+|[-*]\s+)/, '');
              return `${idx + 1}. ${stripped}`;
            });
          }
        } else if (isTaskList) {
          const allTask = lines.every(l => /^- \[[ x]\]\s+/.test(l));
          if (allTask) {
            newLines = lines.map(l => l.replace(/^- \[[ x]\]\s+/, ''));
          } else {
            newLines = lines.map(l => {
              const stripped = l.replace(/^(\d+\.\s+|- \[[ x]\]\s+|[-*]\s+)/, '');
              return `- [ ] ${stripped}`;
            });
          }
        } else if (isBlockquote) {
          const allQuoted = lines.every(l => l.startsWith('> ') || l === '>');
          if (allQuoted) {
            newLines = lines.map(l => l.replace(/^>\s?/, ''));
          } else {
            newLines = lines.map(l => l.startsWith('> ') ? l : `> ${l}`);
          }
        }

        const replacement = newLines.join('\n');
        const newSource = source.substring(0, lineStart) + replacement + source.substring(lineLimit);
        lastSourceFromPreview.current = null;
        setSource(newSource);
        setTimeout(() => {
          ta.focus();
          ta.setSelectionRange(lineStart, lineStart + replacement.length);
        }, 0);
        return;
      }

      // Standard inline formatting (bold, italic, code, headings)
      const selected = source.substring(start, end) || placeholder;
      const newText  = source.substring(0, start) + before + selected + after + source.substring(end);
      lastSourceFromPreview.current = null;
      setSource(newText);
      setTimeout(() => {
        ta.focus();
        ta.setSelectionRange(start + before.length, start + before.length + selected.length);
      }, 0);
      return;
    }

    // ─────────────────────────────────────────────────────────────
    // BRANCH 2: PREVIEW PANE (CONTENTEDITABLE)
    // ─────────────────────────────────────────────────────────────
    if (previewRef.current) {
      previewRef.current.focus();
      const sel = window.getSelection();
      if (saved.previewRange && sel) {
        sel.removeAllRanges();
        sel.addRange(saved.previewRange);
      }

      if (before === '**' && after === '**') {
        document.execCommand('bold', false, null);
      } else if (before === '*' && after === '*') {
        document.execCommand('italic', false, null);
      } else if (before === '~~' && after === '~~') {
        document.execCommand('strikeThrough', false, null);
      } else if (before === '# ') {
        document.execCommand('formatBlock', false, '<h1>');
      } else if (before === '## ') {
        document.execCommand('formatBlock', false, '<h2>');
      } else if (before === '### ') {
        document.execCommand('formatBlock', false, '<h3>');
      } else if (before === '- ') {
        document.execCommand('insertUnorderedList', false, null);
      } else if (before === '1. ') {
        document.execCommand('insertOrderedList', false, null);
      } else if (before === '- [ ] ') {
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const container = range.commonAncestorContainer;
          const rootEl = container.nodeType === Node.ELEMENT_NODE ? container : container.parentElement;
          const listParent = rootEl?.closest('ul, ol');

          if (listParent) {
            const checkboxes = listParent.querySelectorAll('input[type="checkbox"]');
            if (checkboxes.length > 0) {
              checkboxes.forEach(cb => {
                const li = cb.closest('li');
                if (li) {
                  cb.remove();
                  li.classList.remove('task-list-item');
                }
              });
              handlePreviewInput();
              return;
            } else {
              listParent.querySelectorAll('li').forEach(li => {
                if (!li.querySelector('input[type="checkbox"]')) {
                  const cb = document.createElement('input');
                  cb.type = 'checkbox';
                  cb.className = 'task-checkbox';
                  li.classList.add('task-list-item');
                  li.insertBefore(cb, li.firstChild);
                  const space = document.createTextNode(' ');
                  cb.after(space);
                }
              });
              handlePreviewInput();
              return;
            }
          }

          document.execCommand('insertUnorderedList', false, null);
          const newSel = window.getSelection();
          const targetEl = newSel?.anchorNode?.nodeType === Node.ELEMENT_NODE
            ? newSel.anchorNode
            : newSel?.anchorNode?.parentElement;
          const newUl = targetEl?.closest('ul');
          if (newUl) {
            newUl.querySelectorAll('li').forEach(li => {
              if (!li.querySelector('input[type="checkbox"]')) {
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.className = 'task-checkbox';
                li.classList.add('task-list-item');
                li.insertBefore(cb, li.firstChild);
                const space = document.createTextNode(' ');
                cb.after(space);
              }
            });
          }
        }
      } else if (before === '> ') {
        if (sel && sel.rangeCount > 0) {
          const node = sel.anchorNode;
          const el = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
          const bq = el?.closest('blockquote');
          if (bq) {
            document.execCommand('formatBlock', false, '<p>');
            handlePreviewInput();
            return;
          }
        }
        document.execCommand('formatBlock', false, '<blockquote>');
      } else if (before === '<sub>' && after === '</sub>') {
        document.execCommand('subscript', false, null);
      } else if (before === '<sup>' && after === '</sup>') {
        document.execCommand('superscript', false, null);
      } else if (before === '`' && after === '`') {
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const selectedText = range.toString() || placeholder;
          const codeEl = document.createElement('code');
          codeEl.textContent = selectedText;
          range.deleteContents();
          range.insertNode(codeEl);
          range.selectNode(codeEl);
        }
      } else {
        lastSourceFromPreview.current = null;
        setSource(prev => prev + '\n' + before + placeholder + after);
      }
      handlePreviewInput();
    }
  };

  const viewModes = [
    { id: 'editor',  icon: Edit3,          label: 'Editor'  },
    { id: 'split',   icon: LayoutTemplate, label: 'Split'   },
    { id: 'preview', icon: Eye,            label: 'Preview' },
  ];

  const handleViewModeChange = (newMode) => {
    lastSourceFromPreview.current = null;
    setViewMode(newMode);
    if (newMode !== 'editor') {
      setTimeout(() => {
        if (previewRef.current && (!previewRef.current.innerHTML || previewRef.current.innerHTML !== renderedHtml)) {
          if (renderedHtml) {
            previewRef.current.innerHTML = renderedHtml;
          }
        }
      }, 0);
    }
  };

  // Render the shared format toolbar
  const renderFormatToolbar = () => (
    <div
      className="flex items-center gap-0.5 px-3 py-1.5 shrink-0 flex-wrap relative select-none"
      style={{ background: 'rgba(10,14,26,0.92)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <span className="text-xs text-slate-500 mr-1.5 font-semibold uppercase tracking-widest hidden sm:block">Format</span>
      <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />
      <ToolbarButton onClick={() => insertMarkdown('**', '**', 'bold text')} title="Bold"><Bold size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => insertMarkdown('*', '*', 'italic text')} title="Italic"><Italic size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => insertMarkdown('<sub>', '</sub>', 'subscript')} title="Subscript (<sub>...</sub>)"><Subscript size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => insertMarkdown('<sup>', '</sup>', 'superscript')} title="Superscript (<sup>...</sup>)"><Superscript size={13} /></ToolbarButton>
      <div className="h-4 w-px bg-slate-800 mx-1" />
      <ToolbarButton onClick={() => insertMarkdown('# ', '', 'Heading 1')} title="Heading 1"><Heading1 size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => insertMarkdown('## ', '', 'Heading 2')} title="Heading 2"><Heading2 size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => insertMarkdown('### ', '', 'Heading 3')} title="Heading 3"><Heading3 size={13} /></ToolbarButton>
      <div className="h-4 w-px bg-slate-800 mx-1" />
      <ToolbarButton onClick={() => insertMarkdown('- ', '', 'list item')} title="Bullet List"><List size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => insertMarkdown('1. ', '', 'list item')} title="Numbered List"><ListOrdered size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => insertMarkdown('- [ ] ', '', 'task item')} title="Task List"><CheckSquare size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => insertMarkdown('> ', '', 'quote')} title="Blockquote (Click to toggle on/off)"><Quote size={13} /></ToolbarButton>
      <div className="h-4 w-px bg-slate-800 mx-1" />
      <ToolbarButton onClick={() => insertMarkdown('`', '`', 'code')} title="Inline Code"><Code size={13} /></ToolbarButton>
      <ToolbarButton onClick={() => insertMarkdown('\n```javascript\n', '\n```\n', 'console.log("DevDesk");')} title="Code Block"><FileCode size={13} /></ToolbarButton>

      <div className="h-4 w-px bg-slate-800 mx-1" />

      {/* ── 1. Link Insertion Button ── */}
      <ToolbarButton
        onClick={() => {
          recordSelection();
          const ta = sourceRef.current;
          let selected = '';
          if (document.activeElement === ta && ta) {
            selected = source.substring(ta.selectionStart, ta.selectionEnd);
          } else {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              selected = sel.toString();
            }
          }
          setLinkText(selected || '');
          setLinkUrl('');
          setShowLinkModal(true);
        }}
        title="Insert Link at Cursor"
      >
        <LinkIcon size={13} className="text-indigo-400" />
      </ToolbarButton>

      {/* ── 2. Image Insertion Button ── */}
      <ToolbarButton
        onClick={() => {
          recordSelection();
          setShowImageModal(true);
        }}
        title="Insert Image at Cursor"
      >
        <ImageIcon size={13} className="text-indigo-400" />
      </ToolbarButton>

      {/* ── 3. Table Grid Picker (MS Word style) ── */}
      <div className="relative" ref={tablePickerRef}>
        <ToolbarButton
          onClick={() => {
            recordSelection();
            setShowTablePicker(prev => !prev);
          }}
          active={showTablePicker}
          title="Insert Table at Cursor (Word Style Grid)"
        >
          <TableIcon size={13} className="text-indigo-400" />
        </ToolbarButton>

        {showTablePicker && (
          <div
            onMouseDown={(e) => e.preventDefault()}
            className="absolute top-full left-0 mt-1.5 z-50 p-3 rounded-xl border border-slate-700/90 bg-slate-900/95 shadow-2xl backdrop-blur-md animate-fade-in"
            style={{ minWidth: '190px' }}
          >
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800 text-xs font-medium text-slate-300">
              <span className="font-semibold text-slate-200">Insert Table</span>
              <span className="text-indigo-400 font-mono text-[11px] font-semibold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                {tableHoverGrid.rows} × {tableHoverGrid.cols}
              </span>
            </div>
            <div className="grid grid-cols-8 gap-1 p-1 bg-slate-950/80 rounded-lg border border-slate-800">
              {Array.from({ length: 8 }).map((_, rIdx) =>
                Array.from({ length: 8 }).map((_, cIdx) => {
                  const isHovered = rIdx < tableHoverGrid.rows && cIdx < tableHoverGrid.cols;
                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setTableHoverGrid({ rows: rIdx + 1, cols: cIdx + 1 })}
                      onClick={() => insertTable(rIdx + 1, cIdx + 1)}
                      className={`w-4 h-4 rounded-xs border transition-all duration-75 cursor-pointer ${
                        isHovered
                          ? 'bg-indigo-500 border-indigo-400 shadow-xs scale-105'
                          : 'bg-slate-800/80 border-slate-700/50 hover:border-slate-500'
                      }`}
                    />
                  );
                })
              )}
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span>{tableHoverGrid.rows} rows × {tableHoverGrid.cols} cols</span>
              <span className="text-indigo-400">Click to insert</span>
            </div>
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-slate-800 mx-1" />

      {/* ── 4. LaTeX Math Equation Button ── */}
      <ToolbarButton
        onClick={() => {
          recordSelection();
          const ta = sourceRef.current;
          let selected = '';
          if (document.activeElement === ta && ta) {
            selected = source.substring(ta.selectionStart, ta.selectionEnd);
          } else {
            const sel = window.getSelection();
            if (sel && sel.rangeCount > 0) {
              selected = sel.toString();
            }
          }
          setMathFormula(selected || 'E = mc^2');
          setMathType(selected.includes('\n') ? 'block' : 'inline');
          setShowMathModal(true);
        }}
        title="Insert Math Equation (LaTeX: $...$ or $$...$$)"
      >
        <Sigma size={13} className="text-violet-400" />
      </ToolbarButton>

      {/* ── 5. Footnote Insertion Button ── */}
      <ToolbarButton
        onClick={handleInsertFootnote}
        title="Insert Footnote [^1]"
      >
        <span className="text-[10px] font-mono text-amber-400 font-bold tracking-tighter">[^]</span>
      </ToolbarButton>

      <div className="flex-1" />
      <span className="text-xs text-indigo-400/80 font-medium hidden md:inline">✨ Fully Editable Preview</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-fade-in relative">
      {/* ── Top Action Bar ── */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 shrink-0 flex-wrap"
        style={{ background: 'rgba(13,18,32,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2 mr-2">
          <div className="w-2 h-2 rounded-full" style={{ background: fileHandle ? '#22c55e' : '#fbbf24' }} />
          <span className="text-xs font-mono text-slate-400">{fileName}</span>
        </div>
        <div className="h-4 w-px bg-slate-700 mx-1" />
        <ActionButton onClick={handleOpen}       icon={FolderOpen}   label="Open"        title="Open .md file (⌘O)" />
        <ActionButton onClick={handleSave}       icon={Save}         label="Save"        title="Save file (⌘S)" variant="primary" />
        <ActionButton onClick={handleExportHTML} icon={FileOutput}   label="Export HTML" title="Export as HTML" />
        <ActionButton onClick={handleExportPDF}  icon={FileTextIcon} label="Export PDF"  title="Export as PDF" />
        <div className="flex-1" />
        <div
          className="flex items-center rounded-lg p-0.5 gap-0.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {viewModes.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => handleViewModeChange(id)}
              title={label}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                viewMode === id ? 'bg-indigo-500/25 text-indigo-300' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={13} />
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>
        {isRendering && <RefreshCw size={14} className="text-indigo-400 animate-spin ml-1" />}
      </div>

      {/* ── Main split area ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Source editor */}
        <div
          className={`${viewMode === 'preview' ? 'hidden' : 'flex'} flex-col ${
            viewMode === 'split' ? 'w-1/2' : 'w-full'
          } h-full`}
          style={{ borderRight: viewMode === 'split' ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
        >
          <div
            className="flex items-center justify-between px-4 py-2 shrink-0"
            style={{ background: 'rgba(10,14,26,0.8)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Markdown Source</span>
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <span>{source.split('\n').length} lines</span>
              <span>·</span>
              <span>{source.length} chars</span>
            </div>
          </div>

          {/* In editor-only mode, display toolbar here */}
          {viewMode === 'editor' && renderFormatToolbar()}

          <textarea
            ref={sourceRef}
            value={source}
            onChange={handleSourceChange}
            onSelect={recordSelection}
            onKeyUp={recordSelection}
            onMouseUp={recordSelection}
            onFocus={() => { savedSelectionRef.current.pane = 'source'; recordSelection(); }}
            spellCheck={false}
            className="flex-1 resize-none w-full p-4 text-sm leading-relaxed outline-none overflow-y-scroll"
            style={{
              background: '#080c18',
              color: '#94a3b8',
              fontFamily: 'var(--font-mono)',
              caretColor: '#6366f1',
              tabSize: 2,
            }}
            placeholder="Type your Markdown here..."
          />
        </div>

        {/* RIGHT: Editable rich preview */}
        <div
          className={`${viewMode === 'editor' ? 'hidden' : 'flex'} flex-col ${
            viewMode === 'split' ? 'w-1/2' : 'w-full'
          } h-full overflow-hidden`}
        >
          {/* Format Toolbar */}
          {viewMode !== 'editor' && renderFormatToolbar()}

          {/* Editable preview container */}
          <div
            ref={previewRef}
            contentEditable
            suppressContentEditableWarning
            onFocus={handlePreviewFocus}
            onBlur={handlePreviewBlur}
            onInput={handlePreviewInput}
            onKeyUp={recordSelection}
            onMouseUp={recordSelection}
            onKeyDown={handlePreviewKeyDown}
            onClick={handlePreviewClick}
            className="md-preview flex-1 overflow-y-scroll p-6 outline-none max-w-none"
            style={{ background: '#09101f', caretColor: '#818cf8' }}
          />
        </div>
      </div>

      {/* ── Link Tooltip Popover (Follow link on preview click) ── */}
      {linkTooltip.visible && (
        <div
          className="link-tooltip-popover fixed z-50 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/95 border border-slate-700/90 shadow-2xl backdrop-blur-md text-xs animate-fade-in"
          style={{ top: `${linkTooltip.top}px`, left: `${linkTooltip.left}px` }}
        >
          <div className="flex items-center gap-1.5 max-w-[220px] truncate text-slate-300">
            <LinkIcon size={12} className="text-indigo-400 shrink-0" />
            <span className="truncate font-mono text-[11px] text-slate-400" title={linkTooltip.url}>
              {linkTooltip.url || '(no URL)'}
            </span>
          </div>
          <div className="h-3.5 w-px bg-slate-800" />
          <button
            onClick={() => {
              let openUrl = linkTooltip.url;
              if (!/^https?:\/\/|^mailto:|^tel:/i.test(openUrl)) {
                openUrl = 'https://' + openUrl;
              }
              window.open(openUrl, '_blank', 'noopener,noreferrer');
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-medium transition text-xs border border-indigo-500/30 shrink-0"
            title="Follow link (opens in new tab)"
          >
            <span>Follow link</span>
            <ExternalLink size={12} />
          </button>
          <button
            onClick={() => setLinkTooltip(prev => ({ ...prev, visible: false }))}
            className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition shrink-0"
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Link Modal ── */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <LinkIcon size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-100">Insert Link at Cursor</h3>
              </div>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Link Text</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Display text"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Link URL</label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <span className="block text-[11px] font-medium text-slate-500 mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLinkUrl('https://github.com');
                      if (!linkText) setLinkText('GitHub');
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-slate-700/50 transition"
                  >
                    GitHub
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLinkUrl('https://developer.mozilla.org');
                      if (!linkText) setLinkText('MDN Docs');
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-slate-700/50 transition"
                  >
                    MDN Web Docs
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertLink}
                disabled={!linkUrl.trim()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-indigo-600/20"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Modal ── */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-100">Insert Image at Cursor</h3>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition"
              >
                <X size={15} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Image URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.png"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Alt Text / Caption</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Description of the image"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-700/80 text-slate-200 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div>
                <span className="block text-[11px] font-medium text-slate-500 mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80');
                      setImageAlt('Code on Computer Screen');
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-slate-700/50 transition"
                  >
                    💻 Code Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80');
                      setImageAlt('Abstract Digital Graphic');
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-indigo-300 border border-slate-700/50 transition"
                  >
                    🎨 Abstract Art
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleInsertImage}
                disabled={!imageUrl.trim()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-indigo-600/20"
              >
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LaTeX Math Modal ── */}
      {showMathModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-2xl flex flex-col gap-4 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sigma size={16} className="text-violet-400" />
                <h3 className="text-sm font-semibold text-slate-100">Insert LaTeX Math Equation</h3>
              </div>
              <button
                onClick={() => setShowMathModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-slate-800 transition"
              >
                <X size={15} />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setMathType('inline')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition ${
                  mathType === 'inline'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Inline Math ($...$)
              </button>
              <button
                type="button"
                onClick={() => setMathType('block')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition ${
                  mathType === 'block'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Display Block ($$...$$)
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">LaTeX Formula</label>
                <textarea
                  value={mathFormula}
                  onChange={(e) => setMathFormula(e.target.value)}
                  placeholder="e.g. E = mc^2 or \int_{-\infty}^{\infty} e^{-x^2} dx"
                  rows={3}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-950 border border-slate-700/80 text-violet-200 focus:outline-none focus:border-violet-500 transition resize-y"
                  autoFocus
                />
              </div>

              {/* Live Preview */}
              <div>
                <span className="block text-[11px] font-medium text-slate-400 mb-1">Live Render Preview:</span>
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-center min-h-[50px] overflow-x-auto text-slate-100">
                  {(() => {
                    if (!mathFormula.trim()) {
                      return <span className="text-slate-600 text-xs italic">Type LaTeX above to see preview</span>;
                    }
                    try {
                      const rendered = katex.renderToString(mathFormula.trim(), {
                        displayMode: mathType === 'block',
                        throwOnError: false,
                      });
                      return <span dangerouslySetInnerHTML={{ __html: rendered }} />;
                    } catch (err) {
                      return <span className="text-rose-400 text-xs font-mono">{err.message}</span>;
                    }
                  })()}
                </div>
              </div>

              {/* Presets */}
              <div>
                <span className="block text-[11px] font-medium text-slate-500 mb-1.5">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMathFormula('E = mc^2')}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-violet-300 border border-slate-700/50 transition font-mono"
                  >
                    E = mc²
                  </button>
                  <button
                    type="button"
                    onClick={() => setMathFormula('a^2 + b^2 = c^2')}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-violet-300 border border-slate-700/50 transition font-mono"
                  >
                    Pythagorean
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMathFormula('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}');
                      setMathType('block');
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-violet-300 border border-slate-700/50 transition font-mono"
                  >
                    Quadratic
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMathFormula('\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}');
                      setMathType('block');
                    }}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-violet-300 border border-slate-700/50 transition font-mono"
                  >
                    Gaussian Integral
                  </button>
                  <button
                    type="button"
                    onClick={() => setMathFormula('\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}')}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-violet-300 border border-slate-700/50 transition font-mono"
                  >
                    Summation
                  </button>
                  <button
                    type="button"
                    onClick={() => setMathFormula('\\frac{a}{b}')}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-violet-300 border border-slate-700/50 transition font-mono"
                  >
                    Fraction
                  </button>
                  <button
                    type="button"
                    onClick={() => setMathFormula('\\sqrt{x}')}
                    className="text-[11px] px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-violet-300 border border-slate-700/50 transition font-mono"
                  >
                    √x
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => setShowMathModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleInsertMath(mathFormula, mathType === 'block')}
                disabled={!mathFormula.trim()}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md shadow-violet-600/20"
              >
                Insert Equation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
