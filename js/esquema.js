/* Esquema de la Ficha de Evaluación Socioeconómica (Anexo 03) */
"use strict";

const SINO = ["Sí", "No"];
const ESTADOS_CIVILES = ["Soltero(a)", "Casado(a)", "Conviviente", "Separado(a)", "Divorciado(a)", "Viudo(a)"];
const PROGRAMAS = [
  "Contabilidad",
  "Computación e Informática",
  "Arquitectura de Plataformas y Servicios de Tecnologías de la Información",
];
const PARENTESCOS = ["Padre", "Madre", "Hermano(a)", "Cónyuge", "Hijo(a)", "Abuelo(a)", "Tío(a)", "Primo(a)", "Otro"];
const INSTRUCCION = ["Sin instrucción", "Inicial", "Primaria incompleta", "Primaria completa", "Secundaria incompleta",
  "Secundaria completa", "Técnico incompleto", "Técnico completo", "Universitario incompleto", "Universitario completo"];
const BORRADOR = "ficha_nunoa_borrador";
const siEs = (k, v) => (d) => d[k] === v;
const esOtro = (k) => (d) => Array.isArray(d[k]) ? d[k].includes("Otro") : d[k] === "Otro";

/* ------------------------------------------------------------------ esquema */
const PASOS = [
  { titulo: "Datos personales", tarjetas: [
    { titulo: "I. Información general del estudiante", campos: [
      { k: "apellido_paterno", l: "Apellido paterno", c: 4, req: true, mayus: true },
      { k: "apellido_materno", l: "Apellido materno", c: 4, req: true, mayus: true },
      { k: "nombres", l: "Nombres", c: 4, req: true, mayus: true },
      { k: "dni", l: "DNI / CE", c: 3, req: true, ph: "8 dígitos", max: 12, patron: /^(\d{8}|[A-Za-z0-9]{9,12})$/, msg: "DNI de 8 dígitos o CE de 9 a 12 caracteres" },
      { k: "fecha_nacimiento", t: "date", l: "Fecha de nacimiento", c: 3, req: true },
      { k: "edad", t: "number", l: "Edad", c: 2, solo: true, ayuda: "Se calcula sola" },
      { k: "sexo", t: "radio", l: "Sexo", c: 4, req: true, op: ["Femenino", "Masculino"] },
      { k: "nac_region", l: "Lugar de nacimiento · Región", c: 4 },
      { k: "nac_provincia", l: "Provincia", c: 4 },
      { k: "nac_distrito", l: "Distrito", c: 4 },
      { k: "email", t: "email", l: "E-mail", c: 5, patron: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, msg: "Correo no válido" },
      { k: "celular", t: "tel", l: "Celular", c: 4, req: true, max: 9, patron: /^9\d{8}$/, msg: "Celular de 9 dígitos que empieza en 9" },
      { k: "telefono", t: "tel", l: "Teléfono fijo", c: 3 },
      { k: "estado_civil", t: "radio", l: "Estado civil", c: 10, req: true, op: ESTADOS_CIVILES },
      { k: "num_hijos", t: "number", l: "N° de hijos", c: 2, min: 0 },
    ]},
  ]},
  { titulo: "Domicilio y estudios", tarjetas: [
    { titulo: "Domicilio actual", campos: [
      { k: "dom_calle", l: "Calle / Jr. / Av.", c: 6 },
      { k: "dom_numero", l: "N°", c: 2 },
      { k: "dom_lote", l: "Lote", c: 2 },
      { k: "dom_mz", l: "Mz.", c: 2 },
      { k: "dom_comite", l: "Comité", c: 6 },
      { k: "dom_zona", l: "Zona / Comunidad / Barrio", c: 6 },
      { k: "dom_departamento", l: "Departamento", c: 4, def: "Puno" },
      { k: "dom_provincia", l: "Provincia", c: 4, def: "Melgar" },
      { k: "dom_distrito", l: "Distrito", c: 4, def: "Nuñoa" },
    ]},
    { titulo: "Institución educativa de la Educación Básica de procedencia", campos: [
      { k: "ie_nombre", l: "Nombre de la I.E. de procedencia", c: 12 },
      { k: "ie_tipo", t: "radio", l: "Tipo de I.E.", c: 8, op: ["Particular privado", "Parroquial", "Nacional"] },
      { k: "repitio", t: "radio", l: "¿Repitió algún año?", c: 4, op: SINO },
      { k: "beca", t: "radio", l: "¿Obtuvo beca?", c: 6, op: ["Beca completa", "Beca parcial", "No obtuvo beca"] },
      { k: "motivo_beca", t: "radio", l: "Motivo de la beca", c: 6, op: ["Situación económica", "Rendimiento académico", "Orfandad"],
        ver: (d) => d.beca === "Beca completa" || d.beca === "Beca parcial" },
    ]},
    { titulo: "Datos académicos en el instituto", campos: [
      { k: "programa", t: "lista", l: "Programa de estudios", c: 12, req: true, op: PROGRAMAS, ph: "Seleccione o escriba el programa" },
      { k: "ciclo", t: "radio", l: "Ciclo / periodo", c: 6, req: true, op: ["1", "2", "3", "4", "5", "6"] },
      { k: "creditos", t: "number", l: "N° de créditos matriculados", c: 3, min: 0 },
      { k: "ud_desaprobadas", t: "number", l: "Unidades didácticas desaprobadas", c: 3, min: 0 },
    ]},
  ]},
  { titulo: "Composición familiar", tarjetas: [
    { titulo: "II. Composición familiar <small>(integrantes de su familia)</small>", campos: [{ k: "familia", t: "familia" }] },
  ]},
  { titulo: "Situación familiar", tarjetas: [
    { titulo: "III. Situación familiar <small>(integrantes de la familia que viven en su hogar)</small>", campos: [
      { k: "vive_con", t: "checks", l: "Ud. vive con (puede marcar varios)", c: 12, op: ["Padre", "Madre", "Ambos", "Hermanos", "Solo(a)", "Cónyuge", "Otros familiares", "Con amigos"] },
      { k: "relaciones", t: "radio", l: "Las relaciones familiares son", c: 12, op: ["Buenas", "Regulares", "Deficientes", "Malas"] },
      { k: "apoderado_nombre", l: "Apoderado o familiar de contacto", c: 6 },
      { k: "apoderado_celular", t: "tel", l: "Celular del apoderado", c: 3, max: 9, patron: /^\d{9}$/, msg: "9 dígitos" },
      { k: "apoderado_ocupacion", l: "Ocupación", c: 3 },
    ]},
    { titulo: "IV. Vida social", campos: [
      { k: "amigos_facilidad", t: "radio", l: "¿Haces amigos con facilidad entre tus compañeros de clase?", c: 7, op: SINO },
      { k: "prefiere_solo", t: "radio", l: "¿Prefieres estar solo?", c: 5, op: SINO },
      { k: "deportes", l: "¿Qué deporte(s) practicas?", c: 6 },
      { k: "tiempo_libre", l: "¿Cómo ocupas tu tiempo libre?", c: 6 },
    ]},
  ]},
  { titulo: "Aspecto económico", tarjetas: [
    { titulo: "V. Aspecto económico", campos: [
      { k: "dependencia", t: "radio", l: "Dependencia económica", c: 12, op: ["Sólo padre", "Sólo madre", "Ambos padres", "Hermanos", "Parientes", "De sí mismo", "Otros"] },
      { k: "dependencia_otro", l: "Otros (especifique)", c: 12, ver: siEs("dependencia", "Otros") },
      { k: "trabaja", t: "radio", l: "¿Trabaja o ha trabajado anteriormente?", c: 6, op: SINO },
      { k: "continuara_trabajando", t: "radio", l: "¿Continuará trabajando?", c: 6, op: SINO, ver: siEs("trabaja", "Sí") },
      { k: "empresa", l: "Nombre de la empresa", c: 6, ver: siEs("trabaja", "Sí") },
      { k: "cargo", l: "Cargo", c: 6, ver: siEs("trabaja", "Sí") },
      { k: "tipo_trabajo", t: "radio", l: "Tipo de trabajo", c: 6, op: ["Dependiente", "Independiente"], ver: siEs("trabaja", "Sí") },
      { k: "sueldo", t: "number", l: "Sueldo mensual (S/)", c: 6, min: 0, paso: "0.01", ver: siEs("trabaja", "Sí") },
    ]},
  ]},
  { titulo: "Vivienda y servicios", tarjetas: [
    { titulo: "VI. Vivienda y servicios <small>(donde reside actualmente)</small>", campos: [
      { k: "tenencia", t: "radio", l: "Tenencia de la vivienda", c: 12, op: ["Propia", "Alquilada", "Alquiler venta", "Alojado", "Guardianía", "Otro"] },
      { k: "tenencia_otro", l: "Otra tenencia (especifique)", c: 12, ver: esOtro("tenencia") },
      { k: "tipo_vivienda", t: "radio", l: "Tipo de vivienda", c: 8, op: ["Casa", "Departamento", "Habitación", "Otro"] },
      { k: "num_habitaciones", t: "number", l: "N° habitaciones (sin contar baños)", c: 4, min: 0 },
      { k: "tipo_vivienda_otro", l: "Otro tipo de vivienda (especifique)", c: 12, ver: esOtro("tipo_vivienda") },
      { k: "material", t: "radio", l: "Material de construcción", c: 12, op: ["Noble", "Drywall", "Adobe", "Madera", "Cartón/plástico", "Otro"] },
      { k: "material_otro", l: "Otro material (especifique)", c: 12, ver: esOtro("material") },
      { k: "condicion", t: "radio", l: "Condición", c: 6, op: ["Terminada", "En construcción", "Provisional"] },
      { k: "num_pisos", t: "number", l: "N° de pisos", c: 2, min: 0, cls: "m3" },
      { k: "num_dormitorios", t: "number", l: "N° dormitorios", c: 2, min: 0, cls: "m3" },
      { k: "num_banos", t: "number", l: "N° de baños", c: 2, min: 0, cls: "m3" },
      { k: "servicios", t: "checks", l: "Servicios con los que cuenta", c: 12, op: ["Luz", "Agua", "Desagüe", "Teléfono", "Internet", "TV cable"] },
    ]},
  ]},
  { titulo: "Alimentación y salud", tarjetas: [
    { titulo: "VII. Alimentación", campos: [
      { k: "se_alimenta", t: "checks", l: "Se alimenta en", c: 12, op: ["Su casa", "Restaurante", "Pensión", "Quiosco", "Otro"] },
      { k: "se_alimenta_otro", l: "Otro lugar (especifique)", c: 12, ver: esOtro("se_alimenta") },
      { k: "comidas", t: "checks", l: "Tipo de comidas al día", c: 12, op: ["Desayuno", "Media mañana", "Almuerzo", "Media tarde", "Cena"] },
      { k: "subsidio", t: "radio", l: "¿Tuvo subsidio por alimentos en el instituto anteriormente?", c: 7, op: SINO },
      { k: "subsidio_anios", l: "Indique en qué año(s)", c: 5, ver: siEs("subsidio", "Sí") },
    ]},
    { titulo: "VIII. Salud <small>(del estudiante)</small>", campos: [
      { k: "seguro", t: "radio", l: "Tipo de seguro de salud", c: 8, op: ["ESSALUD", "SIS", "EPS", "Otro", "Ninguno"] },
      { k: "seguro_otro", l: "Otro seguro (especifique)", c: 4, ver: esOtro("seguro") },
      { k: "salud_problemas", t: "salud", c: 12 },
      { k: "alergias", l: "Alergias", c: 12 },
      { k: "discapacidad", t: "radio", l: "¿Presenta alguna discapacidad?", c: 5, op: SINO },
      { k: "discapacidad_tipo", l: "Tipo de discapacidad", c: 7, ver: siEs("discapacidad", "Sí") },
      { k: "enfermedad", t: "radio", l: "¿Sufres de alguna enfermedad?", c: 5, op: SINO },
      { k: "enfermedad_cual", l: "¿Cuál?", c: 7, ver: siEs("enfermedad", "Sí") },
      { k: "medicamento", t: "radio", l: "¿Tomas algún medicamento para tratar tu enfermedad?", c: 5, op: SINO },
      { k: "medicamento_cual", l: "¿Cuál?", c: 7, ver: siEs("medicamento", "Sí") },
      { k: "operaciones", l: "Operaciones", c: 6 },
      { k: "salud_otros", l: "Otros", c: 6 },
      { k: "religion", l: "Religión", c: 6 },
      { k: "estudio_tecnico", t: "radio", l: "¿Tiene algún estudio técnico o profesional?", c: 6, op: SINO },
      { k: "estudio_cual", l: "Escriba el estudio", c: 12, ver: siEs("estudio_tecnico", "Sí") },
    ]},
  ]},
  { titulo: "Confirmar y guardar", final: true, tarjetas: [] },
];

