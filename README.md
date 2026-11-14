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
- Ollama (local)
- LocalAI (local)

Los proveedores externos se activan cuando su clave está configurada y están permitidos por el modo gratuito. Ollama y LocalAI no necesitan una clave por defecto, pero requieren que el backend pueda alcanzar su servidor y que se active su variable `*_ENABLED=true`. Si se exponen fuera de una red privada, configura autenticación y HTTPS.

## Motor local y orden de respaldo

NEXUS intenta primero los motores locales activados (Ollama y después LocalAI). Si fallan, continúa con los proveedores externos gratuitos configurados. Los proveedores de pago siguen bloqueados por defecto.

Variables:
- `OLLAMA_ENABLED=true`, `OLLAMA_BASE_URL=http://127.0.0.1:11434`, `OLLAMA_MODEL=llama3.2`
- `LOCALAI_ENABLED=true`, `LOCALAI_BASE_URL=http://127.0.0.1:8080`, `LOCALAI_MODEL=gpt-4`
- `OLLAMA_API_KEY` y `LOCALAI_API_KEY` son opcionales para endpoints que requieran Bearer token.

**Importante:** en Render, `127.0.0.1` apunta al contenedor de Render, no al ordenador del usuario. Para usar el motor local desde Render, el servidor Ollama/LocalAI debe estar en un host accesible mediante una conexión privada o un endpoint HTTPS seguro. No expongas directamente un puerto sin autenticación. El uso local evita pagar por token al proveedor, pero depende del hardware, electricidad y disponibilidad del equipo.

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

Versión 1.4: interfaz web, motores locales Ollama y LocalAI, proveedores externos con fallback, endpoint de estado, validación de entrada y comprobación de salud.
