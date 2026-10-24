import express from 'express';
import { createServer as createViteServer } from 'vite';
import type { ViteDevServer } from 'vite';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';
import nodemailer from 'nodemailer';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 3000;

async function createServer() {
  const app = express();
  app.use(express.json());

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Helper for keyword-based fallback analysis when AI quota is exceeded
  function heuristicAnalysis(description: string) {
    const text = (description || '').toLowerCase();
    let category = "General Maintenance";
    if (text.includes("plumb") || text.includes("leak") || text.includes("pipe") || text.includes("nal") || text.includes("pani")) {
      category = "Plumbing";
    } else if (text.includes("electr") || text.includes("wire") || text.includes("light") || text.includes("bijli") || text.includes("switch")) {
      category = "Electrician";
    } else if (text.includes("ac") || text.includes("cool") || text.includes("filter") || text.includes("hawa")) {
      category = "AC Repair";
    } else if (text.includes("clean") || text.includes("safai") || text.includes("wash")) {
      category = "Cleaning";
    } else if (text.includes("carpent") || text.includes("wood") || text.includes("door") || text.includes("badhai")) {
      category = "Carpentry";
    } else if (text.includes("paint") || text.includes("rang")) {
      category = "Painting";
    }
    return {
      category,
      problem_summary: description ? description.slice(0, 80) : "Service request",
      urgency: (text.includes("urgent") || text.includes("jaldi") || text.includes("emergency")) ? "high" : "normal",
      preferred_time: "Today / As soon as possible",
      missing_fields: ["Exact location in Jaunpur"],
      follow_up_question: `Jaunpur me ${category} service ke liye kya aap apna area (e.g. Olandganj, Civil Lines, Shahganj) confirm kar sakte hain?`
    };
  }

  // AI Endpoint: Understand Problem
  app.post('/api/ai/understand-problem', async (req, res) => {
    const { description = '' } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite", // Fast model for initial analysis
        contents: `Analyze this hyperlocal service request in Jaunpur, India and return a JSON object.
        Request: "${description}"
        
        Output Schema:
        {
          "category": "string (e.g. Plumbing, Electrician, Cleaning, AC Repair, etc.)",
          "problem_summary": "string (brief summary)",
          "urgency": "string (low, normal, high)",
          "preferred_time": "string (extracted time/date preference)",
          "missing_fields": ["string (what info is missing?)"],
          "follow_up_question": "string (helpful question for user in their language)"
        }
        
        Support Hindi, English, and Hinglish.`,
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = JSON.parse(response.text || '{}');
      res.json(result);
    } catch (error) {
      console.warn("AI Understand Problem Fallback:", error);
      res.json(heuristicAnalysis(description));
    }
  });

  // AI Endpoint: General Chat with Grounding
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { message, history = [], modelType = 'general', useMaps = true } = req.body;
      
      let modelName = "gemini-3.8-flash";
      if (modelType === 'fast') modelName = "gemini-3.1-flash-lite";

      const systemInstruction = `You are ApnaLocal AI assistant for Jaunpur, UP. 
Your goal is to help users find local services, local information, and solve household problems.

MANDATORY: 
- Support Hindi, English, and Hinglish.
- Be brief, friendly, and helpful. 
- "Har Zaroorat Ka Local Solution" is our motto.`;

      // Sanitize history turns
      const sanitizedHistory: any[] = [];
      if (Array.isArray(history)) {
        for (const h of history) {
          const role = h.role === 'assistant' ? 'model' : (h.role === 'model' ? 'model' : 'user');
          const text = (h.parts?.[0]?.text || h.text || '').trim();
          if (text) {
            sanitizedHistory.push({
              role,
              parts: [{ text }]
            });
          }
        }
      }

      // Ensure history starts with a 'user' turn if there is history
      while (sanitizedHistory.length > 0 && sanitizedHistory[0].role !== 'user') {
        sanitizedHistory.shift();
      }

      const contents = [
        ...sanitizedHistory,
        { role: 'user', parts: [{ text: message }] }
      ];

      const tools: any[] = [];
      if (useMaps) {
        tools.push({ googleMaps: {} });
      } else {
        tools.push({ googleSearch: {} });
      }

      let responseText = '';
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            tools: tools.length > 0 ? tools : undefined
          }
        });
        responseText = response.text || '';
      } catch (primaryErr: any) {
        try {
          const fallbackResponse = await ai.models.generateContent({
            model: modelName,
            contents,
            config: {
              systemInstruction
            }
          });
          responseText = fallbackResponse.text || '';
        } catch (secondaryErr: any) {
          console.warn("AI Chat Fallback:", secondaryErr?.message);
          responseText = "Namaste! ApnaLocal AI is active for Jaunpur. You can browse and directly contact verified local professionals (Electricians, Plumbers, AC Repair, Cleaning) in Olandganj, Civil Lines, Shahganj, and throughout Jaunpur in the Directory!";
        }
      }

      res.json({ text: responseText || "I am here to help with Jaunpur local services!" });
    } catch (error) {
      console.warn("AI Chat Handled Error:", error);
      res.json({ text: "Namaste! ApnaLocal AI is active for Jaunpur. You can find verified local professionals in our Directory or book directly!" });
    }
  });

  // AI Endpoint: Image Generation (Free Tier Fallback using Curated Unsplash Images)
  app.post('/api/ai/generate-image', async (req, res) => {
    try {
      const { prompt } = req.body;
      // Provide curated local service images for Jaunpur based on keywords
      const lower = (prompt || '').toLowerCase();
      let imageUrl = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800"; // General repair
      if (lower.includes('plumb') || lower.includes('pipe') | lower.includes('leak')) {
        imageUrl = "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&q=80&w=800";
      } else if (lower.includes('electric') || lower.includes('wire') || lower.includes('power')) {
        imageUrl = "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800";
      } else if (lower.includes('clean') || lower.includes('sweep') || lower.includes('dust')) {
        imageUrl = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800";
      } else if (lower.includes('ac') || lower.includes('cool') || lower.includes('repair')) {
        imageUrl = "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&q=80&w=800";
      }
      res.json({ imageUrl });
    } catch (error) {
      console.error("Image Gen Error:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });

  // API Endpoint: Notify Provider of Status Update
  app.post('/api/admin/notify-provider', async (req, res) => {
    try {
      const { providerEmail, status, providerName } = req.body;
      if (!providerEmail) return res.status(400).json({ error: "Missing provider email" });

      // Check if SMTP is configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("Skipping email notification: SMTP configuration missing.");
        return res.json({ success: true, warning: 'Email not configured' });
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });

      await transporter.sendMail({
        from: '"ApnaLocal Admin" <noreply@apnalocal.com>',
        to: providerEmail,
        subject: `Verification Status Updated: ${status.toUpperCase()}`,
        text: `Hello ${providerName},\n\nYour verification status on ApnaLocal has been updated to: ${status}.\n\nBest regards,\nApnaLocal Team`
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Email Error:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });


  // AI Endpoint: Provider Copilot - Draft Response
  app.post('/api/ai/copilot-draft', async (req, res) => {
    const { customerMessage = '', serviceType = 'Service' } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: `Draft a professional, friendly, and helpful response for a service provider in Jaunpur.
        Customer Problem: "${customerMessage}"
        Service Type: "${serviceType}"
        
        Requirements:
        - Language: Hinglish (mix of Hindi and English as common in Jaunpur).
        - Tone: Expert but polite.
        - Include: Acknowledgment of the problem, estimation of visit fee if applicable, and a request for a preferred time.
        
        Keep it brief (max 3-4 sentences).`
      });

      res.json({ draft: response.text });
    } catch (error) {
      console.warn("Copilot Draft Fallback:", error);
      res.json({ draft: `Namaste! Maine aapki request dekhi hai (${serviceType}). Main Jaunpur me timely visit karke kaam complete kar dunga. Kripya apna suitable time aur location share karein.` });
    }
  });


  let vite: ViteDevServer | undefined;
  if (!isProd) {
    vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
      },
      appType: 'custom',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
  }

  app.get('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      let template;
      if (!isProd && vite) {
        const indexHtml = await fs.readFile(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, indexHtml);
      } else {
        template = await fs.readFile(path.resolve(process.cwd(), 'dist/index.html'), 'utf-8');
      }
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite?.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

createServer();
