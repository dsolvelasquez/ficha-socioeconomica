/* Formulario público de la Ficha Socioeconómica - IESTP Nuñoa */
"use strict";

/* ------------------------------------------------------- construcción del form */
function htmlCampo(c) {
  const id = "f_" + c.k;
  const span = `grid-column: span ${c.c || 12}`;
  const etq = `${c.l || ""}${c.req ? ' <span class="req">*</span>' : ""}`;
  const extra = `${c.ayuda ? `<span class="ayuda">${c.ayuda}</span>` : ""}<span class="msg">${c.msg || "Campo obligatorio"}</span>`;
  const cls = `campo ${c.cls || ""}`;
  switch (c.t) {
    case "radio":
    case "checks": {
      const tipo = c.t === "radio" ? "radio" : "checkbox";
      const ops = c.op.map((o) => `<label class="opcion"><input type="${tipo}" name="${c.k}" value="${esc(o)}"><span>${esc(o)}</span></label>`).join("");
      return `<div class="${cls}" data-k="${c.k}" style="${span}"><span class="etq">${etq}</span><div class="opciones" role="${c.t === "radio" ? "radiogroup" : "group"}">${ops}</div>${extra}</div>`;
    }
    case "lista":
      return `<div class="${cls}" data-k="${c.k}" style="${span}"><label for="${id}">${etq}</label>
        <input type="text" id="${id}" name="${c.k}" list="${id}_l" placeholder="${esc(c.ph || "")}">
        <datalist id="${id}_l">${c.op.map((o) => `<option value="${esc(o)}">`).join("")}</datalist>${extra}</div>`;
    case "familia":
      return `<div class="campo" data-k="familia" style="grid-column: span 12">
        <p class="ayuda" style="margin:0 0 6px">Registre a los integrantes de su familia (máximo 10). El ingreso total se calcula automáticamente.</p>
        <div class="tabla-din-env" style="padding:0">
        <table class="tabla-din" id="tabla-familia"><thead><tr>
          <th style="width:24%">Nombres y apellidos</th><th>Parentesco</th><th style="width:70px">Sexo</th><th style="width:70px">Edad</th>
          <th>Estado civil</th><th>Grado de instrucción</th><th>Ocupación</th><th style="width:100px">Ingreso S/</th><th></th></tr></thead><tbody></tbody></table></div>
        <div class="pie-tabla"><button type="button" class="btn sec chico" id="agregar-familiar">+ Agregar integrante</button>
          <span class="total">Ingreso total: <span id="ingreso-total">S/ 0.00</span></span></div></div>`;
    case "salud":
      return `<div class="campo" data-k="salud_problemas" style="grid-column: span 12"><span class="etq">Problemas de salud que requieren tratamiento continuo</span>
        <table class="tabla-din" id="tabla-salud" style="min-width:0"><thead><tr><th>Problema de salud</th><th style="width:170px">¿En tratamiento?</th><th style="width:40px"></th></tr></thead><tbody></tbody></table>
        <div class="pie-tabla"><button type="button" class="btn sec chico" id="agregar-salud">+ Agregar problema de salud</button></div></div>`;
    default: {
      const tipo = c.t || "text";
      const attrs = [
        c.min !== undefined ? `min="${c.min}"` : "", c.max && tipo !== "number" ? `maxlength="${c.max}"` : "",
        c.paso ? `step="${c.paso}"` : "", c.solo ? "readonly tabindex=-1" : "", c.ph ? `placeholder="${esc(c.ph)}"` : "",
        tipo === "date" ? `max="${hoyISO()}"` : "", tipo === "tel" ? 'inputmode="numeric"' : "",
      ].join(" ");
      return `<div class="${cls}" data-k="${c.k}" style="${span}"><label for="${id}">${etq}</label><input type="${tipo}" id="${id}" name="${c.k}" ${attrs}>${extra}</div>`;
    }
  }
}

