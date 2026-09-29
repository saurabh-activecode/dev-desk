import React, { useState, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, Copy, Check, Minimize2, Maximize2, Search, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

// ─── Type badge metadata ───────────────────────────────────────
const TYPE_META = {
  string:  { label: 'string',  bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: 'rgba(99,102,241,0.25)' },
  number:  { label: 'number',  bg: 'rgba(251,191,36,0.12)',  color: '#fcd34d', border: 'rgba(251,191,36,0.25)' },
  boolean: { label: 'boolean', bg: 'rgba(52,211,153,0.12)',  color: '#6ee7b7', border: 'rgba(52,211,153,0.25)' },
  null:    { label: 'null',    bg: 'rgba(248,113,113,0.12)', color: '#fca5a5', border: 'rgba(248,113,113,0.25)' },
  object:  { label: 'object',  bg: 'rgba(125,211,252,0.10)', color: '#7dd3fc', border: 'rgba(125,211,252,0.20)' },
  array:   { label: 'array',   bg: 'rgba(196,181,253,0.12)', color: '#c4b5fd', border: 'rgba(196,181,253,0.25)' },
};

function TypeBadge({ type }) {
  const m = TYPE_META[type];
  if (!m) return null;
  return (
    <span
      className="ml-1.5 px-1.5 py-0 rounded text-[10px] font-semibold font-mono shrink-0 select-none"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}`, lineHeight: '18px' }}
    >
      {m.label}
    </span>
  );
}

// ─── Copy-value button ─────────────────────────────────────────
function CopyValueButton({ value }) {
  const [done, setDone] = useState(false);
  const copy = async (e) => {
    e.stopPropagation();
    const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    try { await navigator.clipboard.writeText(text); } catch {}
    setDone(true);
    setTimeout(() => setDone(false), 1500);
  };
  return (
    <button
      onClick={copy}
      title="Copy value"
      className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-auto pl-2 shrink-0 flex items-center"
      style={{ color: done ? '#4ade80' : '#475569' }}
    >
      {done ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

const DEFAULT_JSON = `{
  "name": "DevDesk",
  "version": "1.0.0",
  "description": "A modern developer toolkit",
  "author": {
    "name": "Developer",
    "email": "dev@example.com",
    "links": {
      "github": "https://github.com",
      "twitter": "https://twitter.com"
    }
  },
  "features": [
    "Markdown Studio",
    "JSON Explorer",
    "JSON Diff Comparator"
  ],
  "settings": {
    "theme": "dark",
    "fontSize": 14,
    "autoSave": true,
    "maxHistory": 100,
    "enabled": true,
    "lastOpened": null
  },
  "stats": {
    "users": 42000,
    "stars": 8192,
    "forks": 512
  }
}`;

// Depth-based key color palette – high contrast on dark backgrounds.
// All keys at the same nesting level share one color.
const DEPTH_COLORS = [
  '#67e8f9', // depth 0 – cyan-300
  '#fcd34d', // depth 1 – amber-300
  '#86efac', // depth 2 – green-300
  '#c4b5fd', // depth 3 – violet-300
  '#7dd3fc', // depth 4 – sky-300
  '#fda4af', // depth 5 – rose-300
  '#5eead4', // depth 6 – teal-300
  '#fdba74', // depth 7 – orange-300
];

function keyColor(depth) {
  return DEPTH_COLORS[depth % DEPTH_COLORS.length];
}

// ─── Search helpers ──────────────────────────────────────────
function matchesSearch(value, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  if (value === null) return 'null'.includes(q);
  if (typeof value === 'string')  return value.toLowerCase().includes(q);
  if (typeof value === 'number')  return String(value).includes(q);
  if (typeof value === 'boolean') return String(value).includes(q);
  if (typeof value === 'object') {
    return Object.entries(value).some(([k, v]) =>
      k.toLowerCase().includes(q) || matchesSearch(v, query)
    );
  }
  return false;
}

function highlightText(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#fde047', color: '#1e1b4b', borderRadius: '2px', padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Tree Node Component ─────────────────────────────────────
function TreeNode({ keyName, value, depth = 0, isLast = true, query = '' }) {
  const hasMatch = query ? matchesSearch(value, query) || (keyName !== null && keyName.toLowerCase().includes(query.toLowerCase())) : true;

  // Determine if any child (but not self-key/value) has a descendant match
  const childHasMatch = query && typeof value === 'object' && value !== null
    ? Object.entries(value).some(([k, v]) =>
        k.toLowerCase().includes(query.toLowerCase()) || matchesSearch(v, query)
      )
    : false;

  // Auto-expand when a descendant matches; never auto-collapse during search
  const [collapsed, setCollapsed] = useState(false);
  const isForceOpen = query && childHasMatch;
  const isCollapsed = isForceOpen ? false : collapsed;

  if (query && !hasMatch) return null; // prune non-matching subtrees

  const indent = depth * 16;

  const getValueType = (v) => {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    return typeof v;
  };

  const type = getValueType(value);
  const isExpandable = type === 'object' || type === 'array';
  const entries = isExpandable
    ? type === 'array'
      ? value.map((v, i) => [String(i), v])
      : Object.entries(value)
    : [];
  const count = entries.length;

  // Check if this node's own key or primitive value directly matches
  const keyMatches   = query && keyName !== null && keyName.toLowerCase().includes(query.toLowerCase());
  const valueStr     = type === 'string'  ? `"${value}"` :
                       type === 'number'  ? String(value) :
                       type === 'boolean' ? String(value) :
                       type === 'null'    ? 'null' : null;
  const valueMatches = query && valueStr && valueStr.toLowerCase().includes(query.toLowerCase());

  const renderPrimitive = () => {
    const raw = valueStr || String(value);
    const highlighted = valueMatches ? highlightText(raw, query) : raw;
    switch (type) {
      case 'string':  return <span className="json-string">{valueMatches ? highlighted : `"${value}"`}</span>;
      case 'number':  return <span className="json-number">{valueMatches ? highlighted : value}</span>;
      case 'boolean': return <span className="json-boolean">{valueMatches ? highlighted : String(value)}</span>;
      case 'null':    return <span className="json-null">{valueMatches ? highlighted : 'null'}</span>;
      default:        return <span style={{ color: '#e2e8f0' }}>{String(value)}</span>;
    }
  };

  const bracketOpen  = type === 'array' ? '[' : '{';
  const bracketClose = type === 'array' ? ']' : '}';
  const kColor = keyColor(depth);

  // Highlight on match: add a subtle row glow
  const rowBg = (keyMatches || valueMatches)
    ? 'rgba(250,204,21,0.07)'
    : undefined;

  return (
    <div className="font-mono text-xs leading-relaxed">
      {/* ── Node row ── */}
      <div
        className="flex items-center group hover:bg-white/[0.02] rounded-md transition-colors duration-100 pr-1"
        style={{ paddingLeft: `${indent}px`, minHeight: '22px', background: rowBg }}
      >
        {/* Expand/collapse chevron */}
        {isExpandable ? (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="flex items-center shrink-0 w-4 h-4 mr-1 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        {/* Key – colored by depth, highlighted if matched */}
        {keyName !== null && (
          <span className="mr-1 shrink-0" style={{ color: kColor }}>
            "{keyMatches ? highlightText(keyName, query) : keyName}"
            <span style={{ color: '#475569' }}>:</span>
          </span>
        )}

        {/* Value / bracket + type badge */}
        {isExpandable ? (
          <span className="flex items-center flex-wrap gap-x-1">
            <span style={{ color: '#94a3b8' }}>{bracketOpen}</span>
            {isCollapsed ? (
              <>
                <button
                  onClick={() => setCollapsed(false)}
                  className="hover:text-slate-300 px-1 text-xs"
                  style={{ color: '#475569' }}
                >
                  {count} {type === 'array' ? 'items' : 'keys'}
                </button>
                <span style={{ color: '#94a3b8' }}>{bracketClose}</span>
                {!isLast && <span style={{ color: '#334155' }}>,</span>}
              </>
            ) : null}
            <TypeBadge type={type} />
          </span>
        ) : (
          <span className="flex items-center flex-wrap gap-x-1">
            {renderPrimitive()}
            {!isLast && <span style={{ color: '#334155' }}>,</span>}
            <TypeBadge type={type} />
          </span>
        )}

        {/* Copy button – visible on hover */}
        <CopyValueButton value={value} />
      </div>

      {/* ── Children ── */}
      {isExpandable && !isCollapsed && (
        <div className="relative">
          {/* Dotted vertical guideline */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{
              left: `${indent + 8}px`,
              borderLeft: `1px dotted ${kColor}40`,
            }}
          />
          {entries.map(([k, v], i) => (
            <TreeNode
              key={k}
              keyName={type === 'array' ? null : k}
              value={v}
              depth={depth + 1}
              isLast={i === entries.length - 1}
              query={query}
            />
          ))}
          <div
            className="flex items-center"
            style={{ paddingLeft: `${indent}px`, color: '#94a3b8', minHeight: '22px' }}
          >
            <span className="w-5 shrink-0" />
            <span>{bracketClose}</span>
            {!isLast && <span style={{ color: '#334155' }}>,</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────
function ValidationBadge({ status, error }) {
  if (status === 'idle') return null;
  if (status === 'valid') {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', color: '#4ade80' }}>
        <CheckCircle size={12} />
        Valid JSON
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium max-w-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }} title={error}>
      <XCircle size={12} />
      <span className="truncate">{error?.split('\n')[0] || 'Invalid JSON'}</span>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────
export default function JsonExplorer() {
  const [raw, setRaw] = useState(DEFAULT_JSON);
  const [parsed, setParsed] = useState(null);
  const [validationStatus, setValidationStatus] = useState('idle');
  const [validationError, setValidationError] = useState('');
  const [copied, setCopied] = useState(false);
  const [treeView, setTreeView] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const textareaRef = useRef(null);

  const parseJSON = useCallback((text) => {
    try {
      const result = JSON.parse(text);
      setParsed(result);
      setValidationStatus('valid');
      setValidationError('');
      return result;
    } catch (e) {
      setParsed(null);
      setValidationStatus('invalid');
      setValidationError(e.message);
      return null;
    }
  }, []);

  const handleValidate = () => parseJSON(raw);

  const handleBeautify = () => {
    const result = parseJSON(raw);
    if (result !== null) {
      setRaw(JSON.stringify(result, null, 2));
    }
  };

  const handleMinify = () => {
    const result = parseJSON(raw);
    if (result !== null) {
      setRaw(JSON.stringify(result));
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = raw;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filter raw for search highlight
  const getHighlightedRaw = () => {
    if (!searchQuery) return raw;
    return raw; // We'll show the raw and rely on browser find for now
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Top Bar */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 shrink-0 flex-wrap"
        style={{ background: 'rgba(13,18,32,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <span className="text-sm font-semibold text-slate-300 mr-2">JSON Explorer</span>
        <div className="h-4 w-px bg-slate-700" />

        <button
          onClick={handleValidate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150"
          style={{ background: 'rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}
        >
          <CheckCircle size={13} />
          Validate
        </button>
        <button
          onClick={handleBeautify}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/50"
        >
          <Maximize2 size={13} />
          Beautify
        </button>
        <button
          onClick={handleMinify}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/50"
        >
          <Minimize2 size={13} />
          Minify
        </button>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
            copied
              ? 'bg-green-500/15 border-green-500/30 text-green-400'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/50'
          }`}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <div className="flex-1" />

        {/* Validation badge */}
        <ValidationBadge status={validationStatus} error={validationError} />

        {/* Search */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
          <Search size={12} className="text-slate-500" />
          <input
            type="text"
            placeholder="Search keys..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent outline-none text-xs text-slate-300 placeholder-slate-600 w-28"
          />
        </div>

        {/* View toggle */}
        <div
          className="flex items-center gap-0.5 rounded-lg p-0.5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={() => setTreeView(true)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${treeView ? 'bg-indigo-500/25 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Tree
          </button>
          <button
            onClick={() => setTreeView(false)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${!treeView ? 'bg-indigo-500/25 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Raw
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Raw Editor */}
        <div
          className="flex flex-col w-1/2 h-full"
          style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="flex items-center justify-between px-4 py-2 shrink-0"
            style={{ background: 'rgba(10,14,26,0.8)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Raw Input</span>
            <span className="text-xs text-slate-600">{raw.length} chars</span>
          </div>

          <textarea
            ref={textareaRef}
            value={raw}
            onChange={(e) => {
              setRaw(e.target.value);
              setValidationStatus('idle');
            }}
            spellCheck={false}
            className="flex-1 resize-none w-full p-4 text-xs leading-relaxed outline-none"
            style={{
              background: '#080c18',
              color: '#94a3b8',
              fontFamily: 'var(--font-mono)',
              caretColor: '#06b6d4',
              tabSize: 2,
            }}
            placeholder='Paste your JSON here and click Validate or Beautify...'
          />

          {/* Error display */}
          {validationStatus === 'invalid' && (
            <div
              className="flex items-start gap-2 px-4 py-3 text-xs font-mono shrink-0"
              style={{ background: 'rgba(239,68,68,0.08)', borderTop: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}
            >
              <AlertTriangle size={13} className="shrink-0 mt-0.5" />
              <span className="break-all">{validationError}</span>
            </div>
          )}
        </div>

        {/* Right: Tree View */}
        <div className="flex flex-col w-1/2 h-full overflow-hidden">
          <div
            className="flex items-center justify-between px-4 py-2 shrink-0"
            style={{ background: 'rgba(10,14,26,0.8)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
          >
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
              {treeView ? 'Tree View' : 'Formatted'}
            </span>
            {parsed && (
              <span className="text-xs text-slate-600">
                {Array.isArray(parsed) ? `${parsed.length} items` : `${Object.keys(parsed).length} keys`}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4" style={{ background: '#09101f' }}>
            {parsed && treeView ? (
              <div className="animate-fade-in">
                {searchQuery && (
                  <div className="mb-2 text-xs text-slate-500 font-mono">
                    Searching: <span style={{ color: '#fde047' }}>'{searchQuery}'</span>
                  </div>
                )}
                <TreeNode keyName={null} value={parsed} depth={0} isLast={true} query={searchQuery} />
              </div>
            ) : parsed && !treeView ? (
              <pre
                className="text-xs leading-relaxed"
                style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}
              >
                {JSON.stringify(parsed, null, 2)}
              </pre>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.08)' }}>
                  <Search size={20} className="text-cyan-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-500">No parsed data</p>
                  <p className="text-xs text-slate-700 mt-1">Click Validate or Beautify to parse JSON</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
