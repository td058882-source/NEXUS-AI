require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
app.disable("x-powered-by");
app.use((req,res,next)=>{
  res.setHeader("X-Content-Type-Options","nosniff");
  res.setHeader("Referrer-Policy","no-referrer");
  res.setHeader("X-Frame-Options","DENY");
  next();
});
app.use(express.json({limit:"1mb"}));
app.use(express.static(path.join(__dirname,"public")));

const providers = [
  {name:"Gemini",key:"GEMINI_API_KEY",url:"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",model:process.env.GEMINI_MODEL||"gemini-3.8-flash"},
  {name:"Groq",key:"GROQ_API_KEY",url:"https://api.groq.com/openai/v1/chat/completions",model:process.env.GROQ_MODEL||"llama-3.3-70b-versatile"},
  {name:"OpenRouter",key:"OPENROUTER_API_KEY",url:"https://openrouter.ai/api/v1/chat/completions",model:process.env.OPENROUTER_MODEL||"openrouter/free"},
  {name:"Mistral",key:"MISTRAL_API_KEY",url:"https://api.mistral.ai/v1/chat/completions",model:process.env.MISTRAL_MODEL||"mistral-small-latest"}
];
const ollamaEnabled = process.env.OLLAMA_ENABLED === "true";
const ollama = {
  name:"Ollama (local)", key:null,
  url:(process.env.OLLAMA_BASE_URL||"http://127.0.0.1:11434/v1").replace(/\/$/,"")+"/chat/completions",
  model:process.env.OLLAMA_MODEL||"llama3.2"
};
const requestCounts = new Map();
function rateLimit(req,res,next){
  const now=Date.now(),key=req.ip||"unknown",entry=requestCounts.get(key)||{start:now,count:0};
  if(now-entry.start>60000){entry.start=now;entry.count=0;}
  entry.count++;requestCounts.set(key,entry);
  if(entry.count>30)return res.status(429).json({error:"Has enviado demasiadas solicitudes. Espera un minuto."});
  next();
}
app.get("/api/health",(_req,res)=>res.json({ok:true,app:"NEXUS AI",version:"1.1.0"}));
app.get("/api/status",(_req,res)=>res.json({
  providers:[
    ...providers.map(p=>({name:p.name,configured:Boolean(process.env[p.key]),model:p.model})),
    {name:ollama.name,configured:ollamaEnabled,model:ollama.model,local:true}
  ],
  imageGeneration:{available:false,reason:"La generación de imágenes requiere un proveedor compatible y puede tener coste. No se activará sin configuración y confirmación."}
}));
app.post("/api/chat",rateLimit,async(req,res)=>{
  const input=req.body?.messages;
  if(!Array.isArray(input)||!input.length)return res.status(400).json({error:"Envía al menos un mensaje."});
  if(input.length>24)return res.status(400).json({error:"Demasiados mensajes en una conversación."});
  const messages=[];
  for(const m of input){
    if(!m||!["system","user","assistant"].includes(m.role)||typeof m.content!=="string")return res.status(400).json({error:"Formato de conversación no válido."});
    if(m.content.length>12000)return res.status(400).json({error:"Un mensaje supera el límite de 12.000 caracteres."});
    messages.push({role:m.role,content:m.content});
  }
  const available=[...providers.filter(p=>process.env[p.key]),...(ollamaEnabled?[ollama]:[])];
  if(!available.length)return res.status(503).json({error:"No hay proveedores configurados. Añade una API key o activa Ollama en tu equipo."});
  const errors=[];
  for(const p of available){
    try{
      const headers={"Content-Type":"application/json"};
      if(p.key)headers.Authorization="Bearer "+process.env[p.key];
      const response=await fetch(p.url,{method:"POST",headers,body:JSON.stringify({model:p.model,messages,temperature:0.7}),signal:AbortSignal.timeout(60000)});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.error?.message||"HTTP "+response.status);
      const reply=data.choices?.[0]?.message?.content;
      if(typeof reply!=="string"||!reply.trim())throw new Error("El proveedor devolvió una respuesta vacía.");
      return res.json({provider:p.name,reply});
    }catch(error){errors.push(p.name+": "+(error.name==="TimeoutError"?"tiempo de espera agotado":error.message));}
  }
  res.status(502).json({error:"Todos los proveedores disponibles han fallado.",details:errors});
});
const port=process.env.PORT||3000;
app.listen(port,()=>console.log("NEXUS AI listo en el puerto "+port));
