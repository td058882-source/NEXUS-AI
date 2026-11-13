# NEXUS AI

Primera versión: interfaz web de chat y backend Node.js con fallback entre Groq, OpenRouter y Mistral.

## Ejecutar en local
1. Instala Node.js 20 o superior.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env` y añade una o más claves API.
4. Ejecuta `npm start` y abre `http://localhost:3000`.

## Seguridad y límites
Las claves se guardan solo en el servidor como variables de entorno; nunca las publiques ni las pongas en el frontend. Las cuotas gratuitas dependen de cada proveedor y pueden cambiar. Esta versión no incluye generación de imágenes ni garantiza uso ilimitado.
