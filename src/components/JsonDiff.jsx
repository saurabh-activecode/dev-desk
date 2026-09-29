import React, { useState, useCallback, useRef } from 'react';
import { Play, ArrowLeftRight, Maximize2, Plus, Minus, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const SAMPLE_A = `{
  "name": "DevDesk",
  "version": "1.0.0",
  "theme": "dark",
  "features": ["markdown", "json", "diff"],
  "settings": {
    "autoSave": true,
    "fontSize": 14,
    "lineNumbers": true
  },
  "author": "Alice",
  "deprecated": "oldField"
}`;

const SAMPLE_B = `{
  "name": "DevDesk Pro",
  "version": "2.0.0",
  "theme": "system",
  "features": ["markdown", "json", "diff", "git"],
  "settings": {
    "autoSave": false,
    "fontSize": 16,
    "lineNumbers": true,
    "wordWrap": true
  },
  "author": "Alice",
  "license": "MIT"
}`;

// ─── Deep diff ────────────────────────────────────────────────
function computeDiff(a, b, mode, path = '') {
  const results = [];
  const keysA = (typeof a === 'object' && a !== null && !Array.isArray(a)) ? Object.keys(a) : [];
  const keysB = (typeof b === 'object' && b !== null && !Array.isArray(b)) ? Object.keys(b) : [];

  if (mode === 'keys') {
    const setA = new Set(keysA), setB = new Set(keysB);
    keysA.forEach(k => {
      const p = path ? `${path}.${k}` : k;
      if (!setB.has(k)) results.push({ path: p, type: 'removed', valueA: a[k], valueB: undefined });
      else if (typeof a[k] === 'object' && typeof b[k] === 'object' && a[k] !== null && b[k] !== null)
        results.push(...computeDiff(a[k], b[k], mode, p));
    });
    keysB.forEach(k => {
      const p = path ? `${path}.${k}` : k;
      if (!setA.has(k)) results.push({ path: p, type: 'added', valueA: undefined, valueB: b[k] });
    });
  } else {
    if (Array.isArray(a) && Array.isArray(b)) {
      const max = Math.max(a.length, b.length);
      for (let i = 0; i < max; i++) {
        const p = `${path}[${i}]`;
        if (i >= a.length) results.push({ path: p, type: 'added', valueA: undefined, valueB: b[i] });
        else if (i >= b.length) results.push({ path: p, type: 'removed', valueA: a[i], valueB: undefined });
        else if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
          if (typeof a[i] === 'object' && typeof b[i] === 'object') results.push(...computeDiff(a[i], b[i], mode, p));
          else results.push({ path: p, type: 'modified', valueA: a[i], valueB: b[i] });
        }
      }
    } else {
      const allKeys = new Set([...keysA, ...keysB]);
      allKeys.forEach(k => {
        const p = path ? `${path}.${k}` : k;
        const inA = k in (a || {}), inB = k in (b || {});
        if (!inA) results.push({ path: p, type: 'added', valueA: undefined, valueB: b[k] });
        else if (!inB) results.push({ path: p, type: 'removed', valueA: a[k], valueB: undefined });
        else if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) {
          if (typeof a[k] === 'object' && typeof b[k] === 'object' && a[k] !== null && b[k] !== null)
            results.push(...computeDiff(a[k], b[k], mode, p));
          else
            results.push({ path: p, type: 'modified', valueA: a[k], valueB: b[k] });
        }
      });
    }
  }
  return results;
}

// ─── LCS-based git-diff builder ──────────────────────────────
function buildGitDiff(rawA, rawB) {
  const linesA = rawA.split('\n'), linesB = rawB.split('\n');
  const m = linesA.length, n = linesB.length;
  const MAX = 500, safeM = Math.min(m, MAX), safeN = Math.min(n, MAX);
  const dp = Array.from({ length: safeM + 1 }, () => new Uint16Array(safeN + 1));
  for (let i = safeM - 1; i >= 0; i--)
    for (let j = safeN - 1; j >= 0; j--)
      dp[i][j] = linesA[i] === linesB[j] ? dp[i+1][j+1]+1 : Math.max(dp[i+1][j], dp[i][j+1]);

  const chunks = [];
  let i = 0, j = 0;
  while (i < safeM || j < safeN) {
    if (i < safeM && j < safeN && linesA[i] === linesB[j]) { chunks.push({ type: 'same',   lineA: i+1, lineB: j+1, content: linesA[i] }); i++; j++; }
    else if (j < safeN && (i >= safeM || dp[i][j+1] >= dp[i+1][j])) { chunks.push({ type: 'add',    lineA: null, lineB: j+1, content: linesB[j] }); j++; }
    else { chunks.push({ type: 'remove', lineA: i+1, lineB: null, content: linesA[i] }); i++; }
  }
  for (; i < m; i++) chunks.push({ type: 'remove', lineA: i+1, lineB: null, content: linesA[i] });
  for (; j < n; j++) chunks.push({ type: 'add',    lineA: null, lineB: j+1, content: linesB[j] });
  return chunks;
}

