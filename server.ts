import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy Gemini API Client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// BPE Tokenizer approximation for GPT-2 (vocab size: 50,257)
// Simple deterministic hashing & regex subword decomposition to mimic GPT-2 BPE tokens
function simulateGPT2Tokenize(text: string) {
  if (!text) return [];
  // GPT-2 BPE regex pattern approximation
  const pattern = /'s|'t|'re|'ve|'m|'ll|'d| ?\p{L}+| ?\p{N}+| ?[^\s\p{L}\p{N}]+|\s+(?!\S)|\s+/gu;
  const matches = text.match(pattern) || [text];
  
  return matches.map((tokenStr, idx) => {
    // Generate deterministic pseudo-token ID from 1 to 50256
    let hash = 0;
    for (let i = 0; i < tokenStr.length; i++) {
      hash = (hash * 31 + tokenStr.charCodeAt(i)) & 0xffffffff;
    }
    const tokenId = Math.abs(hash % 50000) + 256;
    
    // Calculate pseudo logit probability for demonstration
    const prob = Math.min(0.98, Math.max(0.05, 0.85 - (idx * 0.02) + (Math.sin(hash) * 0.1)));
    
    return {
      text: tokenStr,
      id: tokenId,
      bytes: Array.from(new TextEncoder().encode(tokenStr)),
      probability: Number(prob.toFixed(3)),
    };
  });
}