const CAMPOS = PASOS.flatMap((p, i) => p.tarjetas.flatMap((t) => t.campos.map((c) => ({ ...c, paso: i }))));
const POR_CLAVE = Object.fromEntries(CAMPOS.map((c) => [c.k, c]));

/* Indicadores para el panel de estadísticas (clave, título, opciones; null = dinámico) */
const INDICADORES = [
  ["sexo", "Sexo", ["Femenino", "Masculino"]],
  ["programa", "Programa de estudios", null],
  ["rango_ingreso", "Ingreso familiar mensual", ["Menos de S/ 500", "S/ 500 – 1 024", "S/ 1 025 – 1 999", "S/ 2 000 a más"]],
  ["ciclo", "Ciclo/periodo", ["1", "2", "3", "4", "5", "6"]],
  ["estado_civil", "Estado civil", ESTADOS_CIVILES],
  ["ie_tipo", "Tipo de I.E. de procedencia", ["Particular privado", "Parroquial", "Nacional"]],
  ["beca", "Beca en educación básica", ["Beca completa", "Beca parcial", "No obtuvo beca"]],
  ["relaciones", "Relaciones familiares", ["Buenas", "Regulares", "Deficientes", "Malas"]],
  ["vive_con", "Vive con", ["Padre", "Madre", "Ambos", "Hermanos", "Solo(a)", "Cónyuge", "Otros familiares", "Con amigos"]],
  ["dependencia", "Dependencia económica", ["Sólo padre", "Sólo madre", "Ambos padres", "Hermanos", "Parientes", "De sí mismo", "Otros"]],
  ["trabaja", "Trabaja o ha trabajado", ["Sí", "No"]],
  ["tenencia", "Tenencia de vivienda", ["Propia", "Alquilada", "Alquiler venta", "Alojado", "Guardianía", "Otro"]],
  ["material", "Material de construcción", ["Noble", "Drywall", "Adobe", "Madera", "Cartón/plástico", "Otro"]],
  ["servicios", "Servicios en la vivienda", ["Luz", "Agua", "Desagüe", "Teléfono", "Internet", "TV cable"]],
  ["comidas", "Comidas al día", ["Desayuno", "Media mañana", "Almuerzo", "Media tarde", "Cena"]],
  ["seguro", "Seguro de salud", ["ESSALUD", "SIS", "EPS", "Otro", "Ninguno"]],
  ["discapacidad", "Presenta discapacidad", ["Sí", "No"]],
  ["enfermedad", "Sufre alguna enfermedad", ["Sí", "No"]],
];
const MULTIPLES = ["vive_con", "servicios", "comidas", "se_alimenta"];