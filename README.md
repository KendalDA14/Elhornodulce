# El horno dulce

Web de venta de postres para El horno dulce, construida con Next.js App Router, TypeScript, Tailwind, Prisma y MySQL/MariaDB.

## Desarrollo Local

1. Instalar dependencias:

```bash
npm install
```

2. Configurar `.env`:

```env
DATABASE_URL="mysql://root@localhost:3306/horno_dulce"
ADMIN_SESSION_SECRET="usa-un-secreto-aleatorio-de-minimo-32-caracteres"
NEXT_PUBLIC_SINPE_NUMBER="7010 4855"
NEXT_PUBLIC_SINPE_HOLDER="Anahi Quesada Zuniga"
NEXT_PUBLIC_SINPE_INSTRUCTIONS="Realiza el SINPE por el monto total y sube el comprobante o envialo por WhatsApp."
NEXT_PUBLIC_WHATSAPP_NUMBER="50670104855"
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT="mailto:admin@horno.local"
```

3. Crear/aplicar la base de datos:

```bash
npm run db:generate
npx prisma migrate deploy
npm run seed:local-products
```

4. Crear el admin por consola:

```bash
$env:ADMIN_EMAIL="admin@horno.local"
$env:ADMIN_PASSWORD="cambia-esta-contrasena"
$env:ADMIN_NAME="Admin El horno dulce"
npm run seed:admin
```

5. Iniciar la web:

```bash
npm run dev
```

Abrir `http://localhost:3000`.

## Login

- Login unico: `/login`.
- Registro de clientes: `/registro`.
- Cuenta e historial: `/cuenta`.
- Admin: entra desde `/login` usando el correo de admin.
- `/admin/login` existe solo como compatibilidad y redirige a `/login`.
- El admin no se registra desde la web; se crea por consola con `npm run seed:admin`.

## Hostinger

El proyecto usa MySQL/MariaDB para que sea compatible con Hostinger. En este equipo la base local se llama `horno_dulce`.

En Hostinger, configura `DATABASE_URL` con las credenciales reales del panel:

```env
DATABASE_URL="mysql://USUARIO:CONTRASENA@HOST:3306/NOMBRE_BD"
```

Comandos esperados:

```bash
npm install
npm run db:generate
npx prisma migrate deploy
npm run build
npm run start
```

Variables necesarias:

```env
DATABASE_URL=""
ADMIN_SESSION_SECRET=""
NEXT_PUBLIC_SINPE_NUMBER=""
NEXT_PUBLIC_SINPE_HOLDER=""
NEXT_PUBLIC_SINPE_INSTRUCTIONS=""
NEXT_PUBLIC_WHATSAPP_NUMBER=""
NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_SUBJECT=""
BLOB_READ_WRITE_TOKEN=""
```

`ADMIN_SESSION_SECRET` es obligatorio en produccion y debe tener al menos 32 caracteres.

`BLOB_READ_WRITE_TOKEN` es opcional. Si queda vacio, los uploads se guardan localmente.

Para activar notificaciones push del admin, genera llaves VAPID y coloca los valores en `.env`:

```bash
node -e "const webpush=require('web-push'); console.log(webpush.generateVAPIDKeys())"
```

Las notificaciones push requieren HTTPS en produccion. En local funcionan con `http://localhost:3000`.

## Logo

La web usa el logo real de la empresa desde:

```text
public/brand/logo.jpeg
src/components/public/logo.jpeg
```

Tambien se copio como icono de Next.js en:

```text
src/app/icon.jpeg
```

No se usa un logo generado.

## Uploads Locales

Si no hay `BLOB_READ_WRITE_TOKEN`, las imagenes publicas de productos se guardan localmente en:

```text
public/uploads
```

Los comprobantes SINPE y referencias de pedidos personalizados se guardan fuera de `public`:

```text
private_uploads
```

Esos archivos privados se sirven solo desde una ruta protegida para administradores. En Hostinger, confirma que ambas carpetas tengan permisos de escritura si se usara almacenamiento local. Los uploads aceptan solo imagenes permitidas y tienen limite de 5 MB.
