// src/index.js
import express from "express";
import cors from "cors";

// src/routes/analyze.js
import { Router } from "express";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

// src/storage.js
var analyses = [];
var nextId = 1;
var storage = {
  // Add a new analysis
  create: (data) => {
    const id = nextId++;
    const record = {
      id,
      imageUrl: data.imageUrl,
      imageDataBase64: data.imageDataBase64,
      imageMimeType: data.imageMimeType,
      results: data.results,
      combinedSummary: data.combinedSummary,
      tags: data.tags,
      modelsUsed: data.modelsUsed,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    analyses.push(record);
    return record;
  },
  // Get all analyses (sorted by date, with limit)
  getAll: (limit = 50) => {
    return analyses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
  },
  // Get a single analysis by ID
  getById: (id) => {
    return analyses.find((a) => a.id === id);
  },
  // Get stats
  getStats: () => {
    const total = analyses.length;
    const modelBreakdown = { gemini: 0, openai: 0, deepseek: 0 };
    const dateCounts = {};
    analyses.forEach((record) => {
      record.modelsUsed.split(",").forEach((model) => {
        const key = model.trim();
        if (key in modelBreakdown) modelBreakdown[key]++;
      });
      const date = new Date(record.createdAt).toISOString().split("T")[0];
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });
    const recentActivity = Object.entries(dateCounts).sort(([a], [b]) => b.localeCompare(a)).slice(0, 7).map(([date, count]) => ({ date, count }));
    return {
      totalAnalyses: total,
      modelBreakdown,
      recentActivity
    };
  }
};

// src/routes/analyze.js
import "dotenv/config";
var router = Router();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});
var _geminiClient;
var _openaiClient;
var _openrouterClient;
function getEnv(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}
function getGeminiClient() {
  if (_geminiClient) return _geminiClient;
  const apiKey = getEnv("GEMINI_API_KEY");
  if (!apiKey) return null;
  _geminiClient = new GoogleGenAI({ apiKey });
  return _geminiClient;
}
function getOpenAIClient() {
  if (_openaiClient) return _openaiClient;
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) return null;
  _openaiClient = new OpenAI({ apiKey });
  return _openaiClient;
}
function getOpenRouterClient() {
  if (_openrouterClient) return _openrouterClient;
  const apiKey = getEnv("OPENROUTER_API_KEY");
  if (!apiKey) return null;
  _openrouterClient = new OpenAI({
    apiKey,
    baseURL: "https://openrouter.ai/api/v1"
  });
  return _openrouterClient;
}
function buildPrompt(customPrompt) {
  const base = `You are an expert image analyst. Analyze this image in great detail and provide:

1. **Overview**: A thorough description of what's in the image (objects, people, scenes, activities)
2. **Colors & Composition**: Dominant colors, lighting, visual composition, and artistic style
3. **Context & Setting**: Environment, location, time of day, season, or era if applicable
4. **Technical Details**: Image quality, camera angle, depth of field, any text or numbers visible
5. **Emotions & Atmosphere**: The mood, emotional tone, and atmosphere conveyed
6. **Notable Elements**: Anything unusual, interesting, or significant worth highlighting
7. **Tags**: List 8-12 concise keyword tags that describe this image

Be specific and thorough. Extract every possible detail you can observe.`;
  return customPrompt?.trim() ? `${base}

Additional focus: ${customPrompt}` : base;
}
async function analyzeWithGemini(imageBase64, mimeType, prompt) {
  const start = Date.now();
  try {
    const gemini = getGeminiClient();
    if (!gemini) {
      return {
        model: "gemini-2.5-flash",
        provider: "gemini",
        error: "GEMINI_API_KEY is missing; set it in backend/.env to use Gemini.",
        durationMs: Date.now() - start
      };
    }
    const response = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [
          { inlineData: { data: imageBase64, mimeType } },
          { text: prompt }
        ]
      }],
      config: { maxOutputTokens: 8192 }
    });
    return { model: "gemini-2.5-flash", provider: "gemini", analysis: response.text ?? "", durationMs: Date.now() - start };
  } catch (err) {
    return { model: "gemini-2.5-flash", provider: "gemini", error: err.message, durationMs: Date.now() - start };
  }
}
async function analyzeWithOpenAI(imageBase64, mimeType, prompt) {
  const start = Date.now();
  try {
    const openaiClient = getOpenAIClient();
    if (!openaiClient) {
      return {
        model: "gpt-4o",
        provider: "openai",
        error: "OPENAI_API_KEY is missing; set it in backend/.env to use OpenAI.",
        durationMs: Date.now() - start
      };
    }
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          { type: "text", text: prompt }
        ]
      }]
    });
    return { model: "gpt-4o", provider: "openai", analysis: response.choices[0]?.message?.content ?? "", durationMs: Date.now() - start };
  } catch (err) {
    return { model: "gpt-4o", provider: "openai", error: err.message, durationMs: Date.now() - start };
  }
}
async function analyzeWithDeepSeek(imageBase64, mimeType, prompt) {
  const start = Date.now();
  try {
    const openrouterClient = getOpenRouterClient();
    if (!openrouterClient) {
      return {
        model: "deepseek-chat-v3-0324",
        provider: "deepseek",
        error: "OPENROUTER_API_KEY is missing; set it in backend/.env to use DeepSeek via OpenRouter.",
        durationMs: Date.now() - start
      };
    }
    const dataUrl = `data:${mimeType};base64,${imageBase64}`;
    const response = await openrouterClient.chat.completions.create({
      model: "deepseek/deepseek-chat-v3-0324",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          { type: "image_url", image_url: { url: dataUrl } },
          { type: "text", text: prompt }
        ]
      }]
    });
    return { model: "deepseek-chat-v3-0324", provider: "deepseek", analysis: response.choices[0]?.message?.content ?? "", durationMs: Date.now() - start };
  } catch (err) {
    return { model: "deepseek-chat-v3-0324", provider: "deepseek", error: err.message, durationMs: Date.now() - start };
  }
}
function extractTags(results) {
  const tagSet = /* @__PURE__ */ new Set();
  for (const result of results) {
    if (!result.analysis) continue;
    const tagsMatch = result.analysis.match(/\*\*Tags\*\*[:\s]*([\s\S]*?)(?:\n\n|\n#|$)/i);
    if (tagsMatch) {
      tagsMatch[1].split(/[,\n•\-]/).map((t) => t.trim().replace(/^[\d.]+\s*/, "").toLowerCase()).filter((t) => t.length > 1 && t.length < 30).slice(0, 15).forEach((t) => tagSet.add(t));
    }
  }
  return Array.from(tagSet).slice(0, 12);
}
function buildCombinedSummary(results) {
  const successResults = results.filter((r) => r.analysis);
  if (!successResults.length) return "No analysis available.";
  return successResults.map((r) => {
    const name = r.provider === "openai" ? "ChatGPT" : r.provider === "gemini" ? "Gemini" : "DeepSeek";
    return `**${name}**: ${r.analysis?.split("\n").slice(0, 3).join(" ").substring(0, 300) ?? ""}`;
  }).join("\n\n");
}
router.post("/analyze", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Bad Request", message: "No image file provided" });
  const mimeType = req.file.mimetype || "image/jpeg";
  const imageBase64 = req.file.buffer.toString("base64");
  const customPrompt = req.body.prompt ?? "";
  const modelsParam = req.body.models ?? "gemini,openai,deepseek";
  const requestedModels = modelsParam.split(",").map((m) => m.trim().toLowerCase());
  const prompt = buildPrompt(customPrompt);
  const promises = [];
  if (requestedModels.includes("gemini")) promises.push(analyzeWithGemini(imageBase64, mimeType, prompt));
  if (requestedModels.includes("openai")) promises.push(analyzeWithOpenAI(imageBase64, mimeType, prompt));
  if (requestedModels.includes("deepseek")) promises.push(analyzeWithDeepSeek(imageBase64, mimeType, prompt));
  const results = await Promise.all(promises);
  const tags = extractTags(results);
  const combinedSummary = buildCombinedSummary(results);
  const imageUrl = `data:${mimeType};base64,${imageBase64}`;
  const record = storage.create({
    imageUrl,
    imageDataBase64: imageBase64,
    imageMimeType: mimeType,
    results,
    combinedSummary,
    tags,
    modelsUsed: requestedModels.join(",")
  });
  res.json({ id: record.id, imageUrl: record.imageUrl, results, combinedSummary, tags, createdAt: record.createdAt });
});
router.get("/analyze/history", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 50);
  const records = storage.getAll(limit);
  res.json(records.map((r) => ({ ...r, results: r.results, tags: r.tags })));
});
router.get("/analyze/stats", async (req, res) => {
  res.json(storage.getStats());
});
router.get("/analyze/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Bad Request", message: "Invalid ID" });
  const record = storage.getById(id);
  if (!record) return res.status(404).json({ error: "Not Found", message: "Analysis not found" });
  res.json(record);
});
var analyze_default = router;

// src/index.js
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
var app = express();
var PORT = process.env.PORT || 5e3;
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var allowedOrigin = process.env.FRONTEND_ORIGIN?.trim();
app.use(
  cors({
    origin: allowedOrigin ? [allowedOrigin] : true,
    credentials: false
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.get("/api/healthz", (req, res) => res.json({ status: "ok" }));
app.use("/api", analyze_default);
var publicDir = path.resolve(__dirname, "public");
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });
}
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.mjs.map
