# NEXUS AI — preparación para Google Play (Android)

## Estado
- Identificador Android reservado: `com.nexusai.app`
- Nombre de tienda: NEXUS AI
- Modelo de distribución previsto: gratuita
- Monetización: ninguna inicialmente (sin anuncios ni membresías)
- Backend: https://nexus-ai-tnkq.onrender.com
- Política de privacidad provisional: https://nexus-ai-tnkq.onrender.com/privacy.html
- Formato de entrega: Android App Bundle (.aab)

## Cómo generar el AAB
1. Abre el repositorio GitHub y entra en **Actions**.
2. Selecciona **Build NEXUS AI for Android**.
3. Pulsa **Run workflow** en la rama `main`.
4. Cuando termine, abre la ejecución y descarga el artefacto `nexus-ai-android-aab`.
5. El AAB solo estará firmado para Play si el repositorio tiene configurados los cuatro secretos de firma indicados abajo. Sin ellos, será un paquete de prueba sin firma de publicación.

## Firma de publicación — imprescindible
Crea un keystore de publicación seguro en tu propio equipo y guarda una copia de respaldo fuera de GitHub. Nunca lo subas al repositorio ni lo compartas en chats.

Configura estos GitHub Actions secrets en **Settings → Secrets and variables → Actions**:
- `ANDROID_KEYSTORE_BASE64`: contenido del archivo keystore codificado en Base64.
- `ANDROID_KEY_ALIAS`: alias de la clave.
- `ANDROID_KEYSTORE_PASSWORD`: contraseña del keystore.
- `ANDROID_KEY_PASSWORD`: contraseña de la clave.

No pierdas el keystore ni sus contraseñas: son necesarios para futuras actualizaciones. No pegues estos secretos en conversaciones.

## Ficha inicial de Google Play
**Nombre:** NEXUS AI

**Descripción breve (borrador):** Tu espacio de inteligencia artificial para conversar, explorar ideas y crear.

**Descripción completa (borrador):**
NEXUS AI reúne una experiencia de asistente de inteligencia artificial en una interfaz sencilla. Escribe preguntas, desarrolla ideas y conversa desde tu dispositivo Android. El servicio puede conectarse a distintos proveedores de IA según su disponibilidad y configuración.

La aplicación es gratuita. La disponibilidad, velocidad y límites de las respuestas dependen del servicio y de los proveedores conectados. No se garantiza disponibilidad ilimitada.

**Categoría sugerida:** Productividad (confirmar durante el alta).

## Elementos que todavía hay que completar antes de enviar
- Icono final de 512 × 512 px y recursos gráficos de ficha.
- Capturas reales de la app en dispositivos Android.
- Nombre legal y correo de contacto del responsable en la política de privacidad.
- Formulario de Seguridad de datos de Google Play, según el comportamiento real del backend y de los proveedores.
- Clasificación por edades / cuestionario de contenido.
- Países de distribución, datos de contacto y ficha de tienda.
- Prueba en móviles reales, incluidos inicio de sesión si se añade, teclado, navegación atrás, rotación y conexión lenta.
- Verificar que el backend y sus proveedores tienen capacidad y condiciones adecuadas para usuarios públicos.

## Notas técnicas y de seguridad
- La app Android es una envoltura Capacitor que carga la web alojada por NEXUS AI. Necesita conexión a Internet y que el backend siga disponible.
- Las claves de IA deben permanecer en las variables privadas de Render. Nunca incrustarlas en Android.
- La aplicación gratuita no significa que los proveedores de IA sean ilimitados o sin coste. Mantén límites automáticos y no actives proveedores de pago sin autorización.
- Antes de producción, probar y revisar las políticas de Google Play aplicables a apps con IA generativa y contenido generado por usuarios.
