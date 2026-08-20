import React, { useState } from 'react';
import {
  Layers,
  Cpu,
  Eye,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight,
  Hash,
  Box
} from 'lucide-react';
import { MODEL_ARCHITECTURE_METRICS } from '../data/presets';

export const ArchitectureView: React.FC = () => {
  const [testSentence, setTestSentence] = useState<string>('The transformer model generates text');
  const [selectedHead, setSelectedHead] = useState<number>(1);
  const [hoveredCell, setHoveredCell] = useState<{ query: string; key: string; weight: number } | null>(null);

  const tokens = testSentence.trim().split(/\s+/).filter(Boolean);

  // Generate simulated causal attention weights matrix (lower triangular with realistic softmax distribution)
  const computeAttentionMatrix = (head: number) => {
    return tokens.map((qTok, i) => {
      // For token at index i, it can only attend to j <= i (causal mask)
      const rawWeights = tokens.map((kTok, j) => {
        if (j > i) return 0; // Causal mask
        // Deterministic pseudo-attention score based on head and token similarity
        const baseScore = Math.abs(Math.sin((i + 1) * (j + 1) * head * 0.73)) + (i === j ? 1.4 : 0.8);
        return baseScore;
      });

      // Softmax normalization over valid keys (0..i)
      const sum = rawWeights.reduce((acc, val, j) => (j <= i ? acc + val : acc), 0) || 1;
      return rawWeights.map((w, j) => (j <= i ? Number((w / sum).toFixed(3)) : 0));
    });
  };

  const attentionMatrix = computeAttentionMatrix(selectedHead);

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                Transformer Anatomy
              </span>
              <span className="text-xs text-slate-500">Radford et al. (OpenAI 2019)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              GPT-2 Decoder-Only Architecture
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl mt-1 leading-relaxed">
              Unlike BERT (encoder-only) or T5 (encoder-decoder), GPT-2 is a <strong>causal autoregressive decoder</strong>. It employs masked multi-head self-attention to ensure tokens can only attend to preceding tokens in the context window.
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Parameters</span>
          <div className="text-base font-bold text-indigo-900 mt-0.5">117 Million</div>
          <span className="text-[10px] text-slate-400">Small Variant</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Decoder Layers</span>
          <div className="text-base font-bold text-slate-900 mt-0.5">12 Blocks</div>
          <span className="text-[10px] text-slate-400">Stacked Pre-LN</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Attention Heads</span>
          <div className="text-base font-bold text-slate-900 mt-0.5">12 Heads</div>
          <span className="text-[10px] text-slate-400">64-dim per head</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Embedding Dim</span>
          <div className="text-base font-bold text-slate-900 mt-0.5">768 Dim</div>
          <span className="text-[10px] text-slate-400">d_model</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Vocabulary Size</span>
          <div className="text-base font-bold text-slate-900 mt-0.5">50,257 BPE</div>
          <span className="text-[10px] text-slate-400">Byte-Pair Encodings</span>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Context Window</span>
          <div className="text-base font-bold text-purple-700 mt-0.5">1,024 Tokens</div>
          <span className="text-[10px] text-slate-400">Max Sequence</span>
        </div>
      </div>

      {/* Main Content Grid: Architecture Pipeline & Interactive Attention Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Multi-Head Causal Attention Heatmap (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Interactive Causal Self-Attention Matrix
              </h3>
            </div>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-slate-500 mr-1 font-medium">Attention Head:</span>
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3, 4, 8, 12].map((h) => (
                  <button
                    key={h}
                    onClick={() => setSelectedHead(h)}
                    className={`px-2 py-0.5 text-xs rounded border transition-all cursor-pointer ${
                      selectedHead === h
                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    H{h}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Test Sentence Input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              Input Sentence for Attention Computation:
            </label>
            <input
              type="text"
              value={testSentence}
              onChange={(e) => setTestSentence(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-xs font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
            />
          </div>

          {/* Heatmap Container */}
          <div className="space-y-3 pt-2">
            <div className="text-xs text-slate-500 flex justify-between">
              <span>Rows = Query ($Q$) • Columns = Key ($K$)</span>
              <span className="text-indigo-600 font-semibold">Upper triangle = 0.00 (Causal Mask)</span>
            </div>

            <div className="overflow-x-auto pb-2">
              <table className="min-w-full border-collapse font-mono text-xs">
                <thead>
                  <tr>
                    <th className="p-1.5 text-left text-slate-400 font-normal">Q \ K</th>
                    {tokens.map((tok, j) => (
                      <th key={j} className="p-1.5 text-center text-slate-700 font-semibold truncate max-w-[80px]">
                        {tok}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((qTok, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="p-1.5 font-semibold text-slate-700 truncate max-w-[80px] bg-slate-50/50">
                        {qTok}
                      </td>
                      {tokens.map((kTok, j) => {
                        const isMasked = j > i;
                        const weight = attentionMatrix[i]?.[j] || 0;
                        const alpha = isMasked ? 0 : weight;
                        
                        return (
                          <td
                            key={j}
                            onMouseEnter={() =>
                              !isMasked && setHoveredCell({ query: qTok, key: kTok, weight })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`p-2 text-center transition-all cursor-pointer ${
                              isMasked
                                ? 'bg-slate-100/60 text-slate-300'
                                : 'hover:ring-2 hover:ring-indigo-500'
                            }`}
                            style={{
                              backgroundColor: !isMasked
                                ? `rgba(79, 70, 229, ${Math.max(0.08, alpha)})`
                                : undefined,
                              color: !isMasked && alpha > 0.4 ? '#ffffff' : undefined,
                            }}
                          >
                            {isMasked ? '—' : weight.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Hover Tooltip Details */}
            {hoveredCell ? (
              <div className="p-3 bg-slate-900 text-white rounded-lg text-xs flex items-center justify-between shadow-sm animate-fadeIn">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400">Query Token:</span>
                  <strong className="text-indigo-300 font-mono font-bold">"{hoveredCell.query}"</strong>
                  <span className="text-slate-400">→ Key Token:</span>
                  <strong className="text-purple-300 font-mono font-bold">"{hoveredCell.key}"</strong>
                </div>
                <div>
                  <span className="text-slate-400">Attention Weight: </span>
                  <strong className="text-emerald-400 font-mono text-sm">
                    {(hoveredCell.weight * 100).toFixed(1)}%
                  </strong>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 text-center">
                Hover over non-masked matrix cells to inspect directional attention affinity.
              </p>
            )}
          </div>
        </div>

        {/* Right: Layer-by-Layer Architectural Flow (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              12-Layer Transformer Pipeline
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            
            {/* 1. Input Embeddings */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>1. Token & Positional Embeddings</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">768-D</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Input token indices matrix (50,257 × 768) added to learned positional embeddings (1,024 × 768).
              </p>
            </div>

            {/* Down Arrow */}
            <div className="flex justify-center text-slate-400">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>

            {/* 2. 12x Decoder Blocks Stack */}
            <div className="p-3.5 rounded-lg border-2 border-indigo-300 bg-indigo-50/50 space-y-2">
              <div className="font-bold text-indigo-950 flex items-center justify-between">
                <span>2. 12x Transformer Decoder Blocks</span>
                <span className="text-[10px] bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full font-bold">12 Repetitions</span>
              </div>
              
              <div className="space-y-1.5 pl-2 border-l-2 border-indigo-200">
                <div className="p-2 bg-white rounded border border-indigo-100 text-[11px]">
                  <strong className="text-slate-800">LayerNorm 1:</strong> Pre-Layer Normalization (mean=0, std=1)
                </div>
                <div className="p-2 bg-white rounded border border-indigo-100 text-[11px]">
                  <strong className="text-slate-800">Masked Multi-Head Attention:</strong> 12 heads calculate QK^T / sqrt(64) with lower-triangular causal mask.
                </div>
                <div className="p-2 bg-white rounded border border-indigo-100 text-[11px]">
                  <strong className="text-slate-800">Residual Addition:</strong> x = x + Attention(x)
                </div>
                <div className="p-2 bg-white rounded border border-indigo-100 text-[11px]">
                  <strong className="text-slate-800">LayerNorm 2:</strong> Pre-MLP Normalization
                </div>
                <div className="p-2 bg-white rounded border border-indigo-100 text-[11px]">
                  <strong className="text-slate-800">Feed-Forward Network (GELU):</strong> Linear 768 → 3072 → 768 with GELU activation.
                </div>
                <div className="p-2 bg-white rounded border border-indigo-100 text-[11px]">
                  <strong className="text-slate-800">Residual Addition:</strong> x = x + FFN(x)
                </div>
              </div>
            </div>

            {/* Down Arrow */}
            <div className="flex justify-center text-slate-400">
              <ChevronRight className="w-4 h-4 rotate-90" />
            </div>

            {/* 3. Final LayerNorm & Language Modeling Head */}
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>3. Final LayerNorm & LM Head</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">50,257 Logits</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Hidden dimension 768 → Linear → 50,257 unnormalized logits. Softmax produces probability vector for next token sampling.
              </p>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
