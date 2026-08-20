import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const CodeExportView: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'train' | 'generate' | 'requirements' | 'colab'>('train');
  const [copied, setCopied] = useState<boolean>(false);

  const trainCode = `"""
Task-01: Fine-Tuning GPT-2 on Custom Text Dataset
Author: PyTorch + Hugging Face Transformers
Usage: python train_gpt2.py --dataset custom_corpus.txt --epochs 4 --lr 5e-5
"""

import os
import torch
from transformers import (
    GPT2LMHeadModel,
    GPT2TokenizerFast,
    Trainer,
    TrainingArguments,
    DataCollatorForLanguageModeling,
    TextDataset
)

def train():
    # 1. Device configuration (CUDA GPU / Apple MPS / CPU)
    device = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
    print(f"[*] Training on compute device: {device}")

    # 2. Load pre-trained GPT-2 model and tokenizer
    model_name = "gpt2"  # gpt2 (117M), gpt2-medium (345M), or gpt2-large (774M)
    tokenizer = GPT2TokenizerFast.from_pretrained(model_name)
    model = GPT2LMHeadModel.from_pretrained(model_name).to(device)

    # GPT-2 does not have a default pad token, assign EOS token as pad token
    tokenizer.pad_token = tokenizer.eos_token

    # 3. Load & tokenize custom text dataset
    dataset_file = "custom_corpus.txt"
    if not os.path.exists(dataset_file):
        with open(dataset_file, "w", encoding="utf-8") as f:
            f.write("Shall I compare thee to a summer's day? Thou art more lovely and more temperate...")

    train_dataset = TextDataset(
        tokenizer=tokenizer,
        file_path=dataset_file,
        block_size=128,  # Truncate / chunk into 128-token segments
        overwrite_cache=True
    )

    # Data collator for causal language modeling (autoregressive)
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False  # Causal LM, NOT masked LM like BERT
    )

    # 4. Define training hyperparameters
    training_args = TrainingArguments(
        output_dir="./gpt2_finetuned_checkpoint",
        overwrite_output_dir=True,
        num_train_epochs=4,
        per_device_train_batch_size=4,
        gradient_accumulation_steps=2,
        learning_rate=5e-5,
        weight_decay=0.01,
        warmup_steps=50,
        logging_steps=10,
        save_strategy="epoch",
        save_total_limit=2,
        fp16=torch.cuda.is_available(),  # 16-bit mixed precision if GPU available
        report_to="none"
    )

    # 5. Initialize Hugging Face Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        data_collator=data_collator,
        train_dataset=train_dataset,
    )

    # 6. Execute fine-tuning loop
    print("[*] Starting Fine-Tuning Loop...")
    trainer.train()

    # 7. Save fine-tuned model and tokenizer
    save_path = "./gpt2_finetuned_model"
    model.save_pretrained(save_path)
    tokenizer.save_pretrained(save_path)
    print(f"[✓] Fine-tuned model weights successfully saved to: {save_path}")

if __name__ == "__main__":
    train()
`;

  const generateCode = `"""
Task-01: Autoregressive Text Generation with Fine-Tuned GPT-2
Usage: python generate_text.py --prompt "Shall I compare thee"
"""

import torch
from transformers import GPT2LMHeadModel, GPT2TokenizerFast

def generate_text(prompt: str, max_length: int = 150, temperature: float = 0.75, top_k: int = 40, top_p: float = 0.9):
    model_path = "./gpt2_finetuned_model"
    device = "cuda" if torch.cuda.is_available() else "cpu"

    print(f"[*] Loading fine-tuned checkpoint from {model_path}...")
    tokenizer = GPT2TokenizerFast.from_pretrained(model_path)
    model = GPT2LMHeadModel.from_pretrained(model_path).to(device)
    model.eval()

    # Encode prompt to tensor
    input_ids = tokenizer.encode(prompt, return_tensors="pt").to(device)

    # Generate autoregressively with sampling controls
    with torch.no_grad():
        output_ids = model.generate(
            input_ids,
            max_length=max_length,
            temperature=temperature,
            top_k=top_k,
            top_p=top_p,
            repetition_penalty=1.15,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id,
            num_return_sequences=1
        )

    generated_text = tokenizer.decode(output_ids[0], skip_special_tokens=True)
    return generated_text

if __name__ == "__main__":
    test_prompt = "Shall I compare thee to a summer's day?"
    print(f"\\n--- PROMPT ---\\n{test_prompt}\\n")
    continuation = generate_text(test_prompt)
    print(f"--- GENERATED OUTPUT ---\\n{continuation}\\n")
`;

  const requirementsCode = `torch>=2.1.0
transformers>=4.38.0
datasets>=2.17.0
accelerate>=0.27.0
tqdm>=4.66.0
`;

  const colabCode = `# ==========================================================
# Google Colab / Jupyter Notebook One-Click Fine-Tuning
# Runtime > Change runtime type > Select T4 GPU (Free)
# ==========================================================

# 1. Install dependencies
!pip install -q transformers datasets accelerate torch

# 2. Check GPU availability
import torch
print("GPU Available:", torch.cuda.is_available())
if torch.cuda.is_available():
    print("Device Name:", torch.cuda.get_device_name(0))

# 3. Create sample dataset
dataset_text = """SONNET 18
Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
And summer's lease hath all too short a date..."""

with open("custom_corpus.txt", "w", encoding="utf-8") as f:
    f.write(dataset_text)

# 4. Run fine-tuning script
!python train_gpt2.py

# 5. Test generation
!python generate_text.py
`;

  const getActiveCode = () => {
    switch (activeCodeTab) {
      case 'train':
        return trainCode;
      case 'generate':
        return generateCode;
      case 'requirements':
        return requirementsCode;
      case 'colab':
        return colabCode;
    }
  };

  const getActiveFilename = () => {
    switch (activeCodeTab) {
      case 'train':
        return 'train_gpt2.py';
      case 'generate':
        return 'generate_text.py';
      case 'requirements':
        return 'requirements.txt';
      case 'colab':
        return 'gpt2_colab_notebook.py';
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = () => {
    const code = getActiveCode();
    const filename = getActiveFilename();
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
              PyTorch & Transformers
            </span>
            <span className="text-xs text-slate-500">Production Python Implementation</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Hugging Face Fine-Tuning & Generation Scripts
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mt-1">
            Complete, runnable Python scripts to fine-tune GPT-2 on custom datasets using PyTorch, Hugging Face <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">transformers.Trainer</code>, and mixed-precision GPU acceleration.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={downloadCode}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download {getActiveFilename()}</span>
          </button>

          <button
            onClick={copyCode}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Code' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {/* Code Editor Container */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
        
        {/* Tab Navigation */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveCodeTab('train')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeCodeTab === 'train'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>train_gpt2.py</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('generate')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeCodeTab === 'generate'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>generate_text.py</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('requirements')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeCodeTab === 'requirements'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>requirements.txt</span>
            </button>

            <button
              onClick={() => setActiveCodeTab('colab')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeCodeTab === 'colab'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Google Colab Setup</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Python 3.10+ • PyTorch 2.1+
          </span>
        </div>

        {/* Code Body */}
        <div className="p-5 max-h-[500px] overflow-y-auto font-mono text-xs text-slate-200 leading-relaxed">
          <pre className="whitespace-pre">{getActiveCode()}</pre>
        </div>

      </div>

      {/* Terminal Quick Start Guide */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <span>Local CLI Quick Start Instructions</span>
        </h4>
        <div className="p-3.5 bg-slate-900 text-emerald-400 rounded-lg font-mono text-xs space-y-1.5">
          <p className="text-slate-400"># 1. Install dependencies</p>
          <p>pip install transformers datasets torch accelerate</p>
          <p className="text-slate-400 pt-1"># 2. Fine-tune on your text corpus</p>
          <p>python train_gpt2.py</p>
          <p className="text-slate-400 pt-1"># 3. Generate text with sampling controls</p>
          <p>python generate_text.py</p>
        </div>
      </div>

    </div>
  );
};