function construir() {
  $("#pasos").innerHTML = PASOS.map((p, i) => `<li data-paso="${i}" title="${esc(p.titulo)}"><span class="n">${i + 1}</span><span class="t">${esc(p.titulo)}</span></li>`).join("");
  $("#secciones").innerHTML = PASOS.map((p, i) => {
    if (p.final) {
      return `<div class="seccion" data-paso="${i}">
        <div class="tarjeta"><h2>Resumen de la ficha</h2><div class="resumen" id="resumen"></div></div>
        <div class="tarjeta"><h2>Declaración jurada</h2><div class="declaracion">
          <p>La información contenida en el presente documento constituye declaración jurada del informante, quien declara la veracidad de la misma.</p>
          <p>La información declarada será verificada y en caso de determinarse que la información proporcionada sea falsa o distorsionada, se someterá a las sanciones disciplinarias correspondientes, además de las acciones administrativas, civiles y penales a que hubiera lugar conforme a lo previsto por el artículo 411 del Código Penal.</p>
          <div class="grid" style="padding:4px 0 12px">
            <div class="campo" data-k="fecha_ficha" style="grid-column: span 4"><label for="f_fecha_ficha">Fecha de la ficha <span class="req">*</span></label><input type="date" id="f_fecha_ficha" name="fecha_ficha"></div>
            <div class="campo" data-k="lugar_firma" style="grid-column: span 4"><label for="f_lugar_firma">Lugar</label><input type="text" id="f_lugar_firma" name="lugar_firma" value="Nuñoa"></div>
          </div>
          <label class="check-declaro"><input type="checkbox" id="declaro"> Declaro bajo juramento que la información proporcionada es verdadera. Entiendo que deberé imprimir y firmar la ficha generada.</label>
        </div></div></div>`;
    }
    return `<div class="seccion" data-paso="${i}">${p.tarjetas.map((t) => `<div class="tarjeta"><h2>${t.titulo}</h2><div class="grid">${t.campos.map(htmlCampo).join("")}</div></div>`).join("")}</div>`;
  }).join("");

  CAMPOS.forEach((c) => {
    if (c.def) $(`[name="${c.k}"]`).value = c.def;
    if (c.mayus) $(`[name="${c.k}"]`).addEventListener("input", (e) => {
      const p = e.target.selectionStart; e.target.value = e.target.value.toUpperCase(); e.target.setSelectionRange(p, p);
    });
    if (c.t === "tel" || c.k === "dni") $(`[name="${c.k}"]`).addEventListener("input", (e) => {
      e.target.value = c.k === "dni" ? e.target.value.replace(/[^0-9A-Za-z]/g, "").toUpperCase() : e.target.value.replace(/\D/g, "");
    });
  });
  $("#agregar-familiar").addEventListener("click", () => filaFamilia());
  $("#agregar-salud").addEventListener("click", () => filaSalud());
  $("#f_fecha_ficha").value = hoyISO();
}

function opcionesSelect(lista, sel) {
  return `<option value=""></option>` + lista.map((o) => `<option ${o === sel ? "selected" : ""}>${esc(o)}</option>`).join("");
}

