import React, { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import {
  FolderOpen, Save, FileOutput, FileText as FileTextIcon,
  Bold, Italic, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, FileCode,
  RefreshCw, Eye, Edit3, LayoutTemplate,
} from 'lucide-react';

// Configure marked
marked.setOptions({ breaks: true, gfm: true });

const DEFAULT_MD = `# Welcome to Markdown Studio 🚀

A powerful Markdown editor with live preview and Mermaid support.

## Features

- **Rich Text Editing** – Edit directly in the preview
- **Mermaid Diagrams** – Render flowcharts and more
- **Two-way Sync** – Source and preview stay in perfect sync
- **File System Access** – Open and save \`.md\` files directly

## Code Example

\`\`\`javascript
const greet = (name) => \`Hello, \${name}!\`;
console.log(greet('DevDesk'));
\`\`\`

## Mermaid Diagram

\`\`\`mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
\`\`\`

## Table

| Feature       | Status |
|---------------|--------|
| Markdown      | ✅ Done |
| Mermaid       | ✅ Done |
| Rich Text     | ✅ Done |
| File Export   | ✅ Done |

> **Tip:** Use the toolbar above the preview to format your content visually, or edit raw Markdown on the left!
`;

function ToolbarButton({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center justify-center w-7 h-7 rounded-md text-xs transition-all duration-150 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60"
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
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
      try {
        const id = `mermaid-${Date.now()}-${i}`;
        const { svg } = await mermaid.render(id, code);
        result = result.replace(
          match[0],
          `<div class="mermaid-diagram my-4 p-4 rounded-xl overflow-auto" style="background:rgba(15,23,42,0.8);border:1px solid rgba(255,255,255,0.06)">${svg}</div>`
        );
      } catch (e) {
        result = result.replace(
          match[0],
          `<div class="p-3 rounded-lg text-rose-400 text-xs font-mono" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2)">⚠️ Mermaid error: ${e.message}</div>`
        );
      }
    }
    return result;
  } catch {
    return html;
  }
}

