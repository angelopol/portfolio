# Angelo Polgrossi Portfolio

Portfolio profesional desarrollado con Next.js, TypeScript y Tailwind CSS, diseñado para mostrar experiencia, proyectos, stack técnico y CV en una experiencia moderna, editable y lista para producción.

Sitio: <a href="https://angelopol.com" target="_blank">angelopol.com</a>

---

## Visión general

Este proyecto ya no es un portafolio estático tradicional. Ahora funciona como una plataforma personal con:

- frontend moderno y responsive
- panel privado de administración
- edición visual de contenido
- soporte para proyectos dinámicos
- almacenamiento remoto opcional con Supabase + AWS S3
- fallback local para desarrollo

La idea principal es poder actualizar el contenido del portafolio sin tener que tocar componentes manualmente cada vez que cambia un texto, una imagen, el CV o un proyecto.

---

## Qué ofrece la página

### 1. Landing profesional moderna

La página principal presenta:

- hero principal con identidad profesional
- secciones de `Home`, `About`, `Projects` y `Resume`
- diseño visual con paleta personalizable
- efectos visuales como destellos flotantes en el fondo
- navegación flotante tipo notch inspirada en interfaces premium

### 2. Showcase de proyectos interactivo

Los proyectos no se muestran solo como tarjetas.

Cada proyecto puede abrir un modal fullscreen con una experiencia similar a un visor de escritorio tipo social media:

- panel izquierdo con descripción del proyecto
- tecnologías utilizadas
- enlaces a demo y código
- panel derecho con slider de imágenes
- navegación por flechas
- miniaturas
- control por teclado con `Esc`, `←` y `→`

Además, cada proyecto puede soportar una imagen principal y una galería opcional de capturas.

### 3. Vista robusta del CV

La sección de resume incluye:

- botones para abrir y descargar el CV
- preview embebido del PDF
- renderizado del documento con `react-pdf`
- carga solo en cliente para evitar errores SSR en producción

### 4. Panel privado de administración

La ruta privada `/control-room` permite editar el portafolio sin tocar el código.

Incluye:

- login privado protegido con `PORTFOLIO_ADMIN_SECRET`
- edición visual de `home`, `about` y `projects`
- edición rápida de la paleta visual
- editor JSON completo para control total
- drag & drop para reordenar proyectos
- drag & drop para reordenar highlights, skills y focus areas
- preview en vivo de varias secciones
- autosave configurable
- historial simple de cambios con undo
- toasts y modales de confirmación

### 5. Gestión de archivos

El panel permite:

- subir imágenes
- subir el CV en PDF
- reutilizar imágenes existentes
- borrar archivos
- reemplazar imágenes de proyectos
- asignar foto de perfil y CV principal

---

## Stack tecnológico

### Frontend

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- React Icons
- React PDF

### Backend / almacenamiento

- API Routes de Next.js
- Supabase para contenido estructurado y metadatos
- AWS S3 para almacenamiento público de archivos

### Desarrollo

- ESLint
- PostCSS
- Vercel-ready deployment

---

## Arquitectura general

### Contenido del sitio

El contenido del portafolio se modela mediante `SiteContent` en [types/site.ts](types/site.ts).

Eso incluye:

- identidad del sitio
- tema visual
- contenido del hero
- about
- proyectos
- redes sociales
- resume

El contenido puede cargarse desde:

- Supabase, si está configurado
- JSON local como fallback en desarrollo

Archivo local de referencia: [content/site-content.json](content/site-content.json)

### Librería de medios

Los archivos del sitio se representan como `MediaItem`.

Pueden almacenarse de dos maneras:

- en Supabase + S3, para producción
- en JSON + filesystem local, como fallback de desarrollo

Archivo local de referencia: [content/media-library.json](content/media-library.json)

### Persistencia remota

Si las variables de entorno están configuradas:

- el contenido editable se guarda en Supabase
- los metadatos de archivos se guardan en Supabase
- las imágenes y PDFs se suben a AWS S3 con acceso público

Si faltan esas variables, el sistema vuelve automáticamente al modo local.

---

## Características destacadas

- ✅ diseño visual moderno y responsive
- ✅ navegación flotante con ocultamiento por scroll
- ✅ panel privado de edición
- ✅ edición visual y edición raw JSON
- ✅ drag & drop para ordenar contenido
- ✅ modal fullscreen para proyectos
- ✅ slider de imágenes por proyecto
- ✅ soporte para galerías de proyecto
- ✅ preview del CV integrado
- ✅ autosave configurable
- ✅ historial simple con undo
- ✅ soporte para Supabase
- ✅ soporte para AWS S3 público
- ✅ fallback local para desarrollo

---

## Estructura importante del proyecto

### Aplicación

