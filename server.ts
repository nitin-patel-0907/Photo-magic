import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const PORT = 3000;

// Lazy initialization helper for Google GenAI SDK
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add your API key in the AI Studio Settings > Secrets panel."
    );
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// In-memory set to prevent duplicate identical concurrent submissions
const activeSubmissions = new Set<string>();

async function startServer() {
  const app = express();

  // Support large base64 payload uploads up to 50MB
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Proxy endpoint for sample photos to prevent CORS issues in preview environments
  app.get("/api/sample-image", async (req, res) => {
    try {
      const imageUrl = req.query.url;
      if (!imageUrl || typeof imageUrl !== "string") {
        return res.status(400).json({ error: "Missing image url parameter" });
      }

      // Security check: only allow safe image providers like unsplash or picsum
      const parsedUrl = new URL(imageUrl);
      const allowedHosts = [
        "images.unsplash.com",
        "plus.unsplash.com",
        "picsum.photos",
        "fastly.picsum.photos",
      ];
      if (!allowedHosts.some((h) => parsedUrl.hostname.endsWith(h))) {
        return res.status(403).json({ error: "Hostname not permitted" });
      }

      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch sample image" });
      }

      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (err: any) {
      console.error("Error proxying sample image:", err?.message);
      res.status(500).json({ error: "Error loading sample image" });
    }
  });

  // Magic edit transformation endpoint
  app.post("/api/magic-edit", async (req, res) => {
    // Request timeout guard (75 seconds)
    const timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          error: "The AI image generation timed out. Please try again with a slightly smaller image or different action.",
        });
      }
    }, 75000);

    let submissionKey = "";

    try {
      const {
        image,
        prompt,
        actionType = "custom",
        maskImage,
        aspectRatio,
        modelPreference,
      } = req.body;

      if (!image || typeof image !== "string") {
        clearTimeout(timeoutId);
        return res.status(400).json({
          success: false,
          error: "Please provide a valid image data string.",
        });
      }

      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        clearTimeout(timeoutId);
        return res.status(400).json({
          success: false,
          error: "Please provide a prompt instruction for the edit.",
        });
      }

      // Safeguard against duplicate identical submissions
      const snippet = image.slice(0, 100) + prompt.slice(0, 50);
      submissionKey = snippet;
      if (activeSubmissions.has(submissionKey)) {
        clearTimeout(timeoutId);
        return res.status(429).json({
          success: false,
          error: "An identical edit request is already in progress. Please wait a moment.",
        });
      }
      activeSubmissions.add(submissionKey);

      const ai = getGenAI();

      // Parse base64 string and MIME type
      let cleanBase64 = image;
      let mimeType = "image/jpeg";
      if (image.startsWith("data:")) {
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          cleanBase64 = match[2];
        }
      }

      const parts: Array<{
        inlineData?: { data: string; mimeType: string };
        text?: string;
      }> = [
        {
          inlineData: {
            data: cleanBase64,
            mimeType,
          },
        },
      ];

      // If mask or reference image is provided (e.g. for object removal or custom background replacement)
      if (maskImage && typeof maskImage === "string") {
        let maskClean = maskImage;
        let maskMime = "image/png";
        if (maskImage.startsWith("data:")) {
          const match = maskImage.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            maskMime = match[1];
            maskClean = match[2];
          }
        }
        parts.push({
          inlineData: {
            data: maskClean,
            mimeType: maskMime,
          },
        });
      }

      // Add clear instructions for the edit
      parts.push({
        text: prompt,
      });

      // Target the Nano Banana image editing models
      // Default to gemini-3.1-flash-lite-image, fallback to gemini-3.1-flash-image if requested
      const chosenModel =
        modelPreference === "high-quality"
          ? "gemini-3.1-flash-image"
          : "gemini-3.1-flash-lite-image";

      const config: any = {};
      if (aspectRatio && ["1:1", "3:4", "4:3", "9:16", "16:9"].includes(aspectRatio)) {
        config.imageConfig = { aspectRatio };
      }

      let response: any;
      try {
        response = await ai.models.generateContent({
          model: chosenModel,
          contents: {
            parts,
          },
          ...(Object.keys(config).length > 0 ? { config } : {}),
        });
      } catch (err: any) {
        console.warn(`Attempt with ${chosenModel} failed:`, err?.message);
        // Fallback to gemini-3.1-flash-image or vice versa if one model encounters a temporary error
        const fallbackModel =
          chosenModel === "gemini-3.1-flash-lite-image"
            ? "gemini-3.1-flash-image"
            : "gemini-3.1-flash-lite-image";
        console.log(`Retrying with fallback model ${fallbackModel}...`);
        response = await ai.models.generateContent({
          model: fallbackModel,
          contents: {
            parts,
          },
          ...(Object.keys(config).length > 0 ? { config } : {}),
        });
      }

      let generatedImageUrl: string | null = null;
      let modelNote = "";

      const candidates = response?.candidates;
      if (candidates && candidates.length > 0) {
        const candidateParts = candidates[0]?.content?.parts || [];
        for (const part of candidateParts) {
          if (part.inlineData && part.inlineData.data) {
            const outMime = part.inlineData.mimeType || "image/png";
            generatedImageUrl = `data:${outMime};base64,${part.inlineData.data}`;
            break;
          } else if (part.text) {
            modelNote += part.text;
          }
        }
      }

      clearTimeout(timeoutId);

      if (!generatedImageUrl) {
        return res.status(500).json({
          success: false,
          error:
            modelNote ||
            "The AI model processed the request but did not return an edited image part. Please try tweaking your photo or instruction.",
        });
      }

      return res.json({
        success: true,
        resultImage: generatedImageUrl,
        actionType,
        note: modelNote || undefined,
      });
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Error in /api/magic-edit:", error);

      let userMessage =
        "An unexpected error occurred while processing the photo. Please try again.";

      const msg = error?.message || "";
      if (msg.includes("GEMINI_API_KEY") || msg.includes("API key")) {
        userMessage =
          "Gemini API key is not configured. Please add your key in the AI Studio Settings > Secrets panel.";
      } else if (msg.includes("limit: 0") || msg.includes("free_tier")) {
        userMessage =
          "Gemini image generation models (Nano Banana) require a paid API key with billing enabled (free-tier quota limit is 0). Please select or link a paid API key in AI Studio.";
      } else if (msg.includes("429") || msg.includes("quota") || msg.includes("ResourceExhausted")) {
        userMessage =
          "Gemini API rate limit or quota exceeded. Please wait a few moments before trying again.";
      } else if (msg.includes("SAFETY") || msg.includes("blocked")) {
        userMessage =
          "The photo or instruction triggered Gemini safety guidelines. Please try a different photo or prompt.";
      } else if (msg.length > 0 && msg.length < 200) {
        userMessage = msg;
      }

      return res.status(500).json({
        success: false,
        error: userMessage,
      });
    } finally {
      if (submissionKey) {
        activeSubmissions.delete(submissionKey);
      }
    }
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Magic Photo server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