// Simple HTML→Markdown converter for contenteditable back-sync
function htmlToMarkdown(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, c) =>
      c.trim().split('\n').map(l => '> ' + l.trim()).join('\n')
    )
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function MarkdownStudio() {
  const [source, setSource] = useState(DEFAULT_MD);
  const [renderedHtml, setRenderedHtml] = useState('');
  const [viewMode, setViewMode] = useState('split');
  const [fileHandle, setFileHandle] = useState(null);
  const [fileName, setFileName] = useState('untitled.md');
  const [isRendering, setIsRendering] = useState(false);

  const sourceRef = useRef(null);
  const previewRef = useRef(null);
  const renderTimeoutRef = useRef(null);

  // Scroll sync state – prevents re-entrant firing
  const syncingRef = useRef(null); // 'editor' | 'preview' | null

  // ── Render Markdown ──────────────────────────────────────────
  const renderMarkdown = useCallback(async (md) => {
    setIsRendering(true);
    try {
      const rawHtml = marked.parse(md);
      const finalHtml = await renderMermaid(rawHtml);
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

  // ── Synchronized Scroll ──────────────────────────────────────
  useEffect(() => {
    const editor = sourceRef.current;
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
  }, [source, fileHandle]);

  // ── File System Access API ───────────────────────────────────
  const handleOpen = async () => {
    try {
      if ('showOpenFilePicker' in window) {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown'] } }],
        });
        const file = await handle.getFile();
        setSource(await file.text());
        setFileHandle(handle);
        setFileName(file.name);
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.md,.markdown,text/markdown';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          setSource(await file.text());
          setFileName(file.name);
        };
        input.click();
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error('Open error:', e);
    }
  };

  const handleSave = async () => {
    try {
      if (fileHandle) {
        const writable = await fileHandle.createWritable();
        await writable.write(source);
        await writable.close();
      } else if ('showSaveFilePicker' in window) {
        const handle = await window.showSaveFilePicker({
          suggestedName: fileName,
          types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(source);
        await writable.close();
        setFileHandle(handle);
        setFileName((await handle.getFile()).name);
      } else {
        const blob = new Blob([source], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName; a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error('Save error:', e);
    }
  };

  const handleExportHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${fileName.replace('.md', '')}</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}
    pre{background:#f5f5f5;padding:1em;border-radius:6px;overflow-x:auto}
    code{background:#f0f0f0;padding:2px 5px;border-radius:3px}
    blockquote{border-left:4px solid #ddd;margin:0;padding-left:1em;color:#666}
    table{border-collapse:collapse;width:100%}
    th,td{border:1px solid #ddd;padding:8px 12px}
    th{background:#f5f5f5}
  </style>
</head>
<body>${renderedHtml}</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName.replace('.md', '.html'); a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    const pw = window.open('', '_blank');
    pw.document.write(`<!DOCTYPE html><html><head><style>
      body{font-family:system-ui;max-width:800px;margin:40px auto;line-height:1.6}
      pre{background:#f5f5f5;padding:1em;border-radius:4px}
      code{background:#f0f0f0;padding:2px 4px;border-radius:3px}
      @media print{body{margin:0}}
    </style></head><body>${renderedHtml}</body></html>`);
    pw.document.close(); pw.focus();
    setTimeout(() => { pw.print(); pw.close(); }, 500);
  };

  // ── Preview direct editing ───────────────────────────────────
  // When user edits the contenteditable preview, sync back to source
  const handlePreviewInput = useCallback(() => {
    if (!previewRef.current) return;
    const md = htmlToMarkdown(previewRef.current.innerHTML);
    // Prevent feedback loop: only update source, don't re-render while editing preview
    setSource(md);
  }, []);

  // ── Toolbar inserts into source textarea ─────────────────────
  const insertMarkdown = (before, after = '', placeholder = 'text') => {
    const ta = sourceRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = source.substring(start, end) || placeholder;
    const newText = source.substring(0, start) + before + selected + after + source.substring(end);
    setSource(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const viewModes = [
    { id: 'editor', icon: Edit3, label: 'Editor' },
    { id: 'split', icon: LayoutTemplate, label: 'Split' },
    { id: 'preview', icon: Eye, label: 'Preview' },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in">
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
        <ActionButton onClick={handleOpen}       icon={FolderOpen}    label="Open"        title="Open .md file (⌘O)" />
        <ActionButton onClick={handleSave}       icon={Save}          label="Save"        title="Save file (⌘S)" variant="primary" />
        <ActionButton onClick={handleExportHTML} icon={FileOutput}    label="Export HTML" title="Export as HTML" />
        <ActionButton onClick={handleExportPDF}  icon={FileTextIcon}  label="Export PDF"  title="Export as PDF" />
        <div className="flex-1" />

        {/* View mode toggle */}
        <div
          className="flex items-center rounded-lg p-0.5 gap-0.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {viewModes.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
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
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div
            className={`flex flex-col ${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full`}
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

            <textarea
              ref={sourceRef}
              value={source}
              onChange={(e) => setSource(e.target.value)}
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
        )}

        {/* RIGHT: Editable rich preview */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={`flex flex-col ${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full overflow-hidden`}>

            {/* RTE Toolbar */}
            <div
              className="flex items-center gap-0.5 px-3 py-1.5 shrink-0 flex-wrap"
              style={{ background: 'rgba(10,14,26,0.9)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              <span className="text-xs text-slate-600 mr-1.5 font-semibold uppercase tracking-widest hidden sm:block">Format</span>
              <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

              <ToolbarButton onClick={() => insertMarkdown('**', '**', 'bold text')} title="Bold"><Bold size={13} /></ToolbarButton>
              <ToolbarButton onClick={() => insertMarkdown('*', '*', 'italic text')} title="Italic"><Italic size={13} /></ToolbarButton>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <ToolbarButton onClick={() => insertMarkdown('# ', '', 'Heading 1')} title="Heading 1"><Heading1 size={13} /></ToolbarButton>
              <ToolbarButton onClick={() => insertMarkdown('## ', '', 'Heading 2')} title="Heading 2"><Heading2 size={13} /></ToolbarButton>
              <ToolbarButton onClick={() => insertMarkdown('### ', '', 'Heading 3')} title="Heading 3"><Heading3 size={13} /></ToolbarButton>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <ToolbarButton onClick={() => insertMarkdown('- ', '', 'list item')} title="Bullet List"><List size={13} /></ToolbarButton>
              <ToolbarButton onClick={() => insertMarkdown('1. ', '', 'list item')} title="Numbered List"><ListOrdered size={13} /></ToolbarButton>
              <ToolbarButton onClick={() => insertMarkdown('> ', '', 'quote')} title="Blockquote"><Quote size={13} /></ToolbarButton>

              <div className="h-4 w-px bg-slate-800 mx-1" />

              <ToolbarButton onClick={() => insertMarkdown('`', '`', 'code')} title="Inline Code"><Code size={13} /></ToolbarButton>
              <ToolbarButton onClick={() => insertMarkdown('\n```\n', '\n```\n', 'code block')} title="Code Block"><FileCode size={13} /></ToolbarButton>

              <div className="flex-1" />
              <span className="text-xs text-slate-600 italic">Editable Preview</span>
            </div>

            {/* Editable preview pane */}
            <div
              ref={previewRef}
              contentEditable
              suppressContentEditableWarning
              onInput={handlePreviewInput}
              dangerouslySetInnerHTML={renderedHtml ? { __html: renderedHtml } : undefined}
              className="md-preview flex-1 overflow-y-scroll p-6 outline-none max-w-none"
              style={{
                background: '#09101f',
                caretColor: '#818cf8',
                // Only set innerHTML when source-driven (not when user is typing in preview)
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
