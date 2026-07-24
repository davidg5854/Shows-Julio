/* =================================================================
   Julio Alfonzo · Stand-Up
   Lógica del sitio: carga las fechas desde datos/shows.json y las
   pinta en pantalla. Sin librerías, JavaScript puro.
   ================================================================= */

// Año actual en el footer
document.getElementById("anio").textContent = new Date().getFullYear();

// Meses abreviados en español (para el bloque de fecha)
const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

/**
 * Convierte "2026-08-15" en un objeto Date local (sin desfase de zona horaria).
 */
function parsearFecha(iso) {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

/**
 * Escapa texto para evitar inyección de HTML al construir las tarjetas.
 */
function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto == null ? "" : String(texto);
  return div.innerHTML;
}

/**
 * Construye el HTML de una tarjeta de show.
 */
function pintarShow(show) {
  const fecha = parsearFecha(show.fecha);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = MESES[fecha.getMonth()];
  const anio = fecha.getFullYear();

  const agotado = show.estado === "agotado";
  const proximamente = show.estado === "proximamente";
  const gratis = show.tipo === "gratis";

  // Etiqueta (gratis / paga / agotado)
  let etiqueta;
  if (agotado) {
    etiqueta = `<span class="show__etiqueta show__etiqueta--agotado">Agotado</span>`;
  } else if (gratis) {
    etiqueta = `<span class="show__etiqueta show__etiqueta--gratis">Entrada gratis</span>`;
  } else {
    etiqueta = `<span class="show__etiqueta show__etiqueta--pago">Entrada paga</span>`;
  }

  // Botón de acción según el estado del show
  let accion;
  if (agotado) {
    accion = `<span class="btn btn--inactivo">Agotado</span>`;
  } else if (proximamente) {
    accion = `<span class="btn btn--inactivo">Próximamente</span>`;
  } else {
    // Texto del botón: personalizado, o por defecto según tipo
    const texto = show.boton || (gratis ? "Reservar gratis" : "Comprar entradas");
    const clase = gratis ? "btn--secundario" : "btn--primario";
    accion = `<a class="btn ${clase}" href="${escapar(show.entradas)}" target="_blank" rel="noopener">${escapar(texto)}</a>`;
  }

  const nota = show.nota ? `<div class="show__lugar">${escapar(show.nota)}</div>` : "";

  return `
    <li class="show">
      <div class="show__fecha">
        <div class="show__dia">${dia}</div>
        <div class="show__mes">${mes}</div>
        <div class="show__anio">${anio}</div>
      </div>
      <div class="show__info">
        <div class="show__ciudad">${escapar(show.ciudad)}</div>
        <div class="show__lugar">${escapar(show.lugar)}</div>
        ${nota}
        ${etiqueta}
      </div>
      <div class="show__accion">${accion}</div>
    </li>
  `;
}

/**
 * Carga el JSON, filtra fechas pasadas, ordena y pinta la lista.
 */
async function cargarShows() {
  const contenedor = document.getElementById("lista-shows");

  try {
    const respuesta = await fetch("datos/shows.json", { cache: "no-cache" });
    if (!respuesta.ok) throw new Error("No se pudo cargar shows.json");
    const shows = await respuesta.json();

    // Mostrar solo fechas de hoy en adelante
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const proximos = shows
      .filter((s) => parsearFecha(s.fecha) >= hoy)
      .sort((a, b) => parsearFecha(a.fecha) - parsearFecha(b.fecha));

    if (proximos.length === 0) {
      contenedor.innerHTML = `<li class="shows__vacio">Pronto anunciaremos nuevas fechas. ¡Sígueme en redes!</li>`;
      return;
    }

    contenedor.innerHTML = proximos.map(pintarShow).join("");
    inyectarEventosSEO(proximos);
  } catch (error) {
    console.error(error);
    contenedor.innerHTML = `<li class="shows__vacio">No pudimos cargar las fechas en este momento. Intenta recargar la página.</li>`;
  }
}

/**
 * Genera datos estructurados (Schema.org ComedyEvent) de cada show y los
 * inserta en el <head>. Ayuda a que Google muestre las fechas como eventos.
 */
function inyectarEventosSEO(shows) {
  const eventos = shows.map((s) => {
    const fecha = parsearFecha(s.fecha);
    const inicio = new Date(fecha);
    inicio.setHours(21, 0, 0, 0); // los shows suelen ser a las 21:00
    return {
      "@context": "https://schema.org",
      "@type": "ComedyEvent",
      "name": "Julio y Sus Amigos — Stand-Up de Julio Alfonzo",
      "startDate": inicio.toISOString(),
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": {
        "@type": "Place",
        "name": s.lugar,
        "address": { "@type": "PostalAddress", "addressLocality": s.ciudad },
      },
      "performer": { "@type": "Person", "name": "Julio Alfonzo" },
      "organizer": { "@type": "Person", "name": "Julio Alfonzo" },
      "url": s.entradas,
      "offers": {
        "@type": "Offer",
        "url": s.entradas,
        "availability":
          s.estado === "agotado"
            ? "https://schema.org/SoldOut"
            : "https://schema.org/InStock",
      },
    };
  });

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(eventos);
  document.head.appendChild(script);
}

cargarShows();
