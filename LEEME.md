# 🎟️ Sistema de Pases para Eventos

Sistema completo para gestionar acceso a eventos mediante códigos QR.

## Componentes

| Parte | Tecnología | Para quién |
|-------|-----------|------------|
| `backend/` | Node.js + Express + SQLite | API REST |
| `web/` | React + Vite | Creador del evento |
| `mobile/` | React Native + Expo | Boletero (scanner) |

---

## Requisitos previos

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **npm 9+** (viene con Node)
- **Expo Go** en el celular Android — Google Play Store

---

## Instalación rápida

```bash
cd sistema_entrada
chmod +x setup.sh
./setup.sh
```

---

## Configuración del backend

Editá `backend/.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="ponele-una-clave-secreta-larga"
PORT=3000
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3000"

# Resend (emails) - Crear cuenta gratis en https://resend.com
RESEND_API_KEY="re_tu_api_key"
RESEND_FROM_EMAIL="Sistema Entrada <noreply@tudominio.com>"
```

> **Sin configurar Resend**, los emails se simulan en la consola del backend.  
> Podés usar el sistema completo sin emails configurados.

---

## Iniciar en desarrollo

Abrí **3 terminales**:

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
# Corre en http://localhost:3000
```

**Terminal 2 – Web:**
```bash
cd web
npm run dev
# Abre http://localhost:5173 en el navegador
```

**Terminal 3 – Mobile:**
```bash
cd mobile
npm start
# Escaneá el QR con Expo Go en tu Android
```

---

## App Mobile (Boletero) en dispositivo físico

Si usás un celular físico (recomendado para la cámara), el celular y la computadora deben estar en **la misma red WiFi**.

1. Buscá la IP de tu computadora: `ipconfig getifaddr en0` (Mac) o `ipconfig` (Windows)
2. Editá `mobile/.env`:
   ```
   EXPO_PUBLIC_API_URL=http://192.168.X.X:3000
   ```
3. Reiniciá `npm start` en la carpeta mobile

---

## Flujo completo

### 1. Creador del evento (Web)
1. Registrarse / Ingresar en `http://localhost:5173`
2. Crear un nuevo evento con nombre, fecha y lugar
3. En el detalle del evento, agregar invitados (nombre + email/teléfono)
4. Enviar la invitación:
   - **Email**: click en "Email" → llega con el link de la invitación
   - **WhatsApp**: click en "WhatsApp" → se abre WhatsApp con el mensaje listo para enviar
5. Ver estadísticas de ingresados vs pendientes en tiempo real

### 2. Invitado
- Recibe un link tipo `http://tu-sitio/invite/TOKEN`
- Al abrirlo ve:
  - Nombre del evento, fecha, lugar
  - Su **código QR** personal
  - Instrucciones para entrar
- Guarda la página o el email para mostrarlo en la puerta

### 3. Boletero (Android)
1. Ingresar con el mismo usuario/contraseña del creador
2. Apuntar la cámara al QR del invitado
3. La app muestra al instante:
   - ✅ Verde: acceso permitido (marca al invitado como ingresado)
   - ⚠️ Amarillo: ya ingresó (código ya usado)
   - ❌ Rojo: código inválido

---

## Estructura del proyecto

```
sistema_entrada/
├── backend/
│   ├── prisma/schema.prisma     # Modelo de datos
│   ├── src/
│   │   ├── index.ts             # Servidor Express
│   │   ├── routes/
│   │   │   ├── auth.ts          # Login / Registro
│   │   │   ├── events.ts        # CRUD Eventos
│   │   │   └── invitations.ts   # Invitaciones + QR + envíos
│   │   ├── middleware/auth.ts   # Validación JWT
│   │   └── lib/
│   │       ├── prisma.ts        # Cliente DB
│   │       ├── jwt.ts           # Tokens
│   │       └── email.ts         # Envío con Resend
│   └── .env
├── web/
│   └── src/
│       ├── pages/
│       │   ├── LoginPage.tsx
│       │   ├── RegisterPage.tsx
│       │   ├── DashboardPage.tsx    # Lista de eventos
│       │   ├── NewEventPage.tsx
│       │   ├── EventDetailPage.tsx  # Gestión de invitados
│       │   └── InvitePage.tsx       # Página pública del invitado
│       └── lib/
│           ├── api.ts           # Cliente HTTP
│           └── auth.ts          # Sesión
└── mobile/
    └── app/
        ├── index.tsx            # Login del boletero
        └── scanner.tsx          # Scanner QR + validación
```

---

## API endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/login` | Iniciar sesión |
| GET | `/api/events` | Mis eventos |
| POST | `/api/events` | Crear evento |
| GET | `/api/invitations/events/:id/invitations` | Invitados del evento |
| POST | `/api/invitations/events/:id/invitations` | Crear invitado |
| GET | `/api/invitations/public/:token` | Ver invitación (público) |
| POST | `/api/invitations/validate` | Validar QR (boletero) |
| POST | `.../invitations/:id/send-email` | Enviar email |
| POST | `.../invitations/:id/whatsapp-link` | Generar link WhatsApp |

---

## Para producción

1. **Backend**: Deployar en Railway, Render, o un VPS. Cambiar `FRONTEND_URL` y `BACKEND_URL`.
2. **Web**: `npm run build` → deployar la carpeta `dist/` en Vercel, Netlify, etc.
3. **Mobile**: Generar APK con `expo build:android` o usar EAS Build.
4. **Database**: En producción, considerar migrar de SQLite a PostgreSQL.
