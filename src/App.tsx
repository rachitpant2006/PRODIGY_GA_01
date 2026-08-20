import React, { useState } from 'react';
import { Header } from './components/Header';
import { PlaygroundView } from './components/PlaygroundView';
import { FineTuningLabView } from './components/FineTuningLabView';
import { ArchitectureView } from './components/ArchitectureView';
import { CodeExportView } from './components/CodeExportView';
import { ModelType } from './types';
import { DATASET_PRESETS } from './data/presets';
import { Bot, Sparkles, BookOpen, GitFork } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'playground' | 'finetuning' | 'architecture' | 'code'>('playground');
  const [selectedModel, setSelectedModel] = useState<ModelType>('gpt2-shakespeare');
  const [customDatasetText, setCustomDatasetText] = useState<string>(
    DATASET_PRESETS[0].sampleDataset
  );
  const [hasTrainedCustom, setHasTrainedCustom] = useState<boolean>(true);

  const handleDeployModel = (modelType: ModelType) => {
    setSelectedModel(modelType);
    setActiveTab('playground');
  };

  const getModelDisplayName = () => {
    if (selectedModel === 'gpt2-base') return 'GPT-2 Base (Pretrained)';
    if (selectedModel === 'gpt2-custom') return 'GPT-2 Custom Fine-Tuned';
    const found = DATASET_PRESETS.find((p) => p.id === selectedModel);
    return found ? found.name : 'GPT-2 Fine-Tuned';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeModelName={getModelDisplayName()}
        isFineTunedActive={selectedModel !== 'gpt2-base'}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'playground' && (
          <PlaygroundView
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            customDatasetText={customDatasetText}
            hasTrainedCustom={hasTrainedCustom}
            onNavigateToFineTuning={() => setActiveTab('finetuning')}
          />
        )}

        {activeTab === 'finetuning' && (
          <FineTuningLabView
            customDatasetText={customDatasetText}
            setCustomDatasetText={setCustomDatasetText}
            onDeployModel={handleDeployModel}
            hasTrainedCustom={hasTrainedCustom}
            setHasTrainedCustom={setHasTrainedCustom}
          />
        )}

        {activeTab === 'architecture' && <ArchitectureView />}

        {activeTab === 'code' && <CodeExportView />}
      </main>

      {/* Footer referencing the task specifications */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">Task-01: Text Generation with GPT-2</span>
            <span>•</span>
            <span>OpenAI GPT-2 Transformer Causal Language Modeling</span>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-slate-400">References:</span>
            <button
              onClick={() => setActiveTab('architecture')}
              className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline underline-offset-2"
            >
              #1 Language Models are Unsupervised Multitask Learners
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline underline-offset-2"
            >
              #2 Hugging Face Transformers Trainer
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}
