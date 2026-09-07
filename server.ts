import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import {
  parseBase64,
  removeBackground,
  changeBackground,
  enhancePhoto,
  removeObject,
  applyCreativeFilter,
} from "./src/server/imageEngine";

dotenv.config();

const PORT = 3000;

// In-memory map to prevent duplicate concurrent identical requests
const activeSubmissions = new Set<string>();

async function startServer() {
  const app = express();

  // Support image payloads up to 50MB
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Instant, dependable health check endpoint for Cloud Run and dev server probes
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      engine: "magic-photo-in-memory-ts",
      offlineReady: true,
      ready: true,
      hardware: { has_gpu: false, device: "Node.js V8 Engine" },
      models: ["Direct Pixel Synthesis", "Jimp 1.6", "Adaptive Contrast", "Color Saliency"],
    });
  });

  // Proxy endpoint for sample photos to prevent CORS issues
  app.get("/api/sample-image", async (req, res) => {
    try {
      const imageUrl = req.query.url;
      if (!imageUrl || typeof imageUrl !== "string") {
        return res.status(400).json({ error: "Missing image url parameter" });
      }

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
    const startTime = Date.now();
    let submissionKey = "";

    try {
      const {
        image,
        prompt = "",
        actionType = "enhance",
        maskImage,
        extraParams = {},
      } = req.body;

      if (!image || typeof image !== "string") {
        return res.status(400).json({
          success: false,
          error: "Please provide a valid photo data string.",
        });
      }

      // Concurrency guard
      submissionKey = image.slice(0, 60) + actionType + prompt.slice(0, 30);
      if (activeSubmissions.has(submissionKey)) {
        return res.status(429).json({
          success: false,
          error: "An edit is already processing for this image. Please wait a moment.",
        });
      }
      activeSubmissions.add(submissionKey);

      const promptLower = (prompt || "").toLowerCase();
      const imageBuf = parseBase64(image);

      let resultImage = "";
      let note = "";
      let resolvedAction = actionType;

      if (actionType === "remove-bg" || promptLower.includes("cut out") || promptLower.includes("remove background")) {
        resolvedAction = "remove-bg";
        let bgStyle = extraParams.bgStyle || "transparent";
        if (promptLower.includes("white")) bgStyle = "white";
        else if (promptLower.includes("dark") || promptLower.includes("graphite")) bgStyle = "dark";

        const out = await removeBackground(imageBuf, bgStyle);
        resultImage = out.resultImage;
        note = out.note;
      } else if (actionType === "change-bg" || promptLower.includes("composite") || promptLower.includes("new background")) {
        resolvedAction = "change-bg";
        let preset = extraParams.preset || "studio";
        if (promptLower.includes("beach") || promptLower.includes("tropical")) preset = "beach";
        else if (promptLower.includes("city") || promptLower.includes("skyline")) preset = "city";
        else if (promptLower.includes("office")) preset = "office";
        else if (promptLower.includes("nature") || promptLower.includes("forest")) preset = "nature";
        else if (promptLower.includes("cafe")) preset = "cafe";
        else if (promptLower.includes("neon") || promptLower.includes("cyberpunk")) preset = "neon";

        let customBgBuf: Buffer | undefined;
        if (maskImage && maskImage.length > 50) {
          customBgBuf = parseBase64(maskImage);
        }

        const out = await changeBackground(imageBuf, preset, customBgBuf);
        resultImage = out.resultImage;
        note = out.note;
      } else if (actionType === "remove-object" || promptLower.includes("inpaint") || promptLower.includes("vanish") || maskImage) {
        resolvedAction = "remove-object";
        const maskBuf = maskImage ? parseBase64(maskImage) : undefined;
        const out = await removeObject(imageBuf, maskBuf);
        resultImage = out.resultImage;
        note = out.note;
      } else if (actionType === "creative-styles" || promptLower.includes("cartoon") || promptLower.includes("sketch") || promptLower.includes("watercolor") || promptLower.includes("sepia") || promptLower.includes("vintage")) {
        resolvedAction = "creative-filter";
        let effect = extraParams.effect || "cartoon";
        if (promptLower.includes("watercolor")) effect = "watercolor";
        else if (promptLower.includes("sketch") || promptLower.includes("pencil")) effect = "sketch";
        else if (promptLower.includes("vintage") || promptLower.includes("old") || promptLower.includes("sepia")) effect = "old-age";
        else if (promptLower.includes("headshot")) effect = "headshot";
        else if (promptLower.includes("superhero") || promptLower.includes("cyberpunk") || promptLower.includes("neon")) effect = "superhero";

        const out = await applyCreativeFilter(imageBuf, effect);
        resultImage = out.resultImage;
        note = out.note;
      } else {
        // Enhance
        resolvedAction = "enhance";
        let enhanceType = extraParams.enhanceType || "auto";
        if (promptLower.includes("hdr") || promptLower.includes("vibrant")) enhanceType = "hdr";
        else if (promptLower.includes("sharp") || promptLower.includes("crisp")) enhanceType = "sharp";
        else if (promptLower.includes("portrait") || promptLower.includes("glow")) enhanceType = "portrait";
        else if (promptLower.includes("super-res") || promptLower.includes("upscale") || promptLower.includes("2x")) enhanceType = "super-res";

        const out = await enhancePhoto(imageBuf, enhanceType);
        resultImage = out.resultImage;
        note = out.note;
      }

      const durationSeconds = Number(((Date.now() - startTime) / 1000).toFixed(2));

      return res.json({
        success: true,
        resultImage,
        actionType: resolvedAction,
        note,
        durationSeconds,
      });
    } catch (error: any) {
      console.error("Error in /api/magic-edit:", error);
      return res.status(500).json({
        success: false,
        error: error?.message || "An error occurred while processing the photo.",
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
