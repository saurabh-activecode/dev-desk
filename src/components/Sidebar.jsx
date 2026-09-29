import React from 'react';
import { FileText, Code, GitCompare, ChevronLeft, ChevronRight, Terminal, Zap } from 'lucide-react';

const navItems = [
  {
    id: 'markdown',
    label: 'Markdown Studio',
    icon: FileText,
    description: 'Live preview & Mermaid',
    color: 'from-violet-500 to-indigo-500',
    glow: 'rgba(139,92,246,0.3)',
  },
  {
    id: 'json',
    label: 'JSON Explorer',
    icon: Code,
    description: 'Validate & beautify',
    color: 'from-cyan-500 to-blue-500',
    glow: 'rgba(6,182,212,0.3)',
  },
  {
    id: 'diff',
    label: 'JSON Diff',
    icon: GitCompare,
    description: 'Compare & contrast',
    color: 'from-emerald-500 to-teal-500',
    glow: 'rgba(16,185,129,0.3)',
  },
];

export default function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed }) {
  return (
    <aside
      className={`flex flex-col h-full transition-all duration-300 ease-in-out relative z-20 shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}
      style={{
        background: 'linear-gradient(180deg, #0d1220 0%, #0a0e1a 100%)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Header / Branding */}
      <div
        className="flex items-center gap-3 px-3 py-4 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 animate-pulse-glow"
          style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}
        >
          <Terminal size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <div className="font-bold text-white text-base leading-none tracking-tight">DevDesk</div>
            <div className="text-xs text-slate-500 mt-0.5">Developer Toolkit</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 mt-2">
        {!collapsed && (
          <div className="px-2 mb-3 animate-fade-in">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest">Tools</span>
          </div>
        )}
        {navItems.map(({ id, label, icon: Icon, description, color, glow }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                collapsed ? 'px-2.5 py-2.5 justify-center' : 'px-3 py-2.5'
              } ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
              style={{
                background: isActive
                  ? 'rgba(99,102,241,0.15)'
                  : 'transparent',
                boxShadow: isActive ? `0 0 0 1px rgba(99,102,241,0.3), inset 0 0 20px rgba(99,102,241,0.05)` : 'none',
              }}
              title={collapsed ? label : undefined}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div
                  className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full"
                  style={{ background: 'linear-gradient(180deg, #6366f1, #818cf8)' }}
                />
              )}

              {/* Icon with gradient bg when active */}
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${
                  isActive ? 'bg-gradient-to-br ' + color : 'bg-slate-800/60 group-hover:bg-slate-700/60'
                }`}
                style={isActive ? { boxShadow: `0 0 12px ${glow}` } : {}}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'} />
              </div>

              {/* Labels */}
              {!collapsed && (
                <div className="flex flex-col items-start min-w-0 animate-fade-in">
                  <span className={`text-sm font-medium leading-none ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {label}
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5 truncate">{description}</span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div
        className="p-3 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        {!collapsed && (
          <div
            className="rounded-xl p-3 mb-3 animate-fade-in"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap size={12} className="text-indigo-400" />
              <span className="text-xs font-semibold text-indigo-400">Pro Tip</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Use ⌘+1/2/3 to switch tools instantly.
            </p>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className={`w-full flex items-center justify-center rounded-xl p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all duration-200 ${collapsed ? '' : 'gap-2'}`}
        >
          {collapsed ? (
            <ChevronRight size={16} />
          ) : (
            <>
              <ChevronLeft size={16} />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
