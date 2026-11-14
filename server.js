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

// OpenAI-compatible providers. Each provider activates only when its private API key exists.
const compatibleProviders = [
  ["OpenAI","OPENAI","https://api.openai.com/v1","gpt-4.1-mini"],
  ["Gemini","GEMINI","https://generativelanguage.googleapis.com/v1beta/openai","gemini-3.6-flash"],
  ["Groq","GROQ","https://api.groq.com/openai/v1","openai/gpt-oss-20b"],
  ["OpenRouter","OPENROUTER","https://openrouter.ai/api/v1","openrouter/free"],
  ["Mistral","MISTRAL","https://api.mistral.ai/v1","mistral-small-latest"],
  ["DeepSeek","DEEPSEEK","https://api.deepseek.com/v1","deepseek-chat"],
  ["xAI (Grok)","XAI","https://api.x.ai/v1","grok-3-mini"],
  ["Cerebras","CEREBRAS","https://api.cerebras.ai/v1","llama-3.3-70b"],
  ["Together AI","TOGETHER","https://api.together.ai/v1","meta-llama/Llama-3.3-70B-Instruct-Turbo"],
  ["Fireworks AI","FIREWORKS","https://api.fireworks.ai/inference/v1","accounts/fireworks/models/llama-v3p3-70b-instruct"],
  ["DeepInfra","DEEPINFRA","https://api.deepinfra.com/v1/openai","meta-llama/Meta-Llama-3.3-70B-Instruct"],
  ["SambaNova","SAMBANOVA","https://api.sambanova.ai/v1","Meta-Llama-3.3-70B-Instruct"],
  ["Perplexity","PERPLEXITY","https://api.perplexity.ai","sonar"],
  ["Hugging Face","HUGGINGFACE","https://router.huggingface.co/v1","Qwen/Qwen2.5-72B-Instruct"],
  ["NVIDIA NIM","NVIDIA_NIM","https://integrate.api.nvidia.com/v1","meta/llama-3.3-70b-instruct"],
  ["Qwen (DashScope)","QWEN","https://dashscope-intl.aliyuncs.com/compatible-mode/v1","qwen-plus"],
  ["Moonshot AI (Kimi)","MOONSHOT","https://api.moonshot.ai/v1","kimi-k2"]
].map(([name,prefix,defaultBase,defaultModel])=>({
  name, key:prefix+"_API_KEY",
  url:(process.env[prefix+"_BASE_URL"]||defaultBase).replace(/\/$/,"")+"/chat/completions",
  model:process.env[prefix+"_MODEL"]||defaultModel
}));

const anthropic = {
  name:"Anthropic (Claude)", key:"ANTHROPIC_API_KEY",
  url:(process.env.ANTHROPIC_BASE_URL||"https://api.anthropic.com").replace(/\/$/,"")+"/v1/messages",
  model:process.env.ANTHROPIC_MODEL||"claude-3-5-haiku-latest"
};
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
app.get("/api/health",(_req,res)=>res.json({ok:true,app:"NEXUS AI",version:"1.2.0"}));
app.get("/api/status",(_req,res)=>res.json({
  providers:[
    ...compatibleProviders.map(p=>({name:p.name,configured:Boolean(process.env[p.key]),model:p.model})),
    {name:anthropic.name,configured:Boolean(process.env[anthropic.key]),model:anthropic.model},
    {name:ollama.name,configured:ollamaEnabled,model:ollama.model,local:true}
  ],
  imageGeneration:{available:false,reason:"La generación de imágenes requiere un proveedor específico. No se activará ningún servicio de pago sin autorización."}
}));

