/* Panel de administración - Fichas Socioeconómicas IESTP Nuñoa */
"use strict";

const SESION = "clave_admin";
let clave = almacen.leer(SESION, true) || "";
let registros = [];

/* ------------------------------------------------------------------ sesión */
async function ingresar(c) {
  const btn = $("#btn-login");
  btn.disabled = true; btn.textContent = "Verificando…";
  const r = await api("login", { clave: c });
  btn.disabled = false; btn.textContent = "Ingresar";
  if (!r.ok) {
    almacen.borrar(SESION, true);
    clave = "";
    mostrarVista("login");
    aviso(r.error, true);
    return;
  }
  clave = c;
  almacen.guardar(SESION, c, true);
  $("#lnk-hoja").href = `https://docs.google.com/spreadsheets/d/${r.idHoja}/edit`;
  $("#lnk-excel").href = `https://docs.google.com/spreadsheets/d/${r.idHoja}/export?format=xlsx`;
  $$(".pestana[data-vista]").forEach((b) => (b.hidden = false));
  mostrarVista("registros");
}

function salir() {
  almacen.borrar(SESION, true);
  clave = "";
  registros = [];
  $$(".pestana[data-vista]").forEach((b) => (b.hidden = true));
  $("#clave").value = "";
  mostrarVista("login");
}

function mostrarVista(v) {
  $$(".pestana[data-vista]").forEach((b) => b.classList.toggle("activa", b.dataset.vista === v));
  $$(".vista").forEach((s) => s.classList.toggle("activa", s.id === "vista-" + v));
  if (v === "registros") cargarRegistros();
  if (v === "estadisticas") (registros.length ? Promise.resolve() : cargarRegistros(true)).then(pintarEstadisticas);
}

/* --------------------------------------------------------------- registros */
async function cargarRegistros(silencioso = false) {
  if (!silencioso) $("#sin-registros").textContent = "Cargando…", $("#sin-registros").hidden = false;
  const r = await api("registros", { clave });
  if (!r.ok) { aviso(r.error, true); if (/clave/i.test(r.error)) salir(); return; }
  // "dd/MM/yyyy HH:mm" → "yyyyMMddHHmm" para ordenar del más reciente al más antiguo
  const clave_ = (f) => String(f || "").replace(/^(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2})?:?(\d{2})?.*$/, "$3$2$1$4$5");
  registros = r.registros.sort((a, b) => clave_(b.fecha_registro).localeCompare(clave_(a.fecha_registro)));
  pintarRegistros();
}

function pintarRegistros() {
  const q = $("#buscar").value.trim().toLowerCase();
  const lista = registros.filter((x) => !q || [x.dni, x.apellido_paterno, x.apellido_materno, x.nombres, x.programa].join(" ").toLowerCase().includes(q));
  $("#sin-registros").hidden = lista.length > 0;
  $("#sin-registros").textContent = registros.length ? "No hay coincidencias." : "Aún no hay fichas registradas.";
  $("#tabla-registros tbody").innerHTML = lista.map((x, i) => `<tr>
    <td>${i + 1}</td><td>${esc(x.dni)}</td>
    <td>${esc(x.apellido_paterno)} ${esc(x.apellido_materno)}, ${esc(x.nombres)}</td>
    <td>${esc(x.sexo)}</td><td>${esc(x.edad)}</td><td>${esc(x.programa)}</td><td>${esc(x.ciclo)}</td>
    <td class="num">${soles(x.ingreso_total)}</td><td>${esc(x.fecha_registro)}</td>
    <td><div class="acc">
      <button class="btn chico" data-word="${esc(x.dni)}" title="Descargar la ficha en Word para imprimir">Word</button>
      <button class="btn sec chico" data-editar="${esc(x.dni)}">Editar</button>
      <button class="btn peligro chico" data-eliminar="${esc(x.dni)}" title="Eliminar ficha">✕</button>
    </div></td></tr>`).join("");
}

async function datosDe(dni) {
  const r = await api("registro", { clave, dni });
  if (!r.ok) { aviso(r.error, true); return null; }
  return r.datos;
}

async function descargarWord(dni, btn) {
  btn.disabled = true;
  const d = await datosDe(dni);
  if (d) { try { await Word.descargar(d); } catch (e) { console.error(e); aviso("No se pudo generar el Word.", true); } }
  btn.disabled = false;
}

async function editar(dni) {
  const d = await datosDe(dni);
  if (!d) return;
  almacen.guardar("ficha_edicion", { dni: String(d.dni).toUpperCase(), clave, datos: d }, true);
  location.href = "index.html";
}

