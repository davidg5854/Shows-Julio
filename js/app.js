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
  else estado = show.etiqueta || (show.tipo === "gratis" ? "Entrada gratis" : "Entradas a la venta");

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
        <div class="ticket__ciudad">${escapar(show.ciudad)}${show.pais ? ` <span class="ticket__pais">${escapar(show.pais)}</span>` : ""}</div>
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
    const datos = await respuesta.json();
    const shows = Array.isArray(datos) ? datos : (datos && Array.isArray(datos.shows) ? datos.shows : []);

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
        "address": Object.assign(
          { "@type": "PostalAddress", "addressLocality": s.ciudad },
          s.pais ? { addressCountry: s.pais } : {}
        ),
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

/* ---------- Configuración editable del sitio (analytics, redes, contacto) ---------- */
// Valores por defecto: se usan si no se puede cargar datos/config.json.
const CONFIG_DEFECTO = {
  analytics: { ga4: "G-5J1C29QDH1", clarity: "xrmdltqqya", metaPixel: "2116210522579728" },
  redes: {
    instagram: "https://www.instagram.com/esjulioalfonzo",
    youtube: "https://www.youtube.com/@julitoalfonzo",
    facebook: "https://www.facebook.com/share/18hyE2Q61d/",
    threads: "https://www.threads.net/@esjulioalfonzo",
    substack: "https://esjulioalfonzo.substack.com",
  },
  contacto: { email: "contacto@julioalfonzo.com" },
};

let clarityId = null;

async function cargarConfig() {
  let cfg = CONFIG_DEFECTO;
  try {
    const r = await fetch("datos/config.json", { cache: "no-cache" });
    if (r.ok) {
      const c = await r.json();
      cfg = {
        analytics: Object.assign({}, CONFIG_DEFECTO.analytics, c.analytics || {}),
        redes: Object.assign({}, CONFIG_DEFECTO.redes, c.redes || {}),
        contacto: Object.assign({}, CONFIG_DEFECTO.contacto, c.contacto || {}),
      };
    }
  } catch (e) { /* se usan los valores por defecto */ }
  aplicarRedes(cfg);
  iniciarAnalytics(cfg.analytics);
  iniciarCookies();
}

// Aplica los enlaces de redes y el correo según la configuración
function aplicarRedes(cfg) {
  document.querySelectorAll("[data-red]").forEach(function (a) {
    const url = cfg.redes[a.dataset.red];
    if (url) { a.setAttribute("href", url); a.style.display = ""; }
    else { a.style.display = "none"; }
  });
  document.querySelectorAll('[data-contacto="email"]').forEach(function (a) {
    if (!cfg.contacto.email) return;
    a.setAttribute("href", "mailto:" + cfg.contacto.email);
    if (a.classList.contains("pie__mail")) a.textContent = cfg.contacto.email;
  });
}

/* ---------- Analytics (IDs configurables desde el panel) ---------- */
function iniciarAnalytics(a) {
  // Google Analytics (GA4) con Consent Mode: denegado por defecto.
  if (a && a.ga4) {
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
    ga.src = "https://www.googletagmanager.com/gtag/js?id=" + a.ga4;
    document.head.appendChild(ga);
    gtag("js", new Date());
    gtag("config", a.ga4);
  }
  // Meta Pixel (Facebook): activo en cada visita (medición y publicidad).
  if (a && a.metaPixel) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0";
      n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", a.metaPixel);
    window.fbq("track", "PageView");
  }
  // Clarity se guarda para cargarlo al aceptar (usa cookies de sesión).
  clarityId = (a && a.clarity) || null;
}

let clarityCargado = false;
function cargarClarity() {
  if (!clarityId || clarityCargado) return;
  clarityCargado = true;
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, "clarity", "script", clarityId);
}

// Al aceptar: otorga el consentimiento a Google Analytics y activa Clarity.
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
function iniciarCookies() {
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
}

/* ---------- Contenido editable (textos y fotos) ---------- */
// Formato mínimo: **negrita**, *cursiva* y saltos de línea.
function formatoInline(t) {
  let h = escapar(t);
  h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return h.replace(/\n/g, "<br>");
}
// Varios párrafos separados por una línea en blanco.
function formatoParrafos(t) {
  return String(t || "")
    .split(/\n{2,}/)
    .map(function (b) { return "<p>" + formatoInline(b.trim()) + "</p>"; })
    .join("");
}

async function cargarContenido() {
  let c;
  try {
    const r = await fetch("datos/contenido.json", { cache: "no-cache" });
    if (!r.ok) return;
    c = await r.json();
  } catch (e) { return; }
  if (!c) return;
  aplicarContenido(c);
}

function aplicarContenido(c) {
  // Portada (hero)
  if (c.hero && c.hero.eyebrow) {
    const eb = document.querySelector(".cartel__eyebrow");
    if (eb) eb.textContent = c.hero.eyebrow;
  }
  // Fotos
  if (c.imagenes) {
    if (c.imagenes.hero) {
      const bg = document.querySelector(".cartel__bg");
      if (bg) bg.style.backgroundImage = "url('" + c.imagenes.hero + "')";
    }
    if (c.imagenes.bio) {
      const img = document.querySelector(".sobre__foto img");
      if (img) img.setAttribute("src", c.imagenes.bio);
    }
  }
  // Bio
  if (c.bio) {
    const cita = document.querySelector(".sobre__cita");
    if (cita && c.bio.cita) {
      let texto = escapar(c.bio.cita);
      if (c.bio.resaltado) {
        const r = escapar(c.bio.resaltado);
        texto = texto.replace(r, "<b>" + r + "</b>");
      }
      const autor = c.bio.autor ? "<cite>— " + escapar(c.bio.autor) + "</cite>" : "";
      cita.innerHTML = "“" + texto + "”" + autor;
    }
    if (c.bio.texto) {
      const t = document.querySelector(".sobre__texto");
      if (t) t.innerHTML = formatoParrafos(c.bio.texto);
    }
  }
  // Newsletter
  if (c.newsletter) {
    if (c.newsletter.titulo) {
      const tit = document.querySelector(".news .titulo");
      if (tit) tit.innerHTML = formatoInline(c.newsletter.titulo);
    }
    if (c.newsletter.texto) {
      const p = document.querySelector(".news__in p");
      if (p) p.innerHTML = formatoInline(c.newsletter.texto);
    }
  }
}

cargarConfig();
cargarContenido();
cargarShows();
