require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

const providers = [
  { name: "Groq", key: "GROQ_API_KEY", url: "https://api.groq.com/openai/v1/chat/completions", model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile" },
  { name: "OpenRouter", key: "OPENROUTER_API_KEY", url: "https://openrouter.ai/api/v1/chat/completions", model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free" },
  { name: "Mistral", key: "MISTRAL_API_KEY", url: "https://api.mistral.ai/v1/chat/completions", model: process.env.MISTRAL_MODEL || "mistral-small-latest" }
];

app.get("/api/status", (_req, res) => {
  res.json({ providers: providers.map(p => ({ name: p.name, configured: Boolean(process.env[p.key]) })) });
});

app.post("/api/chat", async (req, res) => {
  const messages = req.body?.messages;
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: "Envía al menos un mensaje." });
  const available = providers.filter(p => process.env[p.key]);
  if (!available.length) return res.status(503).json({ error: "No hay proveedores configurados. Añade una API key en las variables de entorno del servidor." });

  const errors = [];
  for (const provider of available) {
    try {
      const response = await fetch(provider.url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${process.env[provider.key]}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: provider.model, messages, temperature: 0.7 })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || `HTTP ${response.status}`);
      return res.json({ provider: provider.name, reply: data.choices?.[0]?.message?.content || "El proveedor no devolvió texto." });
    } catch (error) { errors.push(`${provider.name}: ${error.message}`); }
  }
  res.status(502).json({ error: "Todos los proveedores disponibles han fallado.", details: errors });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`NEXUS AI activo en http://localhost:${port}`));