function filaFamilia(f = {}) {
  const tb = $("#tabla-familia tbody");
  if (tb.children.length >= 10) { aviso("Máximo 10 integrantes.", true); return; }
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input data-f="nombre" value="${esc(f.nombre)}" placeholder="Nombres y apellidos"></td>
    <td><select data-f="parentesco">${opcionesSelect(PARENTESCOS, f.parentesco)}</select></td>
    <td><select data-f="sexo">${opcionesSelect(["F", "M"], f.sexo)}</select></td>
    <td><input data-f="edad" type="number" min="0" max="120" value="${esc(f.edad)}"></td>
    <td><select data-f="estado_civil">${opcionesSelect(ESTADOS_CIVILES, f.estado_civil)}</select></td>
    <td><select data-f="grado_instruccion">${opcionesSelect(INSTRUCCION, f.grado_instruccion)}</select></td>
    <td><input data-f="ocupacion" value="${esc(f.ocupacion)}"></td>
    <td><input data-f="ingreso" type="number" min="0" step="0.01" value="${esc(f.ingreso)}"></td>
    <td><button type="button" class="quitar" title="Quitar integrante" aria-label="Quitar integrante">✕</button></td>`;
  tr.querySelector(".quitar").addEventListener("click", () => { tr.remove(); totalFamilia(); alCambiar(); });
  tb.appendChild(tr);
  totalFamilia();
}

function filaSalud(p = {}) {
  const tb = $("#tabla-salud tbody");
  if (tb.children.length >= 5) return;
  const tr = document.createElement("tr");
  tr.innerHTML = `<td><input data-f="problema" value="${esc(p.problema)}" placeholder="Ej.: Gastritis, asma…"></td>
    <td><select data-f="tratamiento">${opcionesSelect(SINO, p.tratamiento)}</select></td>
    <td><button type="button" class="quitar" title="Quitar" aria-label="Quitar">✕</button></td>`;
  tr.querySelector(".quitar").addEventListener("click", () => { tr.remove(); alCambiar(); });
  tb.appendChild(tr);
}

const filasDe = (sel) => $$(`${sel} tbody tr`).map((tr) =>
  Object.fromEntries($$("[data-f]", tr).map((i) => [i.dataset.f, i.value.trim()])));

function totalFamilia() {
  const t = filasDe("#tabla-familia").reduce((s, f) => s + (parseFloat(f.ingreso) || 0), 0);
  $("#ingreso-total").textContent = soles(t);
}

/* ------------------------------------------------------------- lectura/escritura */
function leerCrudo() {
  const d = {};
  CAMPOS.forEach((c) => {
    if (c.t === "radio") d[c.k] = $(`input[name="${c.k}"]:checked`)?.value || "";
    else if (c.t === "checks") d[c.k] = $$(`input[name="${c.k}"]:checked`).map((i) => i.value);
    else if (c.t === "familia") d.familia = filasDe("#tabla-familia");
    else if (c.t === "salud") d.salud_problemas = filasDe("#tabla-salud");
    else d[c.k] = $(`[name="${c.k}"]`).value.trim();
  });
  d.fecha_ficha = $("#f_fecha_ficha").value;
  d.lugar_firma = $("#f_lugar_firma").value.trim();
  return d;
}

function leerDatos() {
  const d = leerCrudo();
  CAMPOS.forEach((c) => { if (c.ver && !c.ver(d)) d[c.k] = Array.isArray(d[c.k]) ? [] : ""; });
  return d;
}

function escribirDatos(d) {
  limpiarForm(false);
  CAMPOS.forEach((c) => {
    const v = d[c.k];
    if (c.t === "radio") $$(`input[name="${c.k}"]`).forEach((i) => (i.checked = i.value === String(v ?? "")));
    else if (c.t === "checks") $$(`input[name="${c.k}"]`).forEach((i) => (i.checked = (v || []).includes(i.value)));
    else if (c.t === "familia") (d.familia || []).forEach((f) => filaFamilia(f));
    else if (c.t === "salud") (d.salud_problemas || []).forEach((p) => filaSalud(p));
    else if (v !== undefined && v !== null) $(`[name="${c.k}"]`).value = v;
  });
  if (d.fecha_ficha) $("#f_fecha_ficha").value = d.fecha_ficha;
  if (d.lugar_firma) $("#f_lugar_firma").value = d.lugar_firma;
  if (!$("#tabla-familia tbody").children.length) filaFamilia();
  if (!$("#tabla-salud tbody").children.length) filaSalud();
  totalFamilia();
  actualizarVisibles();
}

function limpiarForm(conFilas = true) {
  $("#formulario").reset();
  $("#tabla-familia tbody").innerHTML = "";
  $("#tabla-salud tbody").innerHTML = "";
  CAMPOS.forEach((c) => { if (c.def) $(`[name="${c.k}"]`).value = c.def; });
  $("#f_fecha_ficha").value = hoyISO();
  $("#f_lugar_firma").value = "Nuñoa";
  $$(".campo.invalido").forEach((e) => e.classList.remove("invalido"));
  $$("#pasos li").forEach((li) => li.classList.remove("hecho", "error"));
  if (conFilas) { filaFamilia(); filaFamilia(); filaSalud(); }
  totalFamilia();
  actualizarVisibles();
}

function actualizarVisibles() {
  const d = leerCrudo();
  CAMPOS.filter((c) => c.ver).forEach((c) => {
    const el = $(`.campo[data-k="${c.k}"]`);
    el.style.display = c.ver(d) ? "" : "none";
  });
}

function calcularEdad() {
  const v = $("#f_fecha_nacimiento").value;
  const ref = $("#f_fecha_ficha").value || hoyISO();
  if (!v) { $("#f_edad").value = ""; return; }
  const [a, m, d] = v.split("-").map(Number);
  const [ra, rm, rd] = ref.split("-").map(Number);
  let e = ra - a - ((rm < m || (rm === m && rd < d)) ? 1 : 0);
  $("#f_edad").value = e >= 0 && e < 120 ? e : "";
}

/* ------------------------------------------------------------------ validación */
function validarPaso(i) {
  const d = leerCrudo();
  let ok = true, primero = null;
  CAMPOS.filter((c) => c.paso === i).forEach((c) => {
    const el = $(`.campo[data-k="${c.k}"]`);
    if (!el) return;
    const visible = !c.ver || c.ver(d);
    const v = d[c.k];
    let mal = false;
    if (visible) {
      const vacio = Array.isArray(v) ? v.length === 0 : !v;
      if (c.req && vacio) mal = true;
      else if (!vacio && c.patron && !c.patron.test(v)) mal = true;
      if (c.k === "fecha_nacimiento" && v) {
        const e = Number($("#f_edad").value);
        if (!(e >= 10 && e <= 100)) { mal = true; el.querySelector(".msg").textContent = "Fecha de nacimiento no válida"; }
      }
    }
    el.classList.toggle("invalido", mal);
    if (mal) { ok = false; primero = primero || el; }
  });
  if (i === 2) {
    const sinNombre = filasDe("#tabla-familia").some((f) => !f.nombre && (f.parentesco || f.ingreso || f.ocupacion));
    if (sinNombre) { ok = false; aviso("Hay integrantes con datos pero sin nombre.", true); }
  }
  const li = $(`#pasos li[data-paso="${i}"]`);
  li.classList.toggle("error", !ok);
  li.classList.toggle("hecho", ok);
  if (primero) primero.scrollIntoView({ behavior: "smooth", block: "center" });
  return ok;
}