function eliminar(dni) {
  const x = registros.find((y) => String(y.dni) === dni) || {};
  modal("Eliminar ficha", `<p>¿Eliminar la ficha de <b>${esc(x.apellido_paterno)} ${esc(x.apellido_materno)}, ${esc(x.nombres)}</b> (DNI ${esc(dni)})?</p>
    <p>Se borrará de la hoja de Google. Los respaldos diarios en Google Drive conservan las copias anteriores.</p>`, [
    { texto: "Cancelar", cls: "sec" },
    { texto: "Eliminar", cls: "peligro", accion: async () => {
      const r = await api("eliminar", { clave, dni });
      if (r.ok) { aviso("Ficha eliminada."); cargarRegistros(); } else aviso(r.error, true);
    } },
  ]);
}

/* ------------------------------------------------------------ estadísticas */
function rangoIngreso(v) {
  const n = Number(v) || 0;
  if (n < 500) return "Menos de S/ 500";
  if (n < 1025) return "S/ 500 – 1 024";
  if (n < 2000) return "S/ 1 025 – 1 999";
  return "S/ 2 000 a más";
}

function pintarEstadisticas() {
  const total = registros.length;
  const prom = (k) => {
    const v = registros.map((r) => r[k]).filter((x) => x !== "" && x !== null && !isNaN(Number(x))).map(Number);
    return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };
  const trabajan = registros.filter((r) => r.trabaja === "Sí").length;
  $("#kpis").innerHTML = [
    [total, "Fichas registradas"],
    [total ? prom("edad").toFixed(1) : "—", "Edad promedio (años)"],
    [soles(prom("ingreso_total")), "Ingreso familiar promedio"],
    [total ? prom("num_familiares").toFixed(1) : "—", "Integrantes de familia (prom.)"],
    [total ? Math.round((trabajan / total) * 100) + "%" : "—", "Trabaja o ha trabajado"],
  ].map(([v, e]) => `<div class="kpi"><div class="v">${esc(v)}</div><div class="e">${esc(e)}</div></div>`).join("");

  if (!total) { $("#graficos").innerHTML = `<p class="vacio" style="grid-column:1/-1">Aún no hay fichas para generar estadísticas.</p>`; return; }

  $("#graficos").innerHTML = INDICADORES.map(([k, titulo, opciones]) => {
    const multiple = MULTIPLES.includes(k);
    const cont = new Map();
    registros.forEach((r) => {
      const v = k === "rango_ingreso" ? rangoIngreso(r.ingreso_total) : String(r[k] ?? "").trim();
      if (!v) return;
      (multiple ? v.split(", ") : [v]).map((p) => p.trim()).filter(Boolean).forEach((p) => cont.set(p, (cont.get(p) || 0) + 1));
    });
    const orden = [...(opciones || []), ...[...cont.keys()].filter((c) => !(opciones || []).includes(c)).sort()];
    const max = Math.max(1, ...orden.map((o) => cont.get(o) || 0));
    const filas = orden.map((o) => {
      const n = cont.get(o) || 0, pct = (n / total) * 100;
      return `<div class="barra-fila" data-tip="${esc(o)}: ${n} de ${total} (${pct.toFixed(1)}%)">
        <span class="et" title="${esc(o)}">${esc(o)}</span>
        <span class="pista"><span class="relleno ${n ? "" : "cero"}" style="width:${(n / max) * 100}%"></span></span>
        <span class="val">${n} <small>${pct.toFixed(0)}%</small></span></div>`;
    }).join("");
    return `<div class="grafico"><h3>${esc(titulo)}</h3><div class="cap">${multiple ? "Respuesta múltiple · % sobre el total de fichas" : "N° de estudiantes y % del total"}</div>${filas}</div>`;
  }).join("");
}

const tip = $("#tooltip");
document.addEventListener("mousemove", (e) => {
  const f = e.target.closest?.(".barra-fila");
  if (!f) { tip.hidden = true; return; }
  tip.textContent = f.dataset.tip;
  tip.hidden = false;
  tip.style.left = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8) + "px";
  tip.style.top = e.clientY + 14 + "px";
});

/* ------------------------------------------------------------------ inicio */
$("#form-login").addEventListener("submit", (e) => { e.preventDefault(); const c = $("#clave").value; if (c) ingresar(c); });
$$(".pestana[data-vista]").forEach((b) => b.addEventListener("click", () => mostrarVista(b.dataset.vista)));
$("#btn-salir").addEventListener("click", salir);
$("#btn-recargar").addEventListener("click", () => cargarRegistros());
$("#buscar").addEventListener("input", pintarRegistros);
$("#tabla-registros").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.word) descargarWord(b.dataset.word, b);
  if (b.dataset.editar) editar(b.dataset.editar);
  if (b.dataset.eliminar) eliminar(b.dataset.eliminar);
});
if (clave) ingresar(clave);