// Tokenize API
app.post('/api/tokenize', (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    const tokens = simulateGPT2Tokenize(text || '');
    res.json({
      success: true,
      tokenCount: tokens.length,
      tokens,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Tokenization failed' });
  }
});

// Text Generation API
app.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const {
      prompt,
      modelType = 'gpt2-base', // 'gpt2-base' | 'gpt2-shakespeare' | 'gpt2-scifi' | 'gpt2-recipes' | 'gpt2-custom'
      customDatasetText = '',
      temperature = 0.7,
      topK = 40,
      topP = 0.9,
      maxTokens = 150,
      repetitionPenalty = 1.1,
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getGeminiClient();

    let stylePrompt = '';
    let personaName = 'Standard GPT-2 (Pretrained)';

    if (modelType === 'gpt2-shakespeare') {
      personaName = 'GPT-2 Fine-Tuned on Shakespearean Plays & Sonnets';
      stylePrompt = `You are a fine-tuned GPT-2 117M parameter language model specifically trained on William Shakespeare's Complete Works (Hamlet, Macbeth, Sonnets, Romeo and Juliet). Continue the user's prompt strictly in authentic Early Modern English, iambic rhythms, poetic metaphors, and Elizabethan vocabulary (thee, thou, doth, hath, wherefore). Do NOT break character or explain. Generate only the continuation.`;
    } else if (modelType === 'gpt2-scifi') {
      personaName = 'GPT-2 Fine-Tuned on Cyberpunk & Sci-Fi Universe Lore';
      stylePrompt = `You are a fine-tuned GPT-2 117M parameter language model trained on Isaac Asimov, Philip K. Dick, William Gibson, and Cyberpunk/Dune lore. Continue the user's prompt in vivid, gritty, futuristic sci-fi prose with neon aesthetics, neural implants, orbital habitats, quantum drives, and synthwave tech terminology. Continue directly from the prompt.`;
    } else if (modelType === 'gpt2-recipes') {
      personaName = 'GPT-2 Fine-Tuned on Gourmet & Culinary Recipes';
      stylePrompt = `You are a fine-tuned GPT-2 language model trained on culinary datasets, cookbooks, and chef guides. Continue the user prompt into structured recipes, ingredient measurements, aroma profiles, sauté techniques, and plating instructions. Continue directly from the prompt.`;
    } else if (modelType === 'gpt2-custom' && customDatasetText) {
      personaName = 'GPT-2 Fine-Tuned on Custom User Dataset';
      stylePrompt = `You are a fine-tuned GPT-2 transformer model trained specifically on the following custom domain text dataset provided by the user:\n"""\n${customDatasetText.slice(0, 3000)}\n"""\nAdopt the exact vocabulary, syntax patterns, tone, and domain quirks found in this dataset. Continue the user prompt seamlessly.`;
    } else {
      personaName = 'GPT-2 Base (Pre-trained on WebText 40GB)';
      stylePrompt = `You are the original OpenAI GPT-2 Base (117M parameters) transformer model trained on WebText. Complete the text naturally based on open-web internet text patterns, news, encyclopedia articles, and general forum posts. Do NOT act like a modern conversational assistant like ChatGPT; act strictly like an autoregressive next-token predictor completing the raw text sequence.`;
    }

    if (ai) {
      const systemInstruction = `${stylePrompt}
Rules:
1. Complete the prompt naturally as an autoregressive language model.
2. Do not prefix with "Here is..." or meta-commentary.
3. Keep the continuation length around ${Math.min(maxTokens, 300)} words.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Prompt: "${prompt}"\n\nContinue the text strictly following the assigned GPT-2 model weights and fine-tuned persona:`,
        config: {
          systemInstruction,
          temperature: Math.max(0.1, Math.min(2.0, Number(temperature) || 0.7)),
          topK: Number(topK) || 40,
          topP: Number(topP) || 0.9,
        },
      });

      const generatedText = response.text || '';
      const fullText = prompt + (generatedText.startsWith(' ') ? '' : ' ') + generatedText.trim();
      const tokenized = simulateGPT2Tokenize(generatedText);

      return res.json({
        success: true,
        modelName: personaName,
        modelType,
        prompt,
        continuation: generatedText,
        fullText,
        tokens: tokenized,
        generationParams: {
          temperature,
          topK,
          topP,
          maxTokens,
          repetitionPenalty,
        },
      });
    } else {
      // Offline / Fallback generator if GEMINI_API_KEY is not set
      const fallbackCompletions: Record<string, string[]> = {
        'gpt2-shakespeare': [
          "and by the radiant sun that gilds the east, my heart doth pledge eternal constancy unto thy noble grace.",
          "wherein the shadows of the silent night whisper of ancient griefs, yet hope doth rise like morning stars.",
          "for love is not a fickle fleeting breeze, but an unyielding anchor in tempestuous seas."
        ],
        'gpt2-scifi': [
          "the neon reflections glinted off the cybernetic optical HUD as the data-stream surged through neural bus port 7.",
          "quantum drive spooling at 98.4% nominal capacity while the perimeter sentry drones locked onto the tachyon signature.",
          "drifting past the orbital debris rings of Kepler-186f, the automated sub-light navigation relay pulsed in silence."
        ],
        'gpt2-recipes': [
          "whisk the egg yolks with crushed sea salt, finely chopped fresh tarragon, and slowly emulsify with clarified brown butter over gentle steam.",
          "simmer for 25 minutes on low heat until the reduction thickens into a glossy, velvety glaze coating the back of a wooden spoon.",
          "garnish with toasted pine nuts, shaved pecorino, and a delicate drizzle of cold-pressed Sicilian olive oil."
        ],
        'gpt2-base': [
          "which was announced earlier this week during the annual technology symposium in San Francisco, according to official records.",
          "and researchers found that incorporating systematic cross-validation significantly improved stability across diverse evaluation benchmarks.",
          "with several key community stakeholders participating in the initiative to promote accessible computing infrastructure."
        ]
      };

      const options = fallbackCompletions[modelType] || fallbackCompletions['gpt2-base'];
      const chosen = options[Math.floor(Math.random() * options.length)];
      const continuation = ` ${chosen}`;
      const fullText = prompt + continuation;
      const tokenized = simulateGPT2Tokenize(continuation);

      return res.json({
        success: true,
        modelName: `${personaName} (Local Engine)`,
        modelType,
        prompt,
        continuation,
        fullText,
        tokens: tokenized,
        generationParams: {
          temperature,
          topK,
          topP,
          maxTokens,
          repetitionPenalty,
        },
      });
    }
  } catch (error: any) {
    console.error('Generation Error:', error);
    res.status(500).json({ error: error.message || 'Text generation failed' });
  }
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GPT-2 Studio server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