// ─── Git diff line ────────────────────────────────────────────
const LINE_STYLES = {
  same:   { bg: 'transparent',             color: '#64748b', prefix: ' ', prefixColor: '#475569' },
  add:    { bg: 'rgba(34,197,94,0.08)',    color: '#86efac', prefix: '+', prefixColor: '#4ade80' },
  remove: { bg: 'rgba(239,68,68,0.08)',   color: '#fca5a5', prefix: '-', prefixColor: '#f87171' },
};
function DiffLine({ chunk, lineNumA, lineNumB }) {
  const s = LINE_STYLES[chunk.type];
  return (
    <div className="flex items-stretch text-xs font-mono leading-5 select-text" style={{ background: s.bg, minHeight: '20px' }}>
      <span className="select-none text-right px-2 shrink-0 border-r" style={{ width: '3.2rem', color: '#334155', borderColor: 'rgba(255,255,255,0.05)', lineHeight: '20px' }}>{lineNumA || ''}</span>
      <span className="select-none text-right px-2 shrink-0 border-r" style={{ width: '3.2rem', color: '#334155', borderColor: 'rgba(255,255,255,0.05)', lineHeight: '20px' }}>{lineNumB || ''}</span>
      <span className="shrink-0 px-2 font-bold select-none" style={{ color: s.prefixColor, lineHeight: '20px', width: '1.5rem' }}>{s.prefix}</span>
      <span className="flex-1 px-1 whitespace-pre overflow-x-auto" style={{ color: s.color, lineHeight: '20px' }}>{chunk.content}</span>
    </div>
  );
}

