/**
 * Worker "Promotor": hace el merge de staging -> main cuando el botón del panel
 * lo llama. El merge dispara el deploy a producción (GitHub Pages).
 *
 * Variables de entorno necesarias (en Cloudflare → el worker → Settings → Variables):
 *   - GITHUB_TOKEN   : token fino de GitHub con permiso Contents: Read and write sobre el repo.
 *   - PROMOTE_SECRET : una clave que vos elegís (la vas a escribir la 1ª vez desde el panel).
 */
const REPO = "davidg5854/Shows-Julio";
const ORIGIN = "https://julioalfonzo.com";

const cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ ok: false, error: "Método no permitido" }, 405);

    let body = {};
    try { body = await request.json(); } catch (e) {}
    if (!env.PROMOTE_SECRET || body.clave !== env.PROMOTE_SECRET) {
      return json({ ok: false, error: "Clave incorrecta." }, 401);
    }

    const r = await fetch("https://api.github.com/repos/" + REPO + "/merges", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.GITHUB_TOKEN,
        "Accept": "application/vnd.github+json",
        "User-Agent": "julio-promotor",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ base: "main", head: "staging", commit_message: "Promover a producción" }),
    });

    if (r.status === 201) return json({ ok: true, estado: "promovido" });
    if (r.status === 204) return json({ ok: true, estado: "sin-cambios" });
    if (r.status === 409) return json({ ok: false, error: "Hay un conflicto que resolver a mano." }, 409);
    const detalle = (await r.text()).slice(0, 200);
    return json({ ok: false, error: "GitHub respondió " + r.status, detalle }, 502);
  },
};
