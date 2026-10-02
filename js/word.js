/* Genera en el navegador la ficha socioeconómica en Word (declaración jurada imprimible). */
"use strict";

const Word = (() => {
  const {
    Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
    AlignmentType, VerticalAlign, ImageRun, Header, Footer, TableLayoutType,
  } = window.docx;

  const AZUL = "1F3B8F", GRIS = "EEF1F8", BORDE = "8A94AD";
  const FUENTE = "Arial", TAM = 17;            // medios puntos (8.5 pt)
  const COLS = 12, COL = 878, ANCHO = COL * COLS; // DXA (A4 con márgenes de 1.2 cm)
  const MARCADO = "☒", VACIO = "☐";
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const SINO = ["Sí", "No"];

  const linea = { style: BorderStyle.SINGLE, size: 4, color: BORDE };
  const BORDES = { top: linea, bottom: linea, left: linea, right: linea, insideHorizontal: linea, insideVertical: linea };
  const nada = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const SIN_BORDES = { top: nada, bottom: nada, left: nada, right: nada, insideHorizontal: nada, insideVertical: nada };
  const MARGEN = { top: 30, bottom: 30, left: 70, right: 70 };

  const t = (v) => (v === null || v === undefined ? "" : Array.isArray(v) ? v.join(", ") : String(v));
  const fecha = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v || "") ? v.split("-").reverse().join("/") : t(v));
  const moneda = (v) => (v === "" || v === null || v === undefined || isNaN(parseFloat(v)) ? "" :
    "S/ " + Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

  const run = (texto, o = {}) => new TextRun({
    text: texto, bold: !!o.negrita, italics: !!o.cursiva, size: o.tam || TAM,
    font: o.simbolo ? "Segoe UI Symbol" : FUENTE, color: o.color,
  });

  /** Opciones con casillas: op(["Sí","No"], valor | [valores], {opción: "etiqueta"}) */
  const op = (opciones, sel, etiquetas = {}) => ({ opciones, sel: new Set([].concat(sel || []).filter(Boolean).map(String)), etiquetas });

  function contenidoValor(v) {
    if (v && v.opciones) {
      const runs = [];
      v.opciones.forEach((o, i) => {
        runs.push(run(v.sel.has(String(o)) ? MARCADO : VACIO, { simbolo: true, tam: TAM + 3 }));
        runs.push(run(" " + (v.etiquetas[o] || o) + (i < v.opciones.length - 1 ? "   " : "")));
      });
      return runs;
    }
    return [run(t(v))];
  }

  /** filas: [[tipo 'L'|'V', contenido, span], ...] — cada fila suma 12 columnas */
  function rejilla(filas) {
    return new Table({
      width: { size: ANCHO, type: WidthType.DXA },
      columnWidths: Array(COLS).fill(COL),
      layout: TableLayoutType.FIXED,
      borders: BORDES,
      rows: filas.map((fila) => new TableRow({
        cantSplit: true,
        children: fila.map(([tipo, contenido, span]) => new TableCell({
          columnSpan: span,
          width: { size: COL * span, type: WidthType.DXA },
          margins: MARGEN,
          verticalAlign: VerticalAlign.CENTER,
          shading: tipo === "L" ? { fill: GRIS, type: ShadingType.CLEAR, color: "auto" } : undefined,
          children: [new Paragraph({ children: tipo === "L" ? [run(contenido, { negrita: true })] : contenidoValor(contenido) })],
        })),
      })),
    });
  }

  function tituloSeccion(texto) {
    return new Table({
      width: { size: ANCHO, type: WidthType.DXA },
      columnWidths: [ANCHO],
      borders: BORDES,
      rows: [new TableRow({ children: [new TableCell({
        width: { size: ANCHO, type: WidthType.DXA },
        margins: MARGEN,
        shading: { fill: AZUL, type: ShadingType.CLEAR, color: "auto" },
        children: [new Paragraph({ keepNext: true, children: [run(texto, { negrita: true, tam: 18, color: "FFFFFF" })] })],
      })] })],
    });
  }

  const espacio = (pts = 3) => new Paragraph({ spacing: { before: 0, after: 0, line: pts * 20, lineRule: "exact" }, children: [] });

  function tablaLista(encabezados, anchos, filas) {
    const total = anchos.reduce((a, b) => a + b, 0);
    const celda = (txt, ancho, enc) => new TableCell({
      width: { size: ancho, type: WidthType.DXA },
      margins: MARGEN,
      verticalAlign: VerticalAlign.CENTER,
      shading: enc ? { fill: GRIS, type: ShadingType.CLEAR, color: "auto" } : undefined,
      children: [new Paragraph({ alignment: enc ? AlignmentType.CENTER : undefined, children: [run(t(txt), { negrita: enc, tam: 16 })] })],
    });
    return new Table({
      width: { size: total, type: WidthType.DXA },
      columnWidths: anchos,
      layout: TableLayoutType.FIXED,
      borders: BORDES,
      rows: [
        new TableRow({ tableHeader: true, children: encabezados.map((e, i) => celda(e, anchos[i], true)) }),
        ...filas.map((f) => new TableRow({ cantSplit: true, children: f.map((v, i) => celda(v, anchos[i], false)) })),
      ],
    });
  }

  let logoCache = null;
  async function logo() {
    if (logoCache) return logoCache;
    const datos = await (await fetch("img/logo_word.png")).arrayBuffer();
    const img = await new Promise((ok, mal) => {
      const i = new Image(); i.onload = () => ok(i); i.onerror = mal;
      i.src = URL.createObjectURL(new Blob([datos], { type: "image/png" }));
    });
    const alto = 72;
    logoCache = { datos, ancho: Math.round((img.naturalWidth / img.naturalHeight) * alto), alto };
    return logoCache;
  }

  async function generar(d) {
    const inst = window.CONFIG?.INSTITUCION || "INSTITUTO DE EDUCACIÓN SUPERIOR TECNOLÓGICO PÚBLICO NUÑOA";
    const lg = await logo();
    const otro = (k, ko) => (t(d[k]) === "Otro" || (Array.isArray(d[k]) && d[k].includes("Otro"))) && d[ko] ? ` (${d[ko]})` : "";
    const cuerpo = [];
    const add = (...x) => cuerpo.push(...x);

    for (const [texto, tam] of [["ANEXO N° 03", 20], ["FICHA DE EVALUACIÓN SOCIOECONÓMICA", 26], ["DECLARACIÓN JURADA", 20]]) {
      add(new Paragraph({ alignment: AlignmentType.CENTER, children: [run(texto, { negrita: true, tam, color: tam === 26 ? AZUL : undefined })] }));
    }
    add(espacio(6));

    // I. INFORMACIÓN GENERAL
    add(tituloSeccion("I. INFORMACIÓN GENERAL DEL ESTUDIANTE"), rejilla([
      [["L", "Apellido paterno", 4], ["L", "Apellido materno", 4], ["L", "Nombres", 4]],
      [["V", d.apellido_paterno, 4], ["V", d.apellido_materno, 4], ["V", d.nombres, 4]],
      [["L", "Edad", 1], ["V", d.edad, 1], ["L", "Fecha nac.", 1], ["V", fecha(d.fecha_nacimiento), 2],
        ["L", "Sexo", 1], ["V", op(["Femenino", "Masculino"], d.sexo, { Femenino: "F", Masculino: "M" }), 2],
        ["L", "DNI/CE", 1], ["V", d.dni, 3]],
      [["L", "Lugar de nacimiento / Región", 4], ["L", "Provincia", 4], ["L", "Distrito", 4]],
      [["V", d.nac_region, 4], ["V", d.nac_provincia, 4], ["V", d.nac_distrito, 4]],
      [["L", "E-mail", 1], ["V", d.email, 5], ["L", "Celular", 1], ["V", d.celular, 2], ["L", "Telf.", 1], ["V", d.telefono, 2]],
      [["L", "Estado civil", 2], ["V", op(ESTADOS, d.estado_civil), 8], ["L", "N° hijos", 1], ["V", d.num_hijos, 1]],
      [["L", "Domicilio actual: Calle/Jr./Av.", 4], ["L", "N°", 1], ["L", "Lote", 1], ["L", "Mz.", 1], ["L", "Comité", 2], ["L", "Zona", 3]],
      [["V", d.dom_calle, 4], ["V", d.dom_numero, 1], ["V", d.dom_lote, 1], ["V", d.dom_mz, 1], ["V", d.dom_comite, 2], ["V", d.dom_zona, 3]],
      [["L", "Departamento", 2], ["V", d.dom_departamento, 2], ["L", "Provincia", 2], ["V", d.dom_provincia, 2], ["L", "Distrito", 2], ["V", d.dom_distrito, 2]],
      [["L", "I.E. de Educación Básica de procedencia", 4], ["V", d.ie_nombre, 8]],
      [["L", "Tipo de I.E.", 2], ["V", op(["Particular privado", "Parroquial", "Nacional"], d.ie_tipo), 6],
        ["L", "Repitió algún año", 2], ["V", op(SINO, d.repitio), 2]],
      [["L", "Obtuvo beca", 2], ["V", op(["Beca completa", "Beca parcial", "No obtuvo beca"], d.beca), 10]],
      [["L", "Motivo de la beca", 2], ["V", op(["Situación económica", "Rendimiento académico", "Orfandad"], d.motivo_beca), 10]],
      [["L", "Programa de estudios", 2], ["V", d.programa, 10]],
      [["L", "Ciclo/periodo", 2], ["V", op(["1", "2", "3", "4", "5", "6"], d.ciclo), 4],
        ["L", "N° créditos matric.", 2], ["V", d.creditos, 1], ["L", "U.D. desaprobadas", 2], ["V", d.ud_desaprobadas, 1]],
    ]), espacio());

    // II. COMPOSICIÓN FAMILIAR
    const fam = (d.familia || []).map((f) => [f.nombre, f.parentesco, f.sexo, f.edad, f.estado_civil, f.grado_instruccion, f.ocupacion, moneda(f.ingreso)]);
    while (fam.length < 3) fam.push(Array(8).fill(""));
    add(tituloSeccion("II. COMPOSICIÓN FAMILIAR (Integrantes de su familia)"),
      tablaLista(["Nombres y apellidos", "Parentesco", "Sexo", "Edad", "Estado civil", "Grado de instrucción", "Ocupación", "Ingreso S/"],
        [2606, 1076, 566, 566, 1076, 1474, 1926, 1246], fam),
      new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 40 }, children: [run("Ingreso total: ", { negrita: true }), run(moneda(d.ingreso_total || 0))] }),
      espacio());

    // III. SITUACIÓN FAMILIAR
    add(tituloSeccion("III. SITUACIÓN FAMILIAR (Integrantes de la familia que viven en su hogar)"), rejilla([
      [["L", "Ud. vive con", 2], ["V", op(["Padre", "Madre", "Ambos", "Hermanos", "Solo(a)", "Cónyuge", "Otros familiares", "Con amigos"], d.vive_con), 10]],
      [["L", "Las relaciones familiares son", 3], ["V", op(["Buenas", "Regulares", "Deficientes", "Malas"], d.relaciones), 9]],
      [["L", "Apoderado o familiar de contacto", 3], ["V", d.apoderado_nombre, 5], ["L", "Celular", 1], ["V", d.apoderado_celular, 3]],
      [["L", "Ocupación", 3], ["V", d.apoderado_ocupacion, 9]],
    ]), espacio());

    // IV. VIDA SOCIAL
    add(tituloSeccion("IV. VIDA SOCIAL"), rejilla([
      [["L", "¿Haces amigos con facilidad entre tus compañeros de clase?", 6], ["V", op(SINO, d.amigos_facilidad), 2],
        ["L", "¿Prefieres estar solo?", 2], ["V", op(SINO, d.prefiere_solo), 2]],
      [["L", "¿Qué deporte(s) practicas?", 3], ["V", d.deportes, 9]],
      [["L", "¿Cómo ocupas tu tiempo libre?", 3], ["V", d.tiempo_libre, 9]],
    ]), espacio());

    // V. ASPECTO ECONÓMICO
    add(tituloSeccion("V. ASPECTO ECONÓMICO"), rejilla([
      [["L", "Dependencia económica", 2], ["V", op(["Sólo padre", "Sólo madre", "Ambos padres", "Hermanos", "Parientes", "De sí mismo", "Otros"], d.dependencia), 10]],
      [["L", "Otros (especifique)", 2], ["V", d.dependencia === "Otros" ? d.dependencia_otro : "", 10]],
      [["L", "Trabaja / ha trabajado anteriormente", 4], ["V", op(SINO, d.trabaja), 2],
        ["L", "Continuará trabajando", 3], ["V", op(SINO, d.continuara_trabajando), 3]],
      [["L", "Nombre de la empresa", 2], ["V", d.empresa, 5], ["L", "Cargo", 1], ["V", d.cargo, 4]],
      [["L", "Tipo de trabajo", 2], ["V", op(["Dependiente", "Independiente"], d.tipo_trabajo), 5],
        ["L", "Sueldo mensual", 2], ["V", moneda(d.sueldo), 3]],
    ]), espacio());

    // VI. VIVIENDA
    add(tituloSeccion("VI. VIVIENDA Y SERVICIOS (donde reside actualmente)"), rejilla([
      [["L", "Tenencia de la vivienda", 2], ["V", op(["Propia", "Alquilada", "Alquiler venta", "Alojado", "Guardianía", "Otro"], d.tenencia,
        { Otro: "Otro" + otro("tenencia", "tenencia_otro") }), 10]],
      [["L", "Tipo de vivienda", 2], ["V", op(["Casa", "Departamento", "Habitación", "Otro"], d.tipo_vivienda,
        { Otro: "Otro" + otro("tipo_vivienda", "tipo_vivienda_otro") }), 7],
        ["L", "N° habitaciones (sin baños)", 2], ["V", d.num_habitaciones, 1]],
      [["L", "Material de construcción", 2], ["V", op(["Noble", "Drywall", "Adobe", "Madera", "Cartón/plástico", "Otro"], d.material,
        { Otro: "Otro" + otro("material", "material_otro") }), 10]],
      [["L", "Condición", 2], ["V", op(["Terminada", "En construcción", "Provisional"], d.condicion), 4],
        ["L", "N° pisos", 1], ["V", d.num_pisos, 1], ["L", "Dormit.", 1], ["V", d.num_dormitorios, 1], ["L", "Baños", 1], ["V", d.num_banos, 1]],
      [["L", "Servicios", 2], ["V", op(["Luz", "Agua", "Desagüe", "Teléfono", "Internet", "TV cable"], d.servicios), 10]],
    ]), espacio());

    // VII. ALIMENTACIÓN
    add(tituloSeccion("VII. ALIMENTACIÓN"), rejilla([
      [["L", "Se alimenta en", 2], ["V", op(["Su casa", "Restaurante", "Pensión", "Quiosco", "Otro"], d.se_alimenta,
        { Otro: "Otro" + otro("se_alimenta", "se_alimenta_otro") }), 10]],
      [["L", "Tipo de comidas al día", 2], ["V", op(["Desayuno", "Media mañana", "Almuerzo", "Media tarde", "Cena"], d.comidas), 10]],
      [["L", "Tuvo subsidio por alimentos en el instituto anteriormente", 5], ["V", op(SINO, d.subsidio), 2],
        ["L", "Año(s)", 1], ["V", d.subsidio_anios, 4]],
    ]), espacio());

    // VIII. SALUD
    const probs = (d.salud_problemas || []).filter((p) => p.problema).map((p) => [p.problema, p.tratamiento]);
    while (probs.length < 2) probs.push(["", ""]);
    add(tituloSeccion("VIII. SALUD (del estudiante)"),
      rejilla([[["L", "Tipo de seguro de salud", 2], ["V", op(["ESSALUD", "SIS", "EPS", "Otro", "Ninguno"], d.seguro,
        { Otro: "Otro" + otro("seguro", "seguro_otro") }), 10]]]),
      tablaLista(["Problemas de salud que requieren tratamiento continuo", "En tratamiento (Sí/No)"], [COL * 9, COL * 3], probs),
      rejilla([
        [["L", "Alergias", 2], ["V", d.alergias, 10]],
        [["L", "Presenta alguna discapacidad", 3], ["V", op(SINO, d.discapacidad), 2], ["L", "Tipo", 1], ["V", d.discapacidad_tipo, 6]],
        [["L", "Sufres de alguna enfermedad", 3], ["V", op(SINO, d.enfermedad), 2], ["L", "¿Cuál?", 1], ["V", d.enfermedad_cual, 6]],
        [["L", "Tomas medicamento para tu enfermedad", 3], ["V", op(SINO, d.medicamento), 2], ["L", "¿Cuál?", 1], ["V", d.medicamento_cual, 6]],
        [["L", "Operaciones", 2], ["V", d.operaciones, 10]],
        [["L", "Otros", 2], ["V", d.salud_otros, 10]],
        [["L", "Religión", 2], ["V", d.religion, 10]],
        [["L", "Tiene algún estudio técnico o profesional", 4], ["V", op(SINO, d.estudio_tecnico), 2], ["L", "¿Cuál?", 1], ["V", d.estudio_cual, 5]],
      ]), espacio(8));

    // DECLARACIÓN
    [
      "La información contenida en el presente documento constituye declaración jurada del informante, quien declara la veracidad de la misma.",
      "La información declarada será verificada y en caso de determinarse que la información proporcionada sea falsa o distorsionada, se someterá a las sanciones disciplinarias correspondientes, además de las acciones administrativas, civiles y penales a que hubiera lugar conforme a lo previsto por el artículo 411 del Código Penal.",
    ].forEach((p) => add(new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 60 }, children: [run(p)] })));

    const [fa, fm, fd] = (/^\d{4}-\d{2}-\d{2}$/.test(d.fecha_ficha || "") ? d.fecha_ficha : new Date().toISOString().slice(0, 10)).split("-").map(Number);
    add(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 80 },
      children: [run(`${d.lugar_firma || window.CONFIG?.LUGAR || "Nuñoa"}, ${fd} de ${MESES[fm - 1]} de ${fa}`)] }));

    // FIRMAS
    const menor = Number(d.edad) < 18;
    const bloqueFirma = (lineas, antes) => [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: antes }, children: [run("_______________________________")] }),
      ...lineas.map(([txt, neg]) => new Paragraph({ alignment: AlignmentType.CENTER, children: [run(txt, { negrita: neg, tam: 16 })] })),
    ];
    const mitad = ANCHO / 2;
    add(new Table({
      width: { size: ANCHO, type: WidthType.DXA },
      columnWidths: [mitad, mitad],
      borders: SIN_BORDES,
      rows: [
        new TableRow({ cantSplit: true, children: [
          new TableCell({ width: { size: mitad, type: WidthType.DXA }, borders: SIN_BORDES, children: bloqueFirma([
            ["Firma del estudiante", true], [`${d.nombres} ${d.apellido_paterno} ${d.apellido_materno}`, false], [`DNI/CE: ${d.dni}`, false]], 840) }),
          new TableCell({ width: { size: mitad, type: WidthType.DXA }, borders: SIN_BORDES, children: bloqueFirma([
            ["Firma del padre/madre o apoderado", true], ["(en caso de ser menor de edad)" + (menor ? " — OBLIGATORIO" : ""), false],
            ["DNI: ____________________", false]], 840) }),
        ] }),
        new TableRow({ cantSplit: true, children: [new TableCell({ columnSpan: 2, width: { size: ANCHO, type: WidthType.DXA }, borders: SIN_BORDES,
          children: bloqueFirma([["Vº Bº Responsable de Bienestar y Empleabilidad", true]], 920) })] }),
      ],
    }));

    // ENCABEZADO Y PIE
    const encabezado = new Header({ children: [
      new Table({
        width: { size: ANCHO, type: WidthType.DXA },
        columnWidths: [1250, ANCHO - 1250],
        borders: SIN_BORDES,
        rows: [new TableRow({ children: [
          new TableCell({ width: { size: 1250, type: WidthType.DXA }, borders: SIN_BORDES, children: [new Paragraph({ children: [
            new ImageRun({ type: "png", data: lg.datos, transformation: { width: lg.ancho, height: lg.alto } })] })] }),
          new TableCell({ width: { size: ANCHO - 1250, type: WidthType.DXA }, borders: SIN_BORDES, verticalAlign: VerticalAlign.CENTER, children: [
            new Paragraph({ children: [run(inst, { negrita: true, tam: 22, color: AZUL })] }),
            new Paragraph({ children: [run("Área de Bienestar y Empleabilidad", { tam: 16, color: "555555", cursiva: true })] }),
          ] }),
        ] })],
      }),
      new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "F5C400", space: 1 } }, children: [] }),
    ] });
    const pie = new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
      run(`Ficha socioeconómica — ${d.apellido_paterno} ${d.apellido_materno}, ${d.nombres} — DNI ${d.dni}`, { tam: 14, color: "777777" })] })] });

    const doc = new Document({
      creator: inst,
      title: "Ficha de Evaluación Socioeconómica",
      styles: { default: { document: { run: { font: FUENTE, size: TAM }, paragraph: { spacing: { after: 0 } } } } },
      sections: [{
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 567, bottom: 567, left: 680, right: 680, header: 340, footer: 280 } } },
        headers: { default: encabezado },
        footers: { default: pie },
        children: cuerpo,
      }],
    });
    return Packer.toBlob(doc);
  }

  const ESTADOS = ["Soltero(a)", "Casado(a)", "Conviviente", "Separado(a)", "Divorciado(a)", "Viudo(a)"];

  async function descargar(d) {
    const blob = await generar(d);
    descargarBlob(blob, nombreArchivo(d));
  }

  return { generar, descargar };
})();
