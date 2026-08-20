import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  Sliders,
  Copy,
  Check,
  Download,
  Info,
  Layers,
  Zap,
  Split,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { ModelType, GenerationParams, TokenInfo, GenerationResult } from '../types';
import { DATASET_PRESETS } from '../data/presets';

interface PlaygroundViewProps {
  selectedModel: ModelType;
  setSelectedModel: (model: ModelType) => void;
  customDatasetText: string;
  hasTrainedCustom: boolean;
  onNavigateToFineTuning: () => void;
}

export const PlaygroundView: React.FC<PlaygroundViewProps> = ({
  selectedModel,
  setSelectedModel,
  customDatasetText,
  hasTrainedCustom,
  onNavigateToFineTuning,
}) => {
  const [prompt, setPrompt] = useState<string>('Shall I compare thee to a summer’s day?');
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedMain, setCopiedMain] = useState<boolean>(false);
  const [copiedBase, setCopiedBase] = useState<boolean>(false);
  const [viewTokens, setViewTokens] = useState<boolean>(true);
  const [hoveredToken, setHoveredToken] = useState<TokenInfo | null>(null);

  // Generation parameters
  const [params, setParams] = useState<GenerationParams>({
    temperature: 0.75,
    topK: 40,
    topP: 0.90,
    maxTokens: 120,
    repetitionPenalty: 1.1,
  });

  // Results
  const [mainResult, setMainResult] = useState<GenerationResult | null>({
    modelName: 'GPT-2 Fine-Tuned on Shakespearean Plays & Sonnets',
    modelType: 'gpt2-shakespeare',
    prompt: 'Shall I compare thee to a summer’s day?',
    continuation: 'Thou art more lovely and more temperate: Rough winds do shake the darling buds of May, and summer’s lease hath all too short a date.',
    fullText: 'Shall I compare thee to a summer’s day? Thou art more lovely and more temperate: Rough winds do shake the darling buds of May, and summer’s lease hath all too short a date.',
    tokens: [
      { text: 'Thou', id: 18451, bytes: [84, 104, 111, 117], probability: 0.94 },
      { text: ' art', id: 2471, bytes: [32, 97, 114, 116], probability: 0.91 },
      { text: ' more', id: 517, bytes: [32, 109, 111, 114, 101], probability: 0.89 },
      { text: ' lovely', id: 8943, bytes: [32, 108, 111, 118, 101, 108, 121], probability: 0.88 },
      { text: ' and', id: 290, bytes: [32, 97, 110, 100], probability: 0.96 },
      { text: ' more', id: 517, bytes: [32, 109, 111, 114, 101], probability: 0.84 },
      { text: ' temperate', id: 31201, bytes: [32, 116, 101, 109, 112, 101, 114, 97, 116, 101], probability: 0.92 },
      { text: ':', id: 25, bytes: [58], probability: 0.79 },
      { text: ' Rough', id: 22119, bytes: [32, 82, 111, 117, 103, 104], probability: 0.81 },
      { text: ' winds', id: 8933, bytes: [32, 119, 105, 110, 100, 115], probability: 0.87 },
      { text: ' do', id: 466, bytes: [32, 100, 111], probability: 0.93 },
      { text: ' shake', id: 11044, bytes: [32, 115, 104, 97, 107, 101], probability: 0.90 },
      { text: ' the', id: 262, bytes: [32, 116, 104, 101], probability: 0.98 },
      { text: ' darling', id: 27941, bytes: [32, 100, 97, 114, 108, 105, 110, 103], probability: 0.85 },
      { text: ' buds', id: 29482, bytes: [32, 98, 117, 100, 115], probability: 0.89 },
      { text: ' of', id: 286, bytes: [32, 111, 102], probability: 0.97 },
      { text: ' May', id: 2420, bytes: [32, 77, 97, 121], probability: 0.95 },
      { text: ',', id: 11, bytes: [44], probability: 0.83 },
      { text: ' and', id: 290, bytes: [32, 97, 110, 100], probability: 0.86 },
      { text: ' summer', id: 4266, bytes: [32, 115, 117, 109, 109, 101, 114], probability: 0.91 },
      { text: '’s', id: 834, bytes: [226, 128, 153, 115], probability: 0.88 },
      { text: ' lease', id: 9680, bytes: [32, 108, 101, 97, 115, 101], probability: 0.84 },
      { text: ' hath', id: 24651, bytes: [32, 104, 97, 116, 104], probability: 0.89 },
      { text: ' all', id: 477, bytes: [32, 97, 108, 108], probability: 0.92 },
      { text: ' too', id: 1165, bytes: [32, 116, 111, 111], probability: 0.91 },
      { text: ' short', id: 1790, bytes: [32, 115, 104, 111, 114, 116], probability: 0.89 },
      { text: ' a', id: 257, bytes: [32, 97], probability: 0.95 },
      { text: ' date', id: 4181, bytes: [32, 100, 97, 116, 101], probability: 0.93 },
      { text: '.', id: 13, bytes: [46], probability: 0.88 },
    ],
    generationParams: {
      temperature: 0.75,
      topK: 40,
      topP: 0.90,
      maxTokens: 120,
      repetitionPenalty: 1.1,
    },
  });

  const [baseResult, setBaseResult] = useState<GenerationResult | null>(null);

  const handlePromptSelect = (presetPrompt: string, modelId: ModelType) => {
    setPrompt(presetPrompt);
    setSelectedModel(modelId);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);

    try {
      // 1. Generate for primary model
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          modelType: selectedModel,
          customDatasetText: selectedModel === 'gpt2-custom' ? customDatasetText : '',
          temperature: params.temperature,
          topK: params.topK,
          topP: params.topP,
          maxTokens: params.maxTokens,
          repetitionPenalty: params.repetitionPenalty,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMainResult(data);
      }

      // 2. If Compare Mode is enabled and selected model isn't vanilla base, generate vanilla base completion
      if (compareMode && selectedModel !== 'gpt2-base') {
        const baseRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            modelType: 'gpt2-base',
            temperature: params.temperature,
            topK: params.topK,
            topP: params.topP,
            maxTokens: params.maxTokens,
            repetitionPenalty: params.repetitionPenalty,
          }),
        });
        const baseData = await baseRes.json();
        if (baseData.success) {
          setBaseResult(baseData);
        }
      }
    } catch (err) {
      console.error('Generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, isBase = false) => {
    navigator.clipboard.writeText(text);
    if (isBase) {
      setCopiedBase(true);
      setTimeout(() => setCopiedBase(false), 2000);
    } else {
      setCopiedMain(true);
      setTimeout(() => setCopiedMain(false), 2000);
    }
  };

  const downloadText = (text: string, filename: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner introducing Task-01 Concept */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Autoregressive Decoder
              </span>
              <span className="text-xs text-slate-400">117M Parameters • Vocab 50,257</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              GPT-2 Fine-Tuned Text Generation
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Feed an initial prompt into GPT-2 to observe how the transformer model predicts subsequent tokens autoregressively. Fine-tuning adjusts pretrained weights to adopt custom syntax, domain vocabulary, and structure.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-goto-finetune"
              onClick={onNavigateToFineTuning}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Sliders className="w-4 h-4" />
              <span>Fine-Tune Custom Dataset</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Prompt Input & Parameters (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Model Selection Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Select Model Checkpoint
              </label>
              {selectedModel !== 'gpt2-base' && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Fine-Tuned Adapter
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2">
              {/* Vanilla Base */}
              <button
                id="model-opt-base"
                onClick={() => setSelectedModel('gpt2-base')}
                className={`flex items-start text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedModel === 'gpt2-base'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="mr-3 mt-0.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedModel === 'gpt2-base' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                    {selectedModel === 'gpt2-base' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span>GPT-2 Base (Pretrained)</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">WebText</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Original OpenAI 117M model without domain fine-tuning.
                  </p>
                </div>
              </button>

              {/* Preset Fine-Tuned Models */}
              {DATASET_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  id={`model-opt-${preset.id}`}
                  onClick={() => setSelectedModel(preset.id)}
                  className={`flex items-start text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedModel === preset.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="mr-3 mt-0.5">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedModel === preset.id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                      {selectedModel === preset.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <span>{preset.name}</span>
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-medium">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {preset.description}
                    </p>
                  </div>
                </button>
              ))}

              {/* Custom User Model */}
              <button
                id="model-opt-custom"
                onClick={() => setSelectedModel('gpt2-custom')}
                className={`flex items-start text-left p-3 rounded-lg border transition-all cursor-pointer ${
                  selectedModel === 'gpt2-custom'
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="mr-3 mt-0.5">
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedModel === 'gpt2-custom' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                    {selectedModel === 'gpt2-custom' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span>Custom Fine-Tuned Model</span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                      User Dataset
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {hasTrainedCustom
                      ? 'Fine-tuned weights trained on your uploaded text.'
                      : 'Create or upload your text in the Fine-Tuning Lab tab.'}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Prompt Input Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="prompt-input" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Input Prompt Sequence
              </label>
              <span className="text-xs text-slate-400">
                {prompt.length} chars
              </span>
            </div>

            <textarea
              id="prompt-input"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type or paste the starting text prompt for GPT-2 to complete..."
              className="w-full p-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-mono text-slate-800 transition-all outline-none resize-none"
            />

            {/* Quick Inspiration Prompts */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quick Sample Prompts:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {DATASET_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handlePromptSelect(p.samplePrompt, p.id)}
                    className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200/80 transition-all text-left truncate max-w-full"
                  >
                    "{p.samplePrompt.slice(0, 32)}..."
                  </button>
                ))}
              </div>
            </div>

            {/* Compare with Vanilla Toggle */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="compare-mode-toggle"
                  checked={compareMode}
                  onChange={(e) => setCompareMode(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="compare-mode-toggle" className="text-xs font-medium text-slate-700 cursor-pointer flex items-center gap-1">
                  <Split className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dual Side-by-Side Comparison (Base vs Fine-Tuned)</span>
                </label>
              </div>
            </div>

            {/* Generate Button */}
            <button
              id="btn-generate-text"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all shadow-sm cursor-pointer ${
                isGenerating || !prompt.trim()
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]'
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Autoregressive Sampling in Progress...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate GPT-2 Text Continuation</span>
                </>
              )}
            </button>
          </div>

          {/* Hyperparameter Sampling Controls Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sampling Hyperparameters
                </h3>
              </div>
              <button
                onClick={() =>
                  setParams({
                    temperature: 0.75,
                    topK: 40,
                    topP: 0.90,
                    maxTokens: 120,
                    repetitionPenalty: 1.1,
                  })
                }
                className="text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                title="Reset to defaults"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  Temperature ({params.temperature})
                </span>
                <span className="text-slate-400 text-[11px]">
                  {params.temperature < 0.4
                    ? 'Deterministic / Strict'
                    : params.temperature > 1.0
                    ? 'Creative / Random'
                    : 'Balanced'}
                </span>
              </div>
              <input
                id="slider-temperature"
                type="range"
                min="0.1"
                max="1.5"
                step="0.05"
                value={params.temperature}
                onChange={(e) => setParams({ ...params, temperature: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Divides logit scores before Softmax. Lower = sharper highest-probability picks.
              </p>
            </div>

            {/* Top-K Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">
                  Top-K Sampling ({params.topK})
                </span>
                <span className="text-slate-400 text-[11px]">Keep Top {params.topK} Tokens</span>
              </div>
              <input
                id="slider-topk"
                type="range"
                min="1"
                max="100"
                step="1"
                value={params.topK}
                onChange={(e) => setParams({ ...params, topK: parseInt(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Filters candidate pool to top K most likely vocabulary tokens.
              </p>
            </div>

            {/* Top-P (Nucleus) Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">
                  Top-P (Nucleus) ({params.topP})
                </span>
                <span className="text-slate-400 text-[11px]">
                  {Math.round(params.topP * 100)}% Cumulative Prob
                </span>
              </div>
              <input
                id="slider-topp"
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={params.topP}
                onChange={(e) => setParams({ ...params, topP: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Picks smallest set of tokens whose cumulative probability exceeds P.
              </p>
            </div>

            {/* Max Output Tokens */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">
                  Max Output Tokens ({params.maxTokens})
                </span>
                <span className="text-slate-400 text-[11px]">~{Math.round(params.maxTokens * 0.75)} words</span>
              </div>
              <input
                id="slider-maxtokens"
                type="range"
                min="30"
                max="300"
                step="10"
                value={params.maxTokens}
                onChange={(e) => setParams({ ...params, maxTokens: parseInt(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Right Column: Output Showcase & Token Inspector (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Main Output Box */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            
            {/* Header with model name & copy controls */}
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-xs sm:text-sm text-slate-800">
                  {mainResult?.modelName || 'Output Stream'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewTokens(!viewTokens)}
                  className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
                    viewTokens
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {viewTokens ? 'Token Probabilities' : 'Plain Text'}
                </button>

                <button
                  id="btn-copy-main-output"
                  onClick={() => mainResult && copyToClipboard(mainResult.fullText, false)}
                  className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center space-x-1"
                >
                  {copiedMain ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => mainResult && downloadText(mainResult.fullText, `gpt2_output_${selectedModel}.txt`)}
                  className="text-xs p-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                  title="Download .txt"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 min-h-[220px]">
              {mainResult ? (
                <div className="space-y-4">
                  {/* Text representation */}
                  <div className="text-sm sm:text-base leading-relaxed text-slate-800 font-serif">
                    <span className="font-semibold text-indigo-900 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100">
                      {mainResult.prompt}
                    </span>
                    <span> </span>
                    <span className="text-slate-800">
                      {mainResult.continuation}
                    </span>
                  </div>

                  {/* Token breakdown visualizer */}
                  {viewTokens && mainResult.tokens && mainResult.tokens.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold uppercase tracking-wider text-[10px]">
                          Autoregressive BPE Subword Tokens ({mainResult.tokens.length} tokens generated):
                        </span>
                        <span className="text-[11px] text-indigo-600">
                          Hover a token for ID & Probability
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 p-3 bg-slate-50/80 rounded-lg border border-slate-200/80 font-mono text-xs max-h-48 overflow-y-auto">
                        {mainResult.tokens.map((tok, idx) => {
                          const probPct = Math.round(tok.probability * 100);
                          let bgClass = 'bg-emerald-50 text-emerald-900 border-emerald-200';
                          if (probPct < 70) bgClass = 'bg-amber-50 text-amber-900 border-amber-200';
                          if (probPct < 40) bgClass = 'bg-rose-50 text-rose-900 border-rose-200';

                          return (
                            <span
                              key={idx}
                              onMouseEnter={() => setHoveredToken(tok)}
                              onMouseLeave={() => setHoveredToken(null)}
                              className={`inline-block px-1.5 py-0.5 rounded border text-[11px] cursor-pointer transition-all hover:scale-105 ${bgClass}`}
                            >
                              {tok.text.replace(/ /g, '␣')}
                            </span>
                          );
                        })}
                      </div>

                      {/* Token Inspector Detail Pill */}
                      {hoveredToken && (
                        <div className="p-3 bg-indigo-900 text-white rounded-lg text-xs flex items-center justify-between shadow-md transition-all animate-fadeIn">
                          <div className="flex items-center space-x-3">
                            <span className="font-mono font-bold bg-white/20 px-2 py-0.5 rounded">
                              "{hoveredToken.text}"
                            </span>
                            <span className="text-indigo-200">
                              Token ID: <strong className="text-white">#{hoveredToken.id}</strong>
                            </span>
                            <span className="text-indigo-200">
                              Byte values: <strong className="text-white">[{hoveredToken.bytes.join(', ')}]</strong>
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-indigo-200">Softmax Prob:</span>
                            <span className="font-bold text-emerald-300">
                              {(hoveredToken.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
                  <Play className="w-10 h-10 text-slate-300 mb-2 stroke-1" />
                  <p className="text-sm">Click "Generate GPT-2 Text Continuation" to start.</p>
                </div>
              )}
            </div>
          </div>

          {/* Dual Comparison Mode Box (When compare mode is active) */}
          {compareMode && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="font-bold text-xs sm:text-sm text-slate-800">
                    Baseline Comparison: Vanilla GPT-2 (Pretrained on WebText)
                  </span>
                </div>
                <button
                  onClick={() => baseResult && copyToClipboard(baseResult.fullText, true)}
                  className="text-xs px-2.5 py-1 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center space-x-1"
                >
                  {copiedBase ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedBase ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="p-5">
                {baseResult ? (
                  <div className="text-sm leading-relaxed text-slate-700 font-serif">
                    <span className="font-semibold text-slate-900 bg-slate-100 px-1 py-0.5 rounded">
                      {baseResult.prompt}
                    </span>
                    <span> </span>
                    <span>{baseResult.continuation}</span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Base vanilla model comparison will appear here upon generation.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Educational Insights Box */}
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-950 font-bold text-xs uppercase tracking-wider">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>How GPT-2 Autoregressive Generation Operates:</span>
            </div>
            <p className="text-xs text-indigo-900/80 leading-relaxed">
              At step <code className="bg-white/80 px-1 py-0.5 rounded text-indigo-950 font-mono">t</code>, GPT-2 computes hidden states across its 12 self-attention layers for all previous tokens <code className="bg-white/80 px-1 py-0.5 rounded text-indigo-950 font-mono">x_1 ... x_t</code>. The final layer emits 50,257 unnormalized logits. Softmax with temperature scaling transforms logits into a probability distribution. The chosen token is appended to the input sequence for step <code className="bg-white/80 px-1 py-0.5 rounded text-indigo-950 font-mono">t+1</code>.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