function validateMessages(input){
  if(!Array.isArray(input)||!input.length)throw new Error("Envía al menos un mensaje.");
  if(input.length>24)throw new Error("Demasiados mensajes en una conversación.");
  return input.map(m=>{
    if(!m||!["system","user","assistant"].includes(m.role)||typeof m.content!=="string")throw new Error("Formato de conversación no válido.");
    if(m.content.length>12000)throw new Error("Un mensaje supera el límite de 12.000 caracteres.");
    return {role:m.role,content:m.content};
  });
}
async function askCompatible(p,messages){
  const headers={"Content-Type":"application/json"};
  if(p.key)headers.Authorization="Bearer "+process.env[p.key];
  let response, data={};
  for(let attempt=0;attempt<4;attempt++){
    try{
      response=await fetch(p.url,{method:"POST",headers,body:JSON.stringify({model:p.model,messages,temperature:0.7}),signal:AbortSignal.timeout(60000)});
      data=await response.json().catch(()=>({}));
    }catch(error){
      // A fetch timeout/network error throws before an HTTP response exists.
      // Retry it once; then let the provider fallback logic try the next provider.
      if(attempt>=1||!["TimeoutError","AbortError","TypeError"].includes(error.name))throw error;
      const delay=1500+Math.floor(Math.random()*500);
      console.warn(`Proveedor ${p.name} falló por ${error.name}; reintentando una vez en ${delay}ms.`);
      await new Promise(resolve=>setTimeout(resolve,delay));
      continue;
    }
    if(response.ok)break;
    // Retry temporary provider overload/rate-limit errors before falling back.
    if(![408,429,500,502,503,504].includes(response.status)||attempt===3){
      const detail=data.error?.message||data.message||("HTTP "+response.status);
      throw new Error(detail);
    }
    // Exponential backoff: 1s, 2s, 4s. Helps with temporary Gemini overload (503).
    const delay=1000*(2**attempt)+Math.floor(Math.random()*300);
    console.warn(`Proveedor ${p.name} respondió HTTP ${response.status}; reintentando en ${delay}ms (intento ${attempt+1}/4).`);
    await new Promise(resolve=>setTimeout(resolve,delay));
  }
  if(!response.ok)throw new Error(data.error?.message||"HTTP "+response.status);
  const reply=data.choices?.[0]?.message?.content;
  if(typeof reply!=="string"||!reply.trim())throw new Error("El proveedor devolvió una respuesta vacía.");
  return reply;
}
async function askAnthropic(messages){
  const system=messages.filter(m=>m.role==="system").map(m=>m.content).join("\n\n");
  const conversation=messages.filter(m=>m.role!=="system");
  const response=await fetch(anthropic.url,{method:"POST",headers:{
    "content-type":"application/json","x-api-key":process.env.ANTHROPIC_API_KEY,
    "anthropic-version":"2023-06-01"
  },body:JSON.stringify({model:anthropic.model,max_tokens:2048,system,messages:conversation}),signal:AbortSignal.timeout(60000)});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error?.message||"HTTP "+response.status);
  const reply=(data.content||[]).filter(x=>x.type==="text").map(x=>x.text).join("\n");
  if(!reply.trim())throw new Error("El proveedor devolvió una respuesta vacía.");
  return reply;
}
app.post("/api/chat",rateLimit,async(req,res)=>{
  let messages;
  try{messages=validateMessages(req.body?.messages);}catch(e){return res.status(400).json({error:e.message});}
  const available=[
    ...compatibleProviders.filter(p=>process.env[p.key]).map(p=>({provider:p,run:()=>askCompatible(p,messages)})),
    ...(process.env.ANTHROPIC_API_KEY?[{provider:anthropic,run:()=>askAnthropic(messages)}]:[]),
    ...(ollamaEnabled?[{provider:ollama,run:()=>askCompatible(ollama,messages)}]:[])
  ];
  if(!available.length)return res.status(503).json({error:"No hay proveedores configurados. Añade una API key privada en Render o activa Ollama en un servidor al que NEXUS pueda acceder."});
  const requestedProvider=typeof req.body?.provider==="string"?req.body.provider.trim():"";
  const candidates=requestedProvider?available.filter(item=>item.provider.name===requestedProvider):available;
  if(requestedProvider&&!candidates.length){
    return res.status(400).json({error:"El proveedor solicitado no está configurado o no existe."});
  }
  const errors=[];
  for(const item of candidates){
    try{return res.json({provider:item.provider.name,reply:await item.run()});}
    catch(error){errors.push(item.provider.name+": "+(error.name==="TimeoutError"?"tiempo de espera agotado":error.message));}
  }
  res.status(502).json({error:"Todos los proveedores configurados han fallado.",details:errors});
});
const port=process.env.PORT||3000;
app.listen(port,"0.0.0.0",()=>console.log("NEXUS AI listo en el puerto "+port));
