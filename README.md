# NEXUS AI

Asistente web en Node.js con varios proveedores compatibles con Chat Completions y cambio automático al siguiente proveedor si uno falla.

## Proveedores
- Google Gemini API
- Groq
- OpenRouter (modelo dinámico gratuito)
- Mistral
- Ollama local (opcional; solo si el servidor puede acceder a tu equipo)

## Ejecutar
1. Instala Node.js 20 o superior.
2. Ejecuta `npm install`.
3. Copia `.env.example` a `.env`.
4. Añade las claves de los proveedores que quieras usar.
5. Ejecuta `npm start` y abre `http://localhost:3000`.

## API
- `GET /api/health`: comprobación del servidor.
- `GET /api/status`: estado de configuración sin revelar claves.
- `POST /api/chat`: conversación con fallback entre proveedores.

## Límites y seguridad
- Las claves nunca se envían al navegador.
- Configura las claves como secretos/variables privadas en el hosting.
- OpenRouter ofrece modelos gratuitos sujetos a límites; Gemini, Groq y Mistral aplican sus propios planes y cuotas. No existe garantía de uso ilimitado.
- La generación de imágenes no está activada en esta versión: muchos servicios de imágenes cobran por generación incluso cuando el chat tiene modelos gratuitos. Se añadirá un proveedor de imágenes solo después de elegir uno y conocer sus condiciones.
- Ollama es gratuito y local, pero requiere instalarlo y descargar modelos en el equipo que ejecuta el backend. Un servidor remoto no puede acceder automáticamente al Ollama de tu ordenador.

## Estado
Versión 1.1: interfaz renovada, Gemini, proveedores múltiples, fallback, Ollama opcional, validación de entrada y límite básico de solicitudes.