/* ---------------------------------------------------------------- navegación */
let pasoActual = 0;
let editandoDni = null;

function irA(i) {
  pasoActual = Math.max(0, Math.min(PASOS.length - 1, i));
  $$(".seccion").forEach((s) => s.classList.toggle("activa", Number(s.dataset.paso) === pasoActual));
  $$("#pasos li").forEach((li) => li.classList.toggle("actual", Number(li.dataset.paso) === pasoActual));
  $("#btn-anterior").style.visibility = pasoActual === 0 ? "hidden" : "visible";
  const final = PASOS[pasoActual].final;
  $("#btn-siguiente").hidden = final;
  $("#btn-guardar").hidden = !final;
  $("#progreso").textContent = `Paso ${pasoActual + 1} de ${PASOS.length} · ${PASOS[pasoActual].titulo}`;
  if (final) pintarResumen();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function pintarResumen() {
  const d = leerDatos();
  const items = [
    ["Estudiante", `${d.apellido_paterno} ${d.apellido_materno}, ${d.nombres}`],
    ["DNI/CE", d.dni], ["Edad", $("#f_edad").value], ["Sexo", d.sexo], ["Celular", d.celular],
    ["Programa", d.programa], ["Ciclo", d.ciclo], ["Estado civil", d.estado_civil],
    ["Domicilio", [d.dom_calle, d.dom_distrito, d.dom_provincia].filter(Boolean).join(", ")],
    ["Integrantes familiares", d.familia.filter((f) => f.nombre).length],
    ["Ingreso familiar total", $("#ingreso-total").textContent],
    ["Vive con", d.vive_con.join(", ")], ["Dependencia económica", d.dependencia],
    ["Tenencia de vivienda", d.tenencia], ["Seguro de salud", d.seguro],
    ["Servicios", d.servicios.join(", ")],
  ];
  $("#resumen").innerHTML = items.map(([k, v]) => `<div><b>${esc(k)}</b>${esc(v || "—")}</div>`).join("");
}

/* --------------------------------------------------------------------- guardar */
let ultimaFicha = null;

async function guardar(sobrescribir = false) {
  for (let i = 0; i < PASOS.length - 1; i++) {
    if (!validarPaso(i)) { irA(i); aviso(`Revise el paso ${i + 1}: ${PASOS[i].titulo}.`, true); return; }
  }
  if (!$("#f_fecha_ficha").value) { aviso("Indique la fecha de la ficha.", true); return; }
  if (!$("#declaro").checked) { aviso("Debe marcar la casilla de declaración jurada.", true); $("#declaro").focus(); return; }

  const datos = leerDatos();
  datos.sitio_web = $("#sitio_web").value; // campo trampa para robots (debe ir vacío)
  const btn = $("#btn-guardar");
  btn.disabled = true; btn.textContent = "Guardando… no cierre la página";
  const sobre = sobrescribir || (edicion && edicion.dni === datos.dni.toUpperCase());
  const r = await api("guardar", { datos, sobrescribir: sobre, clave: edicion?.clave || "" });
  btn.disabled = false; btn.textContent = "Guardar ficha y generar Word";

  if (r.ok) {
    almacen.borrar(BORRADOR);
    ultimaFicha = r.datos;
    let wordOk = true;
    try { await Word.descargar(r.datos); } catch (e) { wordOk = false; console.error(e); }
    modal(r.accion === "nuevo" ? "¡Ficha registrada correctamente!" : "Ficha actualizada correctamente",
      `<p><b>${esc(r.estudiante)}</b> · DNI ${esc(r.dni)}</p>
       <p>Su información quedó registrada en la base de datos del instituto.</p>
       <p>${wordOk ? "Se descargó su ficha en Word" : "Presione «Descargar Word» para obtener su ficha"}
       (<b>${esc(nombreArchivo(r.datos))}</b>). <b>Imprímala, fírmela</b> y entréguela al área de Bienestar y Empleabilidad.</p>`,
      [
        { texto: "Nueva ficha", cls: "sec", accion: () => { nuevaFicha(); } },
        { texto: "Descargar Word", cls: "exito", mantener: true, accion: () => Word.descargar(ultimaFicha) },
      ]);
    if (edicion) { almacen.borrar("ficha_edicion", true); }
  } else if (r.existe) {
    modal("La ficha ya existe", `<p>${esc(r.error)}</p><p>Si continúa, se reemplazarán los datos anteriores.</p>`, [
      { texto: "Cancelar", cls: "sec" },
      { texto: "Reemplazar ficha", cls: "peligro", accion: () => { setTimeout(() => guardar(true), 0); } },
    ]);
  } else {
    modal("No se pudo guardar", `<p>${esc(r.error || "Error desconocido.")}</p><p>Sus datos siguen en el formulario; puede intentarlo nuevamente.</p>`, [{ texto: "Entendido" }]);
  }
}

function nuevaFicha() {
  edicion = null;
  $("#modo-edicion").hidden = true;
  limpiarForm();
  $("#declaro").checked = false;
  irA(0);
}

/* ---------------------------------------------------------------- borrador */
function alCambiar() {
  actualizarVisibles();
  clearTimeout(alCambiar.t);
  alCambiar.t = setTimeout(() => { if (!edicion) almacen.guardar(BORRADOR, leerCrudo()); }, 600);
}

/* ---------------------------------------------------------------------- inicio */
let edicion = almacen.leer("ficha_edicion", true); // {dni, clave, datos} cuando el administrador edita
construir();
limpiarForm();
irA(0);

$("#pasos").addEventListener("click", (e) => { const li = e.target.closest("li"); if (li) irA(Number(li.dataset.paso)); });
$("#btn-siguiente").addEventListener("click", () => {
  if (validarPaso(pasoActual)) irA(pasoActual + 1);
  else aviso("Corrija los campos marcados en rojo.", true);
});
$("#btn-anterior").addEventListener("click", () => irA(pasoActual - 1));
$("#formulario").addEventListener("submit", (e) => { e.preventDefault(); guardar(); });
$("#formulario").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.tagName === "INPUT" && e.target.type !== "checkbox") e.preventDefault();
});
$("#formulario").addEventListener("input", (e) => {
  if (e.target.closest("#tabla-familia")) totalFamilia();
  if (["fecha_nacimiento", "fecha_ficha"].includes(e.target.name)) calcularEdad();
  e.target.closest(".campo")?.classList.remove("invalido");
  alCambiar();
});
$("#formulario").addEventListener("change", (e) => {
  if (["fecha_nacimiento", "fecha_ficha"].includes(e.target.name)) calcularEdad();
  e.target.closest(".campo")?.classList.remove("invalido");
  alCambiar();
});
$("#btn-limpiar").addEventListener("click", () => modal("Limpiar formulario", "<p>Se borrarán todos los datos ingresados en esta ficha.</p>", [
  { texto: "Cancelar", cls: "sec" },
  { texto: "Limpiar", cls: "peligro", accion: () => { almacen.borrar(BORRADOR); almacen.borrar("ficha_edicion", true); nuevaFicha(); } },
]));

if (edicion?.datos) {
  escribirDatos(edicion.datos);
  calcularEdad();
  $("#modo-edicion").hidden = false;
} else {
  edicion = null;
  const borrador = almacen.leer(BORRADOR);
  if (borrador && (borrador.dni || borrador.apellido_paterno || borrador.nombres)) {
    modal("Ficha sin terminar", `<p>Se encontró una ficha que no fue enviada${borrador.apellido_paterno ? ` (<b>${esc(borrador.apellido_paterno)} ${esc(borrador.nombres || "")}</b>)` : ""}. ¿Desea continuar con ella?</p>`, [
      { texto: "Descartar", cls: "sec", accion: () => almacen.borrar(BORRADOR) },
      { texto: "Continuar", accion: () => { escribirDatos(borrador); calcularEdad(); } },
    ]);
  }
}
