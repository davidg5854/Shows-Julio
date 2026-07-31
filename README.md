# Julio Alfonzo · Sitio de Stand-Up

Sitio oficial del comediante Julio Alfonzo: próximas fechas, bio, newsletter y
contacto. Es un sitio **estático** (HTML, CSS y JavaScript puro, sin frameworks
ni base de datos), publicado gratis en **GitHub Pages** con dominio propio
**[julioalfonzo.com](https://julioalfonzo.com)**. Carga rápido, es seguro y casi
no necesita mantenimiento.

El contenido se edita desde un **panel de administración** (no hace falta tocar
código).

---

## ✏️ Editar el sitio (panel de administración)

1. Entrá a **https://julioalfonzo.com/admin/**
2. Iniciá sesión con **GitHub**.
3. Vas a ver tres secciones:
   - **Fechas / Shows** → agregar, editar o quitar shows.
   - **Configuración del sitio** → IDs de analítica, redes sociales y correo.
   - **Textos y fotos** → textos de la portada, la bio y el newsletter, y las fotos.
4. Hacé tus cambios y tocá **Publicar**.

Los cambios **no salen en vivo todavía**: van al sitio de prueba. Para publicarlos
en la web real, mirá el paso siguiente.

Cada cambio queda guardado y versionado en GitHub: si algo sale mal, se puede
revertir.

---

## 🚀 Probar y publicar (staging → producción)

En la barra del panel (abajo a la derecha; en el celular es el botón redondo 🚀)
hay tres accesos:

| Botón | Qué hace |
|-------|----------|
| 🧪 **Sitio de prueba** | Abre `julio-staging.pages.dev`, donde se ven los cambios **antes** de publicarlos. |
| 🌐 **Sitio real** | Abre `julioalfonzo.com`, lo que ve el público. |
| 🚀 **Promover** | Publica en la web real lo que ya probaste. |

**El flujo:**

1. Editás en el panel y guardás → el cambio va al **sitio de prueba**.
2. Lo revisás en 🧪 **Sitio de prueba** (tarda ~1 min en aparecer).
3. Si te gusta → 🚀 **Promover** → pide una clave (solo la primera vez, después
   queda guardada en ese navegador) → confirmás.
4. En 1-2 minutos queda publicado en **julioalfonzo.com**. ✅

Si tocás *Promover* y no hay nada nuevo, avisa que la web real ya está al día.

> **Ramas:** `staging` es el sitio de prueba y `main` es producción. *Promover*
> hace el merge de `staging` a `main`, y ese merge dispara la publicación.

---

## Estructura del proyecto

```
.
├── index.html            → Página principal
├── privacidad.html       → Política de privacidad y cookies
├── css/estilos.css       → Estilos (tema negro/rojo)
├── js/app.js             → Pinta las fechas y aplica la configuración
├── datos/
│   ├── shows.json        → ⭐ Las fechas de los shows
│   ├── config.json       → ⭐ Analítica, redes y contacto
│   └── contenido.json    → ⭐ Textos y fotos del sitio
├── admin/                → Panel de edición (Sveltia CMS)
│   ├── index.html        → Panel + barra con los botones de prueba/real/promover
│   ├── config.yml        → Configuración del panel
│   └── promover.html     → Promoción manual (respaldo, por si falla el botón)
├── promotor/worker.js    → Servicio que publica de staging a producción
├── fonts/bebas.woff2     → Tipografía de títulos (autoalojada)
├── img/                  → Fotos (ver img/LEEME.txt)
├── CNAME                 → Dominio (julioalfonzo.com)
├── robots.txt / sitemap.xml / llms.txt → SEO y buscadores/IA
└── .github/workflows/desplegar.yml     → Publicación automática
```

---

## Las fechas: `datos/shows.json`

El panel edita este archivo, pero también se puede editar a mano. Es un objeto
con una lista `shows`:

```json
{
  "shows": [
    {
      "fecha": "2026-08-06",
      "ciudad": "Buenos Aires",
      "lugar": "Factoría Social Club · Fragata Sarmiento",
      "hora": "21:00",
      "tipo": "pago",
      "estado": "disponible",
      "etiqueta": "Reservas gratis",
      "entradas": "https://...",
      "boton": "Entradas"
    }
  ]
}
```

| Campo      | Obligatorio | Explicación |
|------------|-------------|-------------|
| `fecha`    | Sí          | `AAAA-MM-DD`. Se ordenan solas y las fechas pasadas se ocultan. |
| `ciudad`   | Sí          | Título grande de la tarjeta (ej. Buenos Aires). |
| `lugar`    | Sí          | Local o teatro. |
| `hora`     | No          | Ej. `21:00`. Se muestra junto al lugar. |
| `tipo`     | Sí          | `"pago"` o `"gratis"`. |
| `estado`   | Sí          | `"disponible"`, `"agotado"` o `"proximamente"`. |
| `etiqueta` | No          | Texto de la pastilla (ej. `Reservas gratis`). Vacío = "Entradas a la venta". |
| `entradas` | Sí          | **El enlace del botón.** Sirve cualquier URL (ver abajo). |
| `boton`    | No          | Texto del botón. Por defecto: "Entradas". |

### El campo `entradas` acepta cualquier enlace

El botón es agnóstico, sirve para todo:

- **Show pago** → enlace a la plataforma de venta (Passline, Eventbrite, Ticketplate…).
- **Show gratis con cupo** → enlace a un formulario de reserva (Tally, Google Forms).
- **WhatsApp** → enlace directo (`https://wa.link/...` o `https://wa.me/...`).

No se procesan pagos ni se guardan datos en el sitio: todo lo maneja la
plataforma externa. Por eso el sitio es estático y sin mantenimiento.

---

## Configuración: `datos/config.json`

Controla la analítica, las redes y el contacto (todo editable desde el panel).
Si dejás un valor vacío, esa herramienta se desactiva o esa red se esconde.

```json
{
  "analytics": {
    "ga4": "G-XXXXXXXXXX",
    "clarity": "xxxxxxxxxx",
    "metaPixel": "0000000000000000"
  },
  "redes": {
    "instagram": "https://...",
    "youtube": "https://...",
    "facebook": "https://...",
    "threads": "https://...",
    "substack": "https://..."
  },
  "contacto": { "email": "contacto@julioalfonzo.com" }
}
```

---

## Textos y fotos: `datos/contenido.json`

Los textos de la portada (eyebrow), la bio (cita, autor y párrafos) y el
newsletter, junto con las fotos de portada y de la bio, se editan desde el panel
o en este archivo. En los textos se puede usar `*cursiva*` y `**negrita**`, y
separar párrafos con una línea en blanco.

> Los textos también están en `index.html` como respaldo (bueno para SEO); el
> sitio los sobrescribe con lo de `contenido.json` al cargar.

---

## Analítica, publicidad y cookies

- **Google Analytics (GA4)** y **Microsoft Clarity**: se activan **solo si el
  visitante acepta** el aviso de cookies (Consent Mode / carga diferida).
- **Meta Pixel**: activo en cada visita, con fines publicitarios (retargeting).
- Los **IDs** de las tres se editan desde el panel (`config.json`).
- El aviso de cookies y la página **`privacidad.html`** explican qué se recolecta
  y cómo limitarlo.

---

## Correo `@julioalfonzo.com`

El correo se reenvía con **ImprovMX** (gratis). En el DNS del dominio (DonWeb)
están los registros **MX**, **SPF** y **DMARC**.

> ⚠️ No uses "Restaurar MX por defecto" en el panel de DNS: borraría el reenvío.

---

## Publicación (deploy)

| Entorno | Rama | Dónde se publica | Para qué |
|---------|------|------------------|----------|
| 🌐 **Producción** | `main` | julioalfonzo.com (GitHub Pages) | La web real |
| 🧪 **Prueba** | `staging` | julio-staging.pages.dev (Cloudflare Pages) | Revisar antes de publicar |

- El panel de administración escribe siempre en **`staging`**.
- **Promover** hace el merge de `staging` a `main`; ese push dispara el workflow
  `.github/workflows/desplegar.yml`, que publica en GitHub Pages.
- El dominio se conecta con el archivo `CNAME` + los registros DNS (A hacia las
  IP de GitHub Pages y CNAME de `www`).

---

## SEO

Incluye `title`, `description`, `canonical`, Open Graph/Twitter, datos
estructurados (Schema.org: Persona + eventos de comedia), `sitemap.xml`,
`robots.txt` y `llms.txt` (para motores de IA).

---

## Ver el sitio en tu computadora

Como carga `shows.json` y `config.json`, hay que usar un servidor local (no abrir
el archivo con doble clic). Desde la carpeta del proyecto:

```bash
python3 -m http.server 8000
```

Luego abrí `http://localhost:8000`.

---

## El panel por dentro (técnico)

- Está hecho con **Sveltia CMS** (`admin/index.html` + `admin/config.yml`).
- El login con GitHub usa un pequeño worker de **Cloudflare** (proyecto
  `sveltia-cms-auth`); su URL está en `base_url`, dentro de `admin/config.yml`.
- Para que el login funcione, el worker necesita las variables
  `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` y `ALLOWED_DOMAINS` (de una GitHub
  OAuth App).

---

## Personalizar el diseño

- **Colores:** variables al inicio de `css/estilos.css`.
- **Textos y fotos:** desde el panel (sección *Textos y fotos*) o en `datos/contenido.json`.
- **Imagen para compartir (og):** es `img/og.jpg` (ver `img/LEEME.txt`).
