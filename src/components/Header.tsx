import React from 'react';
import { Sparkles, Sliders, Cpu, Code2, Bot, Play, Layers } from 'lucide-react';

interface HeaderProps {
  activeTab: 'playground' | 'finetuning' | 'architecture' | 'code';
  setActiveTab: (tab: 'playground' | 'finetuning' | 'architecture' | 'code') => void;
  activeModelName: string;
  isFineTunedActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeModelName,
  isFineTunedActive,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Task-01 Badge */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white shadow-sm font-bold text-lg">
              <Bot className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 rounded-md border border-indigo-200">
                  Task-01
                </span>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  Text Generation with GPT-2
                </h1>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Transformer Fine-Tuning & Autoregressive Sampling Studio
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              id="tab-playground-btn"
              onClick={() => setActiveTab('playground')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'playground'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Playground</span>
            </button>

            <button
              id="tab-finetuning-btn"
              onClick={() => setActiveTab('finetuning')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'finetuning'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Fine-Tuning Lab</span>
              {isFineTunedActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>

            <button
              id="tab-architecture-btn"
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'architecture'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Architecture</span>
              <span className="md:hidden">Model</span>
            </button>

            <button
              id="tab-code-btn"
              onClick={() => setActiveTab('code')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'code'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">PyTorch Code</span>
              <span className="md:hidden">Code</span>
            </button>
          </nav>

        </div>
      </div>
    </header>
  );
};
