/* Utilidades compartidas por el formulario y el panel de administración */
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
const soles = (n) => "S/ " + (Number(n) || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hoyISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

const almacen = {
  leer(k, ses = false) { try { return JSON.parse((ses ? sessionStorage : localStorage).getItem(k)); } catch { return null; } },
  guardar(k, v, ses = false) { try { (ses ? sessionStorage : localStorage).setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
  borrar(k, ses = false) { try { (ses ? sessionStorage : localStorage).removeItem(k); } catch { /* sin almacenamiento */ } },
};

function aviso(texto, error = false) {
  const a = $("#aviso");
  a.textContent = texto;
  a.className = "aviso" + (error ? " error" : "");
  a.hidden = false;
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => (a.hidden = true), error ? 6000 : 3500);
}

function modal(titulo, html, botones) {
  $("#modal-titulo").textContent = titulo;
  $("#modal-cuerpo").innerHTML = html;
  const acc = $("#modal-acciones");
  acc.innerHTML = "";
  botones.forEach((b) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "btn " + (b.cls || "");
    el.textContent = b.texto;
    el.addEventListener("click", async () => {
      if (b.accion) { const seguir = await b.accion(); if (seguir === false) return; }
      if (!b.mantener) cerrarModal();
    });
    acc.appendChild(el);
  });
  $("#modal").hidden = false;
  acc.lastChild?.focus();
}
const cerrarModal = () => ($("#modal").hidden = true);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarModal(); });

/** Llama al backend (Google Apps Script). Se envía como text/plain para evitar bloqueos CORS. */
async function api(accion, datos = {}) {
  const url = window.CONFIG?.URL_API || "";
  if (!/^https:\/\/script\.google\.com\/.+\/exec$/.test(url)) {
    return { ok: false, error: "El sistema aún no está configurado: falta la URL de Apps Script en js/config.js." };
  }
  try {
    const r = await fetch(url, { method: "POST", body: JSON.stringify({ accion, ...datos }) });
    return await r.json();
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor. Revise su conexión a internet e intente de nuevo." };
  }
}

function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function nombreArchivo(d) {
  const limpio = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "").toUpperCase();
  return `${d.dni}_${limpio(d.apellido_paterno)}_${limpio(d.apellido_materno)}_${limpio(d.nombres)}.docx`;
}
