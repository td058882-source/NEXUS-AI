# NEXUS AI

Asistente web en Node.js con integración multi-proveedor, selección automática y fallback cuando un proveedor falla.

## Proveedores compatibles

NEXUS AI puede conectarse a estos proveedores mediante variables privadas de entorno:

- OpenAI
- Google Gemini
- Groq
- OpenRouter
- Mistral
- DeepSeek
- xAI (Grok)
- Cerebras
- Together AI
- Fireworks AI
- DeepInfra
- SambaNova
- Perplexity
- Hugging Face Inference Providers
- NVIDIA NIM
- Qwen / DashScope
- Moonshot AI / Kimi
- Anthropic / Claude
- Ollama (local, si el backend puede acceder a la instancia)

Un proveedor solo se considera activo cuando su clave está configurada (Ollama requiere además `OLLAMA_ENABLED=true`). Tener integración no significa que el proveedor sea gratuito ni que ofrezca uso ilimitado.

## Ejecutar localmente

1. Instala Node.js 20 o superior.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env`.
4. Añade las claves de los proveedores que quieras utilizar.
5. Ejecuta `npm start` y abre `http://localhost:3000`.

## Despliegue en Render

Configura las claves como variables privadas en el apartado **Environment** del servicio. Nunca las añadas al repositorio, al navegador ni a mensajes públicos. Después guarda y despliega los cambios.

## API

- `GET /api/health`: comprobación del servidor.
- `GET /api/status`: proveedores configurados y estado de generación de imágenes, sin revelar claves.
- `POST /api/chat`: conversación con fallback entre proveedores disponibles.

## Seguridad y límites

- Las claves API se mantienen en el backend y no se envían al navegador.
- Las solicitudes están limitadas por tamaño, número de mensajes y frecuencia básica por IP.
- Los proveedores externos tienen sus propias cuotas, límites, condiciones y posibles costes. No se garantiza uso ilimitado.
- La generación de imágenes todavía no está activada. No se habilitará ningún servicio que pueda cobrar sin autorización explícita.
- Ollama es gratuito y local, pero un servidor remoto no puede acceder automáticamente al Ollama de tu ordenador; debe estar en una red accesible y configurada de forma segura.

## Estado

Versión 1.2: interfaz web, 19 integraciones de proveedor, selección automática con fallback, endpoint de estado, validación de entrada y comprobación de salud.