- [app/page.tsx](app/page.tsx) → página principal
- [app/control-room/page.tsx](app/control-room/page.tsx) → panel privado
- [app/globals.css](app/globals.css) → estilos globales y efectos visuales

### Componentes principales

- [components/portfolio/site-shell.tsx](components/portfolio/site-shell.tsx) → layout principal del portafolio
- [components/portfolio/floating-nav.tsx](components/portfolio/floating-nav.tsx) → navbar flotante tipo notch
- [components/portfolio/projects-showcase.tsx](components/portfolio/projects-showcase.tsx) → grid de proyectos + modal fullscreen
- [components/portfolio/resume-pdf-preview.tsx](components/portfolio/resume-pdf-preview.tsx) → preview del CV
- [components/admin/AdminClient.tsx](components/admin/AdminClient.tsx) → panel administrativo
- [components/admin/AdminLogin.tsx](components/admin/AdminLogin.tsx) → login del panel

### Lógica y servicios

- [lib/auth.ts](lib/auth.ts) → autenticación del panel
- [lib/site-content.ts](lib/site-content.ts) → carga/guardado de contenido
- [lib/media-library.ts](lib/media-library.ts) → carga/gestión de archivos
- [lib/supabase.ts](lib/supabase.ts) → cliente administrativo de Supabase
- [lib/s3.ts](lib/s3.ts) → subidas públicas a S3

### APIs

- [app/api/admin/login/route.ts](app/api/admin/login/route.ts)
- [app/api/admin/logout/route.ts](app/api/admin/logout/route.ts)
- [app/api/admin/content/route.ts](app/api/admin/content/route.ts)
- [app/api/admin/media/route.ts](app/api/admin/media/route.ts)

---

## Variables de entorno

Ejemplo base en [.env.example](.env.example).

### Obligatorias

- `PORTFOLIO_ADMIN_SECRET`

### Supabase

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_CONTENT_ROW_ID` opcional

### AWS S3

- `AWS_S3_REGION`
- `AWS_S3_BUCKET`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Opcionales:

- `AWS_S3_PUBLIC_BASE_URL`
- `AWS_S3_KEY_PREFIX`

---

## Configuración de Supabase y S3

### Supabase

Debes crear las tablas ejecutando el esquema SQL en:

- [supabase/schema.sql](supabase/schema.sql)

Esto crea:

- `public.site_content`
- `public.media_library`

### AWS S3

El sistema sube archivos usando acceso público.

Eso significa que:

- los objetos deben poder verse públicamente
- el bucket o la política deben permitir lectura pública
- la URL final del archivo debe ser accesible desde el navegador

Guía adicional:

- [docs/remote-storage-setup.md](docs/remote-storage-setup.md)

---

## Instalación local

```bash
npm install
```

Crear archivo `.env.local` o `.env` usando [.env.example](.env.example).

Luego ejecutar:

```bash
npm run dev
```

Abrir:

- `http://localhost:3000`

---

## Scripts disponibles

```bash
npm run dev
npm run build
npm run start
npm run lint
```

---

## Flujo de edición de contenido

1. entrar al panel privado en `/control-room`
2. iniciar sesión con `PORTFOLIO_ADMIN_SECRET`
3. editar texto, colores, proyectos o archivos
4. usar autosave o guardar manualmente
5. ver cambios reflejados en el sitio

---

## Comportamiento en producción

### Con Supabase y S3 configurados

- contenido servido desde Supabase
- medios servidos desde S3
- experiencia lista para Vercel

### Sin Supabase/S3 configurados

- contenido leído desde JSON local
- archivos gestionados localmente
- ideal para desarrollo o pruebas rápidas

---

## Deployment

Este proyecto está preparado para desplegarse en Vercel.

Recomendado para producción:

- frontend en Vercel
- contenido en Supabase
- archivos en AWS S3

Antes de desplegar:

1. configurar variables de entorno
2. ejecutar [supabase/schema.sql](supabase/schema.sql)
3. validar que el bucket S3 sea público
4. probar `npm run build`

---

## Bondades del proyecto

- facilita mantener el portafolio actualizado
- reduce dependencia de cambios manuales en código
- mejora la presentación visual de proyectos y CV
- soporta crecimiento a futuro
- separa contenido, UI y almacenamiento
- ofrece una base profesional para marca personal
- permite operación híbrida entre modo local y cloud

---

## Próximas mejoras posibles

- soporte visual para galerías múltiples por proyecto desde el panel
- `redo` en el historial de cambios
- analytics
- internacionalización completa desde CMS
- previews más avanzados por dispositivo

---

## Licencia / créditos

Este proyecto fue transformado y ampliado para funcionar como una plataforma dinámica moderna del portafolio personal de Angelo Polgrossi.