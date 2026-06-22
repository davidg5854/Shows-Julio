# Julio Alfonzo · Sitio de Stand-Up

Sitio web ligero para mostrar los shows de stand-up de Julio Alfonzo: próximas
fechas, videos, bio y contacto. Hecho con **HTML, CSS y JavaScript puro**, sin
frameworks ni base de datos. Carga rápido y es fácil de mantener.

## Estructura del proyecto

```
.
├── index.html          → Página principal (estructura del sitio)
├── css/estilos.css     → Estilos (tema "cartel de comedia" oscuro)
├── js/app.js           → Pinta las fechas leyendo datos/shows.json
├── datos/shows.json    → ⭐ AQUÍ se editan las fechas de los shows
└── img/                → Fotos (ver img/LEEME.txt)
```

## Cómo agregar o quitar una fecha de show

Todo se controla desde **`datos/shows.json`**. No hace falta tocar el código.
Cada show es un bloque como este:

```json
{
  "fecha": "2026-07-18",
  "ciudad": "Caracas",
  "lugar": "Trasnocho Cultural",
  "tipo": "pago",
  "estado": "disponible",
  "entradas": "https://www.passline.com/mi-evento",
  "boton": "Comprar entradas",
  "nota": "20:00 h"
}
```

### Qué significa cada campo

| Campo      | Obligatorio | Valores / explicación |
|------------|-------------|------------------------|
| `fecha`    | Sí          | Formato `AAAA-MM-DD`. Las fechas pasadas se ocultan solas. |
| `ciudad`   | Sí          | Ciudad del show. |
| `lugar`    | Sí          | Teatro o local. |
| `tipo`     | Sí          | `"pago"` o `"gratis"`. Cambia la etiqueta y el botón. |
| `estado`   | Sí          | `"disponible"`, `"agotado"` o `"proximamente"`. |
| `entradas` | Sí          | **El enlace del botón.** Puede ser cualquier URL (ver abajo). |
| `boton`    | No          | Texto personalizado del botón. Si se omite, usa uno por defecto. |
| `nota`     | No          | Texto pequeño extra (hora, "cupo limitado", etc.). |

### El campo `entradas` acepta cualquier enlace

Esa es la clave de las reservas: el botón es **agnóstico**, sirve para todo.

- **Show pago** → enlace a la plataforma de venta (Passline, Eventbrite, etc.).
- **Show gratis con cupo** → enlace a un formulario de reserva (Tally, Google Forms).
- **WhatsApp** → enlace directo, por ejemplo:
  `https://wa.me/000000000000?text=Quiero%20entradas%20para%20el%20show`

Así se combinan **plataformas + formulario + WhatsApp** según lo necesite cada
ciudad, sin cambiar nada del código.

## Cómo gestionar las reservas (resumen)

1. **Pagos:** crea el evento en Passline o Eventbrite y pega su enlace en `entradas`.
   La plataforma cobra, controla el cupo y entrega la entrada con QR.
2. **Gratis:** crea un formulario en [Tally](https://tally.so) o Google Forms con
   límite de cupo y pega su enlace en `entradas` (pon `"tipo": "gratis"`).
3. **WhatsApp:** úsalo como respaldo en cualquier ciudad poniendo un enlace `wa.me`.

No se procesan pagos ni se guardan datos en este sitio: todo lo maneja la
plataforma externa. Por eso el sitio es estático, seguro y sin mantenimiento.

## Ver el sitio en tu computadora

Como el sitio carga `shows.json`, hay que abrirlo con un pequeño servidor local
(no con doble clic en el archivo). Desde la carpeta del proyecto:

```bash
# Con Python (ya viene en Mac/Linux)
python3 -m http.server 8000
```

Luego abre `http://localhost:8000` en el navegador.

## Publicar el sitio (gratis)

El sitio es estático, así que se puede publicar gratis en:

- **Cloudflare Pages** (recomendado): conecta el repo de GitHub y publica solo.
- **GitHub Pages**: activa Pages en la configuración del repositorio.
- **Netlify**: arrastra la carpeta o conecta el repo.

Cada vez que edites `shows.json` y subas el cambio, el sitio se actualiza solo.

## Personalizar

- **Nombre, bio, redes y contacto:** edita los textos en `index.html`.
- **Videos:** reemplaza `VIDEO_ID` en `index.html` por el ID del video de YouTube.
- **Fotos:** ver instrucciones en `img/LEEME.txt`.
- **Colores:** cambia las variables al inicio de `css/estilos.css`.
