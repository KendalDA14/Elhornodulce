# El horno dulce

Aplicación web para el catálogo, los pedidos y la administración de El horno dulce. Está construida con Next.js App Router, TypeScript, Tailwind, Prisma y MySQL/MariaDB.

## Requisitos

- Node.js 22
- npm
- MySQL o MariaDB

## Desarrollo local

1. Instala las dependencias:

```bash
npm install
```

2. Crea `.env` a partir de `.env.example` y configura, como mínimo:

```env
DATABASE_URL="mysql://USUARIO:CONTRASENA@HOST:3306/NOMBRE_BD"
ADMIN_SESSION_SECRET="secreto-aleatorio-de-al-menos-32-caracteres"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SINPE_NUMBER="7010 4855"
NEXT_PUBLIC_SINPE_HOLDER="Anahi Quesada Zuniga"
NEXT_PUBLIC_SINPE_INSTRUCTIONS="Realiza el SINPE por el monto total y sube el comprobante o envíalo por WhatsApp."
NEXT_PUBLIC_WHATSAPP_NUMBER="50670104855"
```

3. Genera Prisma y aplica las migraciones existentes:

```bash
npm run db:generate
npx prisma migrate deploy
```

4. Crea o actualiza el administrador desde la consola:

```powershell
$env:ADMIN_EMAIL="admin@ejemplo.com"
$env:ADMIN_PASSWORD="una-contrasena-segura"
$env:ADMIN_NAME="Administración El horno dulce"
npm run seed:admin
```

5. Inicia el entorno local:

```bash
npm run dev
```

Abre `http://localhost:3000`.

## Comandos

```bash
npm run dev          # Desarrollo
npm run lint         # ESLint
npx tsc --noEmit     # Verificación de TypeScript
npm run build        # Compilación de producción y Prisma
npm run start        # Servidor de producción después del build
npm run db:generate  # Regenerar el cliente Prisma
npm run db:migrate   # Crear/aplicar una migración en desarrollo
npm run db:studio    # Abrir Prisma Studio
npm run seed:admin   # Crear o actualizar el administrador
```

## Acceso y rutas

- `/`: inicio, productos destacados, reseñas y políticas.
- `/catalogo`: catálogo completo.
- `/checkout`: pedido como invitado o cliente registrado.
- `/registro`: registro opcional de clientes.
- `/login`: acceso único para clientes y administrador.
- `/cuenta`: historial del cliente.
- `/personalizado`: solicitud de postres personalizados.
- `/admin`: panel protegido.
- `/admin/login`: ruta de compatibilidad que redirige a `/login`.

El administrador no se registra desde la web. Se crea únicamente con `npm run seed:admin`.

## Imágenes y archivos

El logo real se sirve desde `public/brand/logo.jpeg`; `src/app/icon.jpeg` se usa como icono de la aplicación.

Si `BLOB_READ_WRITE_TOKEN` está configurado, las nuevas imágenes se almacenan en Vercel Blob. Sin esa variable, se usa almacenamiento local:

```text
public/uploads    # imágenes públicas de productos
private_uploads   # comprobantes SINPE y referencias privadas
```

Las rutas privadas validan la sesión del administrador. Los uploads aceptan únicamente imágenes permitidas y aplican un límite de 5 MB. En producción, ambas carpetas deben tener permisos de escritura y formar parte de las copias de seguridad.

## Notificaciones

Las notificaciones push del administrador requieren HTTPS y llaves VAPID:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:correo@ejemplo.com"
```

Puedes generar un par nuevo con:

```bash
node -e "const webpush=require('web-push'); console.log(webpush.generateVAPIDKeys())"
```

## Despliegue en Hostinger

1. Usa el preset de Next.js, la rama correcta y Node.js 22.
2. Configura todas las variables en el panel; nunca subas `.env` al repositorio.
3. Conecta la base MySQL/MariaDB de producción mediante `DATABASE_URL`.
4. Aplica las migraciones y crea el administrador por consola.
5. Compila y arranca la aplicación:

```bash
npm install
npx prisma migrate deploy
npm run build
npm run start
```

Variables de producción:

```env
DATABASE_URL=""
ADMIN_SESSION_SECRET=""
NEXT_PUBLIC_SITE_URL="https://tu-dominio.com"
NEXT_PUBLIC_SINPE_NUMBER=""
NEXT_PUBLIC_SINPE_HOLDER=""
NEXT_PUBLIC_SINPE_INSTRUCTIONS=""
NEXT_PUBLIC_WHATSAPP_NUMBER=""
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT=""
BLOB_READ_WRITE_TOKEN=""
```

`ADMIN_SESSION_SECRET` debe ser aleatorio, privado y tener al menos 32 caracteres. `BLOB_READ_WRITE_TOKEN` es opcional.

## Verificación antes de publicar

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Después del despliegue, comprueba el inicio, catálogo, carrito, checkout, registro, login, cuenta y las rutas principales del panel en escritorio y teléfono.
