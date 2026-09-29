import React, { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';

const MarkdownStudio = lazy(() => import('./components/MarkdownStudio'));
const JsonExplorer = lazy(() => import('./components/JsonExplorer'));
const JsonDiff = lazy(() => import('./components/JsonDiff'));

function LoadingPane() {
  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#09101f' }}>
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl animate-spin"
          style={{
            background: 'conic-gradient(from 0deg, transparent, #6366f1)',
            mask: 'radial-gradient(circle at 50%, transparent 60%, black 61%)',
            WebkitMask: 'radial-gradient(circle at 50%, transparent 60%, black 61%)',
          }}
        />
        <p className="text-xs text-slate-500 font-medium">Loading tool…</p>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('markdown');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Global keyboard shortcuts: ⌘1, ⌘2, ⌘3 to switch tabs
  useEffect(() => {
    const handler = (e) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === '1') { e.preventDefault(); setActiveTab('markdown'); }
        if (e.key === '2') { e.preventDefault(); setActiveTab('json'); }
        if (e.key === '3') { e.preventDefault(); setActiveTab('diff'); }
        if (e.key === '\\') { e.preventDefault(); setSidebarCollapsed(c => !c); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toolMap = {
    markdown: <MarkdownStudio />,
    json: <JsonExplorer />,
    diff: <JsonDiff />,
  };

  const toolTitles = {
    markdown: 'Markdown Studio',
    json: 'JSON Explorer & Beautifier',
    diff: 'JSON Diff Comparator',
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#0a0e1a' }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Main content area */}
      <main className="flex flex-col flex-1 h-full overflow-hidden">
        {/* Top header bar */}
        <header
          className="flex items-center px-5 py-2.5 shrink-0"
          style={{
            background: 'rgba(10,14,26,0.98)',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">DevDesk</span>
            <span className="text-slate-700">/</span>
            <span className="text-slate-300 font-medium">{toolTitles[activeTab]}</span>
          </div>

          <div className="flex-1" />

          {/* Keyboard shortcut hints */}
          <div className="hidden md:flex items-center gap-3 text-xs text-slate-700">
            <span><kbd className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>⌘1</kbd> Markdown</span>
            <span><kbd className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>⌘2</kbd> JSON</span>
            <span><kbd className="px-1 py-0.5 rounded text-xs" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>⌘3</kbd> Diff</span>
          </div>
        </header>

        {/* Tool content */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<LoadingPane />}>
            {toolMap[activeTab]}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