// ─── Semantic diff row ────────────────────────────────────────
const DIFF_COLORS = {
  added:    { bg: 'rgba(34,197,94,0.07)',  color: '#4ade80', border: 'rgba(34,197,94,0.12)',  prefix: '+' },
  removed:  { bg: 'rgba(239,68,68,0.07)', color: '#f87171', border: 'rgba(239,68,68,0.12)',  prefix: '−' },
  modified: { bg: 'rgba(251,191,36,0.07)',color: '#fbbf24', border: 'rgba(251,191,36,0.12)', prefix: '~' },
};
function SemanticRow({ d }) {
  const c = DIFF_COLORS[d.type];
  const fmt = v => v === undefined ? '—' : JSON.stringify(v);
  return (
    <div
      className="grid text-xs font-mono px-3 py-1.5 border-b"
      style={{ gridTemplateColumns: '1rem 1fr 1fr 1fr', background: c.bg, borderColor: c.border, gap: '8px', alignItems: 'start' }}
    >
      <span style={{ color: c.color, fontWeight: 700 }}>{c.prefix}</span>
      <span style={{ color: c.color }}>{d.path}</span>
      <span style={{ color: '#f87171', wordBreak: 'break-all' }}>{fmt(d.valueA)}</span>
      <span style={{ color: '#4ade80', wordBreak: 'break-all' }}>{fmt(d.valueB)}</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────
export default function JsonDiff() {
  const [jsonA, setJsonA] = useState(SAMPLE_A);
  const [jsonB, setJsonB] = useState(SAMPLE_B);
  const [mode, setMode] = useState('value');
  const [gitChunks, setGitChunks] = useState(null);
  const [diffResults, setDiffResults] = useState(null);
  const [errorA, setErrorA] = useState('');
  const [errorB, setErrorB] = useState('');
  const [hasRun, setHasRun] = useState(false);
  const [bottomOpen, setBottomOpen] = useState(true);

  const editorARef = useRef(null);
  const editorBRef = useRef(null);
  const syncRef = useRef(null);

  const syncScrollA = () => {
    if (syncRef.current === 'b') return;
    syncRef.current = 'a';
    if (editorBRef.current && editorARef.current) {
      const pct = editorARef.current.scrollTop / (editorARef.current.scrollHeight - editorARef.current.clientHeight || 1);
      editorBRef.current.scrollTop = pct * (editorBRef.current.scrollHeight - editorBRef.current.clientHeight);
    }
    requestAnimationFrame(() => { syncRef.current = null; });
  };
  const syncScrollB = () => {
    if (syncRef.current === 'a') return;
    syncRef.current = 'b';
    if (editorARef.current && editorBRef.current) {
      const pct = editorBRef.current.scrollTop / (editorBRef.current.scrollHeight - editorBRef.current.clientHeight || 1);
      editorARef.current.scrollTop = pct * (editorARef.current.scrollHeight - editorARef.current.clientHeight);
    }
    requestAnimationFrame(() => { syncRef.current = null; });
  };

  const handleRunDiff = useCallback(() => {
    let parsedA, parsedB, ok = true;
    try { parsedA = JSON.parse(jsonA); setErrorA(''); } catch (e) { setErrorA(e.message); ok = false; }
    try { parsedB = JSON.parse(jsonB); setErrorB(''); } catch (e) { setErrorB(e.message); ok = false; }
    if (!ok) return;
    const prettyA = JSON.stringify(parsedA, null, 2);
    const prettyB = JSON.stringify(parsedB, null, 2);
    setGitChunks(buildGitDiff(prettyA, prettyB));
    setDiffResults(computeDiff(parsedA, parsedB, mode));
    setHasRun(true);
    setBottomOpen(true);
  }, [jsonA, jsonB, mode]);

  const handleBeautifyBoth = () => {
    try { setJsonA(JSON.stringify(JSON.parse(jsonA), null, 2)); } catch {}
    try { setJsonB(JSON.stringify(JSON.parse(jsonB), null, 2)); } catch {}
  };
  const handleSwap = () => {
    setJsonA(jsonB); setJsonB(jsonA);
    setGitChunks(null); setDiffResults(null); setHasRun(false);
  };

  const stats = diffResults ? {
    added:    diffResults.filter(d => d.type === 'added').length,
    removed:  diffResults.filter(d => d.type === 'removed').length,
    modified: diffResults.filter(d => d.type === 'modified').length,
  } : null;

  let lineCountA = 0, lineCountB = 0;

  // Top editor area height: shrinks when bottom panel is open
  const topHeight = hasRun && bottomOpen ? '42%' : 'calc(100% - 44px)';

  return (
    <div className="flex flex-col h-full animate-fade-in" style={{ minHeight: 0 }}>

      {/* ── Control Bar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 shrink-0 flex-wrap" style={{ background: 'rgba(13,18,32,0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <span className="text-sm font-semibold text-slate-300 mr-2">JSON Diff</span>
        <div className="h-4 w-px bg-slate-700" />
        <div className="flex items-center gap-0.5 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          {['value', 'keys'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === m ? 'bg-indigo-500/25 text-indigo-300' : 'text-slate-500 hover:text-slate-300'}`}>
              Diff by {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-slate-700" />
        <button onClick={handleBeautifyBoth} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/50 transition-all">
          <Maximize2 size={13} /> Beautify Both
        </button>
        <button onClick={handleSwap} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/50 transition-all">
          <ArrowLeftRight size={13} /> Swap
        </button>
        <button onClick={handleRunDiff} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all" style={{ background: 'rgba(16,185,129,0.15)', borderColor: 'rgba(16,185,129,0.3)', color: '#34d399' }}>
          <Play size={13} fill="#34d399" /> Run Diff
        </button>
        <div className="flex-1" />
        {stats && (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono font-semibold" style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80' }}><Plus size={10} />{stats.added}</span>
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded font-mono font-semibold" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}><Minus size={10} />{stats.removed}</span>
            <span className="text-xs text-slate-600">~{stats.modified} modified</span>
          </div>
        )}
      </div>

      {/* ── Top 50/50 Editors (always visible) ── */}
      <div className="flex shrink-0 overflow-hidden" style={{ height: topHeight, transition: 'height 0.2s ease', minHeight: '160px' }}>
        {/* JSON A */}
        <div className="flex flex-col w-1/2 h-full" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: 'rgba(10,14,26,0.9)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-xs font-semibold text-slate-400">JSON A — Original</span>
            </div>
            {errorA && <AlertCircle size={13} className="text-rose-400" title={errorA} />}
          </div>
          <textarea ref={editorARef} value={jsonA} onChange={e => { setJsonA(e.target.value); setHasRun(false); }} onScroll={syncScrollA} spellCheck={false} className="flex-1 resize-none w-full p-3 text-xs leading-5 outline-none overflow-y-scroll" style={{ background: '#080c18', color: '#94a3b8', fontFamily: 'var(--font-mono)', caretColor: '#f87171' }} />
          {errorA && <div className="px-3 py-2 text-xs font-mono shrink-0" style={{ background: 'rgba(239,68,68,0.08)', borderTop: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>⚠ {errorA}</div>}
        </div>

        {/* JSON B */}
        <div className="flex flex-col w-1/2 h-full overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: 'rgba(10,14,26,0.9)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-slate-400">JSON B — Modified</span>
            </div>
            {errorB && <AlertCircle size={13} className="text-rose-400" title={errorB} />}
          </div>
          <textarea ref={editorBRef} value={jsonB} onChange={e => { setJsonB(e.target.value); setHasRun(false); }} onScroll={syncScrollB} spellCheck={false} className="flex-1 resize-none w-full p-3 text-xs leading-5 outline-none overflow-y-scroll" style={{ background: '#080c18', color: '#94a3b8', fontFamily: 'var(--font-mono)', caretColor: '#34d399' }} />
          {errorB && <div className="px-3 py-2 text-xs font-mono shrink-0" style={{ background: 'rgba(239,68,68,0.08)', borderTop: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}>⚠ {errorB}</div>}
        </div>
      </div>

      {/* ── Bottom: Diff Results Panel ── */}
      {hasRun && (
        <div className="flex flex-col flex-1 overflow-hidden" style={{ borderTop: '2px solid rgba(99,102,241,0.3)', minHeight: 0 }}>

          {/* Panel header / toggle */}
          <div
            className="flex items-center gap-3 px-4 py-2 shrink-0 cursor-pointer select-none"
            style={{ background: 'rgba(8,12,24,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            onClick={() => setBottomOpen(o => !o)}
          >
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#818cf8' }}>Diff Results</span>
            <div className="h-3 w-px bg-slate-700" />
            <span className="text-xs font-mono text-slate-600">git diff</span>
            <span className="text-slate-700">·</span>
            <span className="text-xs font-mono text-slate-600">semantic changes</span>
            <div className="flex-1" />
            {stats && (
              <div className="flex items-center gap-3 mr-3 text-xs font-mono font-semibold">
                <span style={{ color: '#4ade80' }}>+{stats.added} added</span>
                <span style={{ color: '#f87171' }}>−{stats.removed} removed</span>
                <span style={{ color: '#fbbf24' }}>~{stats.modified} modified</span>
              </div>
            )}
            <span className="text-slate-500">
              {bottomOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </span>
          </div>

          {bottomOpen && (
            <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>

              {/* LEFT half: git-style unified diff */}
              <div className="flex flex-col w-1/2 overflow-hidden" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="px-3 py-1.5 shrink-0 font-mono text-xs font-semibold" style={{ background: 'rgba(99,102,241,0.06)', borderBottom: '1px solid rgba(99,102,241,0.12)', color: '#818cf8' }}>
                  --- a/original.json<br />+++ b/modified.json
                </div>
                <div className="flex-1 overflow-auto" style={{ background: '#080e1a' }}>
                  {gitChunks?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-green-400">
                      <span className="text-2xl">✓</span>
                      <p className="text-sm font-semibold">Files are identical</p>
                    </div>
                  ) : (
                    gitChunks?.map((chunk, idx) => {
                      if (chunk.type === 'remove') lineCountA++;
                      else if (chunk.type === 'add') lineCountB++;
                      else { lineCountA++; lineCountB++; }
                      const la = chunk.type !== 'add'    ? lineCountA : null;
                      const lb = chunk.type !== 'remove' ? lineCountB : null;
                      return <DiffLine key={idx} chunk={chunk} lineNumA={la} lineNumB={lb} />;
                    })
                  )}
                </div>
              </div>

              {/* RIGHT half: semantic diff table */}
              <div className="flex flex-col w-1/2 overflow-hidden">
                <div
                  className="grid text-xs font-semibold uppercase tracking-wider px-3 py-2 shrink-0"
                  style={{ gridTemplateColumns: '1rem 1fr 1fr 1fr', gap: '8px', background: 'rgba(8,12,24,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#475569' }}
                >
                  <span />
                  <span>Path</span>
                  <span style={{ color: '#f87171' }}>Before (A)</span>
                  <span style={{ color: '#4ade80' }}>After (B)</span>
                </div>
                <div className="flex-1 overflow-auto" style={{ background: '#080e1a' }}>
                  {!diffResults || diffResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-green-400">
                      <span className="text-2xl">✓</span>
                      <p className="text-sm font-semibold">No semantic differences</p>
                    </div>
                  ) : (
                    diffResults.map((d, i) => <SemanticRow key={i} d={d} />)
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
}
