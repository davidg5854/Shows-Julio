/* =================================================================
   Julio Alfonzo · Stand-Up
   Sitio estático sin librerías. Carga las fechas desde
   datos/shows.json y maneja navegación, menú móvil y cookies.
   Analytics (GA4 + Clarity) SOLO se cargan si el usuario acepta.
   ================================================================= */

/* ---------- Fechas ---------- */
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// Convierte "2026-08-15" en Date local (sin desfase de zona horaria)
function parsearFecha(iso) {
  const [anio, mes, dia] = iso.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
}

// Escapa texto para evitar inyección de HTML
function escapar(texto) {
  const div = document.createElement("div");
  div.textContent = texto == null ? "" : String(texto);
  return div.innerHTML;
}

// Construye el HTML de una tarjeta (ticket) de show
function pintarShow(show) {
  const fecha = parsearFecha(show.fecha);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = MESES[fecha.getMonth()];

  const agotado = show.estado === "agotado";
  const proximamente = show.estado === "proximamente";

  let estado;
  if (agotado) estado = "Agotado";
  else if (proximamente) estado = "Próximamente";
  else estado = show.tipo === "gratis" ? "Entrada gratis" : "Entradas a la venta";

  const lugar = escapar(show.lugar) + (show.hora ? " · " + escapar(show.hora) : "");

  let accion;
  if (agotado || proximamente) {
    accion = `<span class="btn btn--linea" aria-disabled="true">${estado}</span>`;
  } else {
    const texto = show.boton || (show.tipo === "gratis" ? "Reservar gratis" : "Entradas");
    accion = `<a class="btn btn--rojo" href="${escapar(show.entradas)}" target="_blank" rel="noopener" data-evento="entradas" data-ciudad="${escapar(show.ciudad)}">${escapar(texto)}</a>`;
  }

  return `
    <article class="ticket">
      <div class="ticket__fecha"><div class="ticket__dia">${dia}</div><div class="ticket__mes">${mes}</div></div>
      <div class="ticket__info">
        <div class="ticket__ciudad">${escapar(show.ciudad)}</div>
        <div class="ticket__lugar">${lugar}</div>
        <span class="ticket__estado">${escapar(estado)}</span>
      </div>
      <div class="ticket__acc">${accion}</div>
    </article>`;
}

async function cargarShows() {
  const contenedor = document.getElementById("fechas-lista");
  if (!contenedor) return;
  try {
    const respuesta = await fetch("datos/shows.json", { cache: "no-cache" });
    if (!respuesta.ok) throw new Error("No se pudo cargar shows.json");
    const shows = await respuesta.json();

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const proximos = shows
      .filter((s) => parsearFecha(s.fecha) >= hoy)
      .sort((a, b) => parsearFecha(a.fecha) - parsearFecha(b.fecha));

    if (proximos.length === 0) {
      contenedor.innerHTML = `<p class="ticket__vacio">Pronto anunciamos nuevas fechas. ¡Seguime en redes!</p>`;
      return;
    }

    contenedor.innerHTML = proximos.map(pintarShow).join("");
    inyectarEventosSEO(proximos);

    // Analítica: clic en "Entradas" (solo si GA está cargado por consentimiento)
    contenedor.addEventListener("click", (e) => {
      const enlace = e.target.closest('a[data-evento="entradas"]');
      if (enlace && typeof window.gtag === "function") {
        window.gtag("event", "clic_entradas", { ciudad: enlace.dataset.ciudad });
      }
    });
  } catch (error) {
    console.error(error);
    contenedor.innerHTML = `<p class="ticket__vacio">No pudimos cargar las fechas. Intentá recargar la página.</p>`;
  }
}

// Datos estructurados (Schema.org ComedyEvent) de cada show para buscadores
function inyectarEventosSEO(shows) {
  const eventos = shows.map((s) => {
    const fecha = parsearFecha(s.fecha);
    const inicio = new Date(fecha);
    const [h, m] = (s.hora || "21:00").split(":").map(Number);
    inicio.setHours(h || 21, m || 0, 0, 0);
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
        "availability": s.estado === "agotado"
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

/* ---------- Navegación con scroll suave (sin cambiar el hash) ---------- */
(function () {
  const nav = document.querySelector(".nav");
  document.addEventListener("click", function (e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (!id || id.length < 2) return;
    const destino = document.querySelector(id);
    if (!destino) return;
    e.preventDefault();
    const offset = nav ? nav.offsetHeight : 0;
    const y = destino.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
    cerrarMenu();
  });
})();

/* ---------- Menú móvil (hamburguesa) ---------- */
function cerrarMenu() {
  const menu = document.getElementById("menu");
  const toggle = document.querySelector(".nav__toggle");
  if (menu && menu.classList.contains("open")) {
    menu.classList.remove("open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }
}
(function () {
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("menu");
  if (!toggle || !menu) return;
  toggle.addEventListener("click", function () {
    const abierto = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", abierto ? "true" : "false");
  });
})();

/* ---------- Ajusta el offset de las anclas a la altura de la barra ---------- */
(function () {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  function ajustar() {
    document.documentElement.style.scrollPaddingTop = nav.offsetHeight + "px";
  }
  ajustar();
  window.addEventListener("resize", ajustar);
})();

/* ---------- Analytics con Consent Mode (GA4) + Clarity ---------- */
// GA4 se carga siempre, pero con el consentimiento DENEGADO por defecto:
// no usa cookies ni rastrea al usuario hasta que acepta el aviso.
(function () {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    wait_for_update: 500,
  });
  const ga = document.createElement("script");
  ga.async = true;
  ga.src = "https://www.googletagmanager.com/gtag/js?id=G-5J1C29QDH1";
  document.head.appendChild(ga);
  gtag("js", new Date());
  gtag("config", "G-5J1C29QDH1");
})();

// Microsoft Clarity: solo se carga tras aceptar (usa cookies de sesión).
let clarityCargado = false;
function cargarClarity() {
  if (clarityCargado) return;
  clarityCargado = true;
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", "xrmdltqqya");
}

// Al aceptar: actualiza el consentimiento de GA (granted) y activa Clarity.
function otorgarConsentimiento() {
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      analytics_storage: "granted",
    });
  }
  cargarClarity();
}

/* ---------- Aviso de cookies ---------- */
(function () {
  const banner = document.getElementById("cookies");
  let consentimiento = null;
  try { consentimiento = localStorage.getItem("cookies-consent"); } catch (e) {}

  if (consentimiento === "aceptar") otorgarConsentimiento();

  if (!banner) return;

  // Mostrar el aviso solo si aún no decidió
  if (!consentimiento) {
    setTimeout(function () { banner.classList.add("visible"); }, 700);
  }

  banner.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-cookie]");
    if (!btn) return;
    const decision = btn.dataset.cookie;
    try { localStorage.setItem("cookies-consent", decision); } catch (e) {}
    banner.classList.remove("visible");
    if (decision === "aceptar") otorgarConsentimiento();
  });
})();

cargarShows();
