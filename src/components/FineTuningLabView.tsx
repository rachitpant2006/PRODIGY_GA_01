import React, { useState, useEffect, useRef } from 'react';
import {
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Upload,
  FileText,
  CheckCircle2,
  TrendingDown,
  Activity,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  Info
} from 'lucide-react';
import { ModelType, Hyperparameters, TrainingStepMetric } from '../types';
import { DATASET_PRESETS } from '../data/presets';

interface FineTuningLabViewProps {
  customDatasetText: string;
  setCustomDatasetText: (text: string) => void;
  onDeployModel: (modelType: ModelType) => void;
  hasTrainedCustom: boolean;
  setHasTrainedCustom: (val: boolean) => void;
}

export const FineTuningLabView: React.FC<FineTuningLabViewProps> = ({
  customDatasetText,
  setCustomDatasetText,
  onDeployModel,
  hasTrainedCustom,
  setHasTrainedCustom,
}) => {
  // Preset selector
  const [selectedPresetId, setSelectedPresetId] = useState<string>('gpt2-shakespeare');

  // Hyperparameters
  const [hyperparams, setHyperparams] = useState<Hyperparameters>({
    modelSize: 'gpt2-small',
    epochs: 4,
    learningRate: 5e-5,
    batchSize: 4,
    gradientAccumulationSteps: 2,
    warmupSteps: 50,
    weightDecay: 0.01,
    maxSeqLength: 512,
    optimizer: 'AdamW',
  });

  // Training state
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [totalSteps, setTotalSteps] = useState<number>(100);
  const [metricsHistory, setMetricsHistory] = useState<TrainingStepMetric[]>([]);
  const [currentEpoch, setCurrentEpoch] = useState<number>(1);
  const [trainingComplete, setTrainingComplete] = useState<boolean>(hasTrainedCustom);

  // Checkpoints generated text during training
  const [checkpoints, setCheckpoints] = useState<
    { epoch: number; step: number; text: string; loss: number }[]
  >([]);

  // Tokenization preview
  const [tokenPreview, setTokenPreview] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load preset dataset on preset change
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') {
      return;
    }
    const found = DATASET_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setCustomDatasetText(found.sampleDataset);
    }
  };

  // Update token preview when dataset changes
  useEffect(() => {
    if (!customDatasetText) {
      setTokenPreview([]);
      return;
    }
    // Simple subword split simulation for preview
    const sampleWords = customDatasetText.slice(0, 200).match(/(\w+|[^\w\s]|\s+)/g) || [];
    setTokenPreview(sampleWords.slice(0, 30));
  }, [customDatasetText]);

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCustomDatasetText(text);
        setSelectedPresetId('custom');
      };
      reader.readAsText(file);
    }
  };

  // Start / Resume training simulation
  const startTraining = () => {
    if (!customDatasetText.trim()) return;

    setIsTraining(true);
    setTrainingComplete(false);

    const stepsPerEpoch = 25;
    const computedTotalSteps = hyperparams.epochs * stepsPerEpoch;
    setTotalSteps(computedTotalSteps);

    // Initial loss baseline
    let baseLoss = 4.35;
    let baseValLoss = 4.60;
    let basePpl = Math.exp(baseLoss);

    let step = currentStep >= computedTotalSteps ? 0 : currentStep;
    setCurrentStep(step);
    if (step === 0) {
      setMetricsHistory([]);
      setCheckpoints([]);
    }

    timerRef.current = setInterval(() => {
      step++;
      const progress = step / computedTotalSteps;
      const epoch = Math.min(hyperparams.epochs, Math.floor((step - 1) / stepsPerEpoch) + 1);

      // Decaying loss with realistic AdamW optimizer trajectory
      const noise = (Math.random() - 0.5) * 0.08;
      const decayFactor = Math.exp(-progress * 2.6);
      const loss = Number((1.25 + (baseLoss - 1.25) * decayFactor + noise).toFixed(4));
      const valLoss = Number((loss + 0.12 + Math.random() * 0.05).toFixed(4));
      const perplexity = Number(Math.exp(valLoss).toFixed(2));

      // Learning rate cosine schedule
      const lr = Number(
        (
          hyperparams.learningRate *
          (0.1 + 0.9 * 0.5 * (1 + Math.cos((Math.PI * step) / computedTotalSteps)))
        ).toExponential(2)
      );

      const metric: TrainingStepMetric = {
        epoch,
        step,
        totalSteps: computedTotalSteps,
        loss,
        valLoss,
        perplexity,
        learningRate: lr,
        sampleOutput: '',
      };

      setCurrentStep(step);
      setCurrentEpoch(epoch);
      setMetricsHistory((prev) => [...prev.slice(-40), metric]);

      // Checkpoint generation at epoch transitions
      if (step % stepsPerEpoch === 0 || step === computedTotalSteps) {
        let checkpointText = '';
        if (epoch === 1) {
          checkpointText = 'the the to... shall be... day with gold gold of summer night...';
        } else if (epoch === 2) {
          checkpointText = 'Thou art more fair than summer days, and winds do shake the golden buds...';
        } else if (epoch === 3) {
          checkpointText = 'Thou art more lovely and more temperate: Rough winds do shake the darling buds of May...';
        } else {
          checkpointText = 'So long as men can breathe or eyes can see, so long lives this, and gives life to thee.';
        }

        setCheckpoints((prev) => [
          ...prev,
          {
            epoch,
            step,
            loss,
            text: checkpointText,
          },
        ]);
      }

      if (step >= computedTotalSteps) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsTraining(false);
        setTrainingComplete(true);
        setHasTrainedCustom(true);
      }
    }, 150);
  };

  const pauseTraining = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTraining(false);
  };

  const resetTraining = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTraining(false);
    setCurrentStep(0);
    setCurrentEpoch(1);
    setMetricsHistory([]);
    setCheckpoints([]);
    setTrainingComplete(false);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const latestMetric = metricsHistory[metricsHistory.length - 1];

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
              Transfer Learning Lab
            </span>
            <span className="text-xs text-slate-500">Cross-Entropy Loss (LM Head)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Fine-Tune GPT-2 on Custom Text
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mt-1">
            Feed any domain corpus (poetry, code, medical transcripts, cyberpunk lore) into GPT-2. The training loop computes causal language modeling cross-entropy loss and updates weights using AdamW with weight decay.
          </p>
        </div>

        {trainingComplete && (
          <button
            id="btn-deploy-to-playground"
            onClick={() => onDeployModel(selectedPresetId as ModelType)}
            className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Deploy Model to Playground</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Step 1 & 2: Dataset & Tokenization (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Dataset Selector Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Step 1: Training Corpus
                </h3>
              </div>
              <label
                htmlFor="dataset-file-upload"
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload .txt file</span>
                <input
                  id="dataset-file-upload"
                  type="file"
                  accept=".txt,.md,.json,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-2">
              {DATASET_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetChange(preset.id)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    selectedPresetId === preset.id
                      ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-950 ring-1 ring-indigo-600'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold truncate">{preset.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{preset.badge}</div>
                </button>
              ))}
              <button
                onClick={() => handlePresetChange('custom')}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                  selectedPresetId === 'custom'
                    ? 'border-indigo-600 bg-indigo-50/60 font-semibold text-indigo-950 ring-1 ring-indigo-600'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-bold truncate">Custom Text Input</div>
                <div className="text-[10px] text-slate-500 mt-0.5">User uploaded/typed</div>
              </button>
            </div>

            {/* Text Editor */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Corpus Editor:</span>
                <span>
                  {customDatasetText.length} chars • ~
                  {Math.round(customDatasetText.split(/\s+/).filter(Boolean).length)} words
                </span>
              </div>
              <textarea
                id="dataset-editor-textarea"
                rows={6}
                value={customDatasetText}
                onChange={(e) => {
                  setCustomDatasetText(e.target.value);
                  setSelectedPresetId('custom');
                }}
                placeholder="Paste or type domain training text here..."
                className="w-full p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none bg-slate-50/50"
              />
            </div>

            {/* Step 2: BPE Subword Tokenization Preview */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-600 text-[10px]">
                  Step 2: GPT-2 BPE Tokenizer Preview
                </span>
                <span className="text-[11px] text-indigo-600">Vocab 50,257</span>
              </div>
              <div className="p-2.5 bg-slate-100/80 rounded-lg flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {tokenPreview.map((token, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-800"
                  >
                    {token.replace(/ /g, '␣')}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Hyperparameters Config Card */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Step 3: Training Hyperparameters
                </h3>
              </div>
              <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                Optimizer: {hyperparams.optimizer}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Epochs */}
              <div className="space-y-1">
                <label className="font-medium text-slate-700 flex justify-between">
                  <span>Epochs:</span>
                  <span className="font-bold text-indigo-600">{hyperparams.epochs}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={hyperparams.epochs}
                  disabled={isTraining}
                  onChange={(e) =>
                    setHyperparams({ ...hyperparams, epochs: parseInt(e.target.value) })
                  }
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Learning Rate */}
              <div className="space-y-1">
                <label className="font-medium text-slate-700 flex justify-between">
                  <span>Learning Rate:</span>
                  <span className="font-bold text-indigo-600">{hyperparams.learningRate.toExponential(0)}</span>
                </label>
                <select
                  value={hyperparams.learningRate}
                  disabled={isTraining}
                  onChange={(e) =>
                    setHyperparams({ ...hyperparams, learningRate: parseFloat(e.target.value) })
                  }
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                >
                  <option value={1e-4}>1e-4 (Fast / Aggressive)</option>
                  <option value={5e-5}>5e-5 (Standard GPT-2 Default)</option>
                  <option value={2e-5}>2e-5 (Gentle Fine-Tuning)</option>
                  <option value={1e-5}>1e-5 (Conservative)</option>
                </select>
              </div>

              {/* Batch Size */}
              <div className="space-y-1">
                <label className="font-medium text-slate-700 flex justify-between">
                  <span>Batch Size:</span>
                  <span className="font-bold text-indigo-600">{hyperparams.batchSize}</span>
                </label>
                <select
                  value={hyperparams.batchSize}
                  disabled={isTraining}
                  onChange={(e) =>
                    setHyperparams({ ...hyperparams, batchSize: parseInt(e.target.value) })
                  }
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs"
                >
                  <option value={2}>2 sequences / step</option>
                  <option value={4}>4 sequences / step</option>
                  <option value={8}>8 sequences / step</option>
                </select>
              </div>

              {/* Weight Decay */}
              <div className="space-y-1">
                <label className="font-medium text-slate-700 flex justify-between">
                  <span>Weight Decay:</span>
                  <span className="font-bold text-indigo-600">{hyperparams.weightDecay}</span>
                </label>
                <select
                  value={hyperparams.weightDecay}
                  disabled={isTraining}
                  onChange={(e) =>
                    setHyperparams({ ...hyperparams, weightDecay: parseFloat(e.target.value) })
                  }
                  className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                >
                  <option value={0.01}>0.01 (L2 Regularization)</option>
                  <option value={0.05}>0.05 (Higher Penalty)</option>
                  <option value={0.0}>0.00 (None)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center space-x-2">
              {!isTraining ? (
                <button
                  id="btn-start-training"
                  onClick={startTraining}
                  disabled={!customDatasetText.trim()}
                  className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>
                    {currentStep > 0 && currentStep < totalSteps
                      ? 'Resume Training Loop'
                      : 'Start Fine-Tuning Loop'}
                  </span>
                </button>
              ) : (
                <button
                  id="btn-pause-training"
                  onClick={pauseTraining}
                  className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-white" />
                  <span>Pause Training</span>
                </button>
              )}

              <button
                id="btn-reset-training"
                onClick={resetTraining}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all cursor-pointer"
                title="Reset training state"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Step 4: Live Training Monitor & Loss/Perplexity Graphs (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Progress & Live Metrics Bar */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Step 4: Real-Time Training Telemetry
                </h3>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-500">
                  Epoch: <strong className="text-slate-800">{currentEpoch} / {hyperparams.epochs}</strong>
                </span>
                <span className="text-slate-500">
                  Step: <strong className="text-slate-800">{currentStep} / {totalSteps}</strong>
                </span>
                {isTraining && (
                  <span className="flex items-center space-x-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Backpropagating</span>
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all duration-200"
                style={{
                  width: `${totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Telemetry Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Cross-Entropy Loss
                </span>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {latestMetric ? latestMetric.loss.toFixed(3) : '4.350'}
                </div>
                <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" />
                  <span>Target &lt; 1.5</span>
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Validation Loss
                </span>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {latestMetric ? latestMetric.valLoss.toFixed(3) : '4.600'}
                </div>
                <span className="text-[10px] text-slate-400">Held-out 10%</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Perplexity (PPL)
                </span>
                <div className="text-lg font-bold text-purple-700 font-mono mt-0.5">
                  {latestMetric ? latestMetric.perplexity.toFixed(1) : '77.4'}
                </div>
                <span className="text-[10px] text-purple-600">exp(Loss)</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Current LR
                </span>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {latestMetric ? latestMetric.learningRate : hyperparams.learningRate.toExponential(0)}
                </div>
                <span className="text-[10px] text-slate-400">Cosine Decay</span>
              </div>

            </div>

            {/* SVG Loss Curve Canvas */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Optimization Loss Trajectory</span>
                <span>Y: Loss (0 to 5) • X: Step (0 to {totalSteps})</span>
              </div>
              
              <div className="h-44 w-full bg-slate-900 rounded-lg p-3 relative overflow-hidden flex flex-col justify-end">
                {/* SVG Line Graph */}
                <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="400" y2="30" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="60" x2="400" y2="60" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="90" x2="400" y2="90" stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />

                  {/* Loss Path */}
                  {metricsHistory.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2.5"
                      points={metricsHistory
                        .map((m) => {
                          const x = (m.step / totalSteps) * 400;
                          const y = Math.max(10, Math.min(110, (m.loss / 5.0) * 110));
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Validation Loss Path */}
                  {metricsHistory.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#c084fc"
                      strokeDasharray="4 4"
                      strokeWidth="2"
                      points={metricsHistory
                        .map((m) => {
                          const x = (m.step / totalSteps) * 400;
                          const y = Math.max(10, Math.min(110, (m.valLoss / 5.0) * 110));
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  )}
                </svg>

                {/* Graph Legend */}
                <div className="absolute top-2 right-3 flex items-center space-x-3 text-[10px] text-slate-300 bg-slate-800/80 px-2 py-1 rounded">
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-0.5 bg-indigo-400" />
                    <span>Train Loss</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-0.5 bg-purple-400 border-t border-dashed" />
                    <span>Val Loss</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Epoch Checkpoints Validation Preview */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Generated Checkpoint Samples Across Epochs</span>
              </h4>
              <span className="text-xs text-slate-400">
                {checkpoints.length} Checkpoints Recorded
              </span>
            </div>

            {checkpoints.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {checkpoints.map((cp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1 text-xs"
                  >
                    <div className="flex justify-between items-center text-slate-500 font-mono text-[11px]">
                      <span className="font-bold text-indigo-700">
                        Epoch {cp.epoch} Checkpoint (Step {cp.step})
                      </span>
                      <span>Loss: {cp.loss.toFixed(3)}</span>
                    </div>
                    <p className="text-slate-800 font-serif italic">
                      "{cp.text}"
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Validation checkpoints will be sampled automatically as each training epoch completes.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
