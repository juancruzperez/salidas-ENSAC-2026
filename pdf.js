// ==========================================
// FUNCIONES AUXILIARES PARA LECTURA DE ARCHIVOS Y PDF-LIB
// ==========================================
function leerArchivoComoArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

async function agregarImagenAPdf(finalDoc, arrayBuffer, mimeType) {
    let image;
    if (mimeType.includes('png')) {
        image = await finalDoc.embedPng(arrayBuffer);
    } else {
        image = await finalDoc.embedJpg(arrayBuffer);
    }
    
    const page = finalDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();
    
    const margin = 20;
    const maxWidth = width - (margin * 2);
    const maxHeight = height - (margin * 2);
    
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
    const scaledWidth = image.width * scale;
    const scaledHeight = image.height * scale;
    
    const x = (width - scaledWidth) / 2;
    const y = (height - scaledHeight) / 2;
    
    page.drawImage(image, {
        x: x,
        y: y,
        width: scaledWidth,
        height: scaledHeight
    });
}

function formatearFechaDDMMAAAA(fechaISO) {
    if (!fechaISO) return '-';
    const partes = fechaISO.split('-');
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obtenerDestinoFormateado() {
    const destinoBase = (document.getElementById('destino') ? document.getElementById('destino').value : 'DESTINO').trim();
    const salidaLocalCheck = document.getElementById('salidaLocal');
    if (salidaLocalCheck && salidaLocalCheck.checked) {
        return `${destinoBase} - CÓRDOBA`.toUpperCase();
    } else {
        const pais = (document.getElementById('paisDestino') ? document.getElementById('paisDestino').value : '').trim();
        const provincia = (document.getElementById('provinciaDestino') ? document.getElementById('provinciaDestino').value : '').trim();
        const ciudad = (document.getElementById('ciudadDestino') ? document.getElementById('ciudadDestino').value : '').trim();
        return `${destinoBase} - ${ciudad}, ${provincia}, ${pais}`.toUpperCase();
    }
}

// ==========================================
// GENERACIÓN Y ENSAMBLE DEL PDF CONSOLIDADO
// ==========================================
async function generarPDFUnico() {
    const { jsPDF } = window.jspdf;
    const { PDFDocument } = PDFLib;

    const doc = new jsPDF();

    const destinoFinalFormateado = obtenerDestinoFormateado();
    const fechaSalidaIso = document.getElementById('fechaSalida') ? document.getElementById('fechaSalida').value : '';
    const fechaSalidaFormat = formatearFechaDDMMAAAA(fechaSalidaIso);
    
    const selectTipoTransporte = document.getElementById('tipoTransporte');
    const valorTransporte = selectTipoTransporte ? selectTipoTransporte.value : '';

    const checkSinPernoctePdf = document.getElementById('sinPernocte');

    // ==========================================
    // HOJA A: NOTA DE ELEVACIÓN
    // ==========================================
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NOTA DE ELEVACIÓN", 105, 20, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Por la presente se eleva la solicitud y documentación de la Salida Educativa:", 14, 32);

    const modalidad = checkSinPernoctePdf && checkSinPernoctePdf.checked ? "SIN PERNOCTE (IDA Y VUELTA EN EL DÍA)" : "CON PERNOCTE";
    
    const datosPaso1 = [
        ["Destino del viaje:", destinoFinalFormateado],
        ["Lugar de salida:", (document.getElementById('lugarSalida') ? document.getElementById('lugarSalida').value : '-').toUpperCase()],
        ["Lugar de regreso:", (document.getElementById('lugarRegreso') ? document.getElementById('lugarRegreso').value : '-').toUpperCase()],
        ["Cantidad de estudiantes:", document.getElementById('cantEstudiantes') ? document.getElementById('cantEstudiantes').value : '-'],
        ["Cantidad de acompañantes:", document.getElementById('cantAcompanantes') ? document.getElementById('cantAcompanantes').value : '-'],
        ["Modalidad de viaje:", modalidad],
        ["Fecha de salida:", `${fechaSalidaFormat} (${document.getElementById('horaSalida') ? document.getElementById('horaSalida').value : '-'} HS)`],
        ["Fecha de regreso:", `${formatearFechaDDMMAAAA(document.getElementById('fechaRegreso') ? document.getElementById('fechaRegreso').value : '')} (${document.getElementById('horaRegreso') ? document.getElementById('horaRegreso').value : '-'} HS)`]
    ];

    if (checkSinPernoctePdf && !checkSinPernoctePdf.checked) {
        datosPaso1.push(
            ["Nombre del alojamiento:", (document.getElementById('nombreAlojamiento') ? document.getElementById('nombreAlojamiento').value : '-').toUpperCase()],
            ["Domicilio del alojamiento:", (document.getElementById('domicilioAlojamiento') ? document.getElementById('domicilioAlojamiento').value : '-').toUpperCase()],
            ["Teléfono del alojamiento:", (document.getElementById('telefonoAlojamiento') ? document.getElementById('telefonoAlojamiento').value : '-').toUpperCase()]
        );
    }
    
    if (valorTransporte === 'PRIVADO') {
        datosPaso1.push(["Transporte:", "Contratación Privada / Excursión"]);
    } else if (valorTransporte === 'PUBLICO_PROPIO') {
        datosPaso1.push(["Transporte:", "Público, Medios Propios o Caminata"]);
    } else if (valorTransporte === 'LARGA_DISTANCIA') {
        const empIda = document.getElementById('empresaIda') ? document.getElementById('empresaIda').value : '-';
        const fIda = document.getElementById('diaSalidaIda') ? formatearFechaDDMMAAAA(document.getElementById('diaSalidaIda').value) : '-';
        const hIda = document.getElementById('horaSalidaIda') ? document.getElementById('horaSalidaIda').value : '-';
        datosPaso1.push(["Transporte Ida:", `Ómnibus: ${empIda.toUpperCase()} (${fIda} - ${hIda} HS)`]);
        
        const empReg = document.getElementById('empresaRegreso') ? document.getElementById('empresaRegreso').value : '-';
        const fReg = document.getElementById('diaSalidaRegreso') ? formatearFechaDDMMAAAA(document.getElementById('diaSalidaRegreso').value) : '-';
        const hReg = document.getElementById('horaSalidaRegreso') ? document.getElementById('horaSalidaRegreso').value : '-';
        datosPaso1.push(["Transporte Regreso:", `Ómnibus: ${empReg.toUpperCase()} (${fReg} - ${hReg} HS)`]);
    }

    doc.autoTable({
        startY: 38,
        head: [['Campo', 'Detalle']],
        body: datosPaso1,
        theme: 'striped',
        headStyles: { fillColor: [13, 110, 253] },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } }
    });

    const finalY = doc.lastAutoTable.finalY + 35;
    doc.line(120, finalY, 190, finalY);
    doc.text("Firma y Aclaración del Docente / Directivo", 155, finalY + 7, { align: "center" });

    // ==========================================
    // HOJA B: NÓMINA DE ESTUDIANTES
    // ==========================================
    doc.addPage(); 

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NÓMINA DE ESTUDIANTES SELECCIONADOS", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Destino: ${destinoFinalFormateado} | Fecha de salida: ${fechaSalidaFormat}`, 105, 27, { align: "center" });

    const checkboxes = document.querySelectorAll('.check-estudiante:checked');
    const tablaEstudiantes = [];

    checkboxes.forEach((cb, index) => {
        const dni = cb.value;
        const nombre = (cb.getAttribute('data-nombre') || '-').toUpperCase();
        const ano = (cb.getAttribute('data-ano') || '-').toUpperCase();
        const division = (cb.getAttribute('data-division') || '-').toUpperCase();
        const turno = (cb.getAttribute('data-turno') || '-').toUpperCase();
        const ciclo = (cb.getAttribute('data-ciclo') || '-').toUpperCase();
        
        const pertenenciaInstitucional = `${ano} ${division} ${ciclo} ${turno}`.replace(/\s+/g, ' ').trim();

        const selectGS = document.querySelector(`.input-grupo-sanguineo[data-dni="${dni}"]`);
        const inputFecha = document.querySelector(`.input-fecha-nacimiento[data-dni="${dni}"]`);

        const gs = selectGS ? selectGS.value : '';
        const fechaNac = inputFecha ? inputFecha.value : '';

        tablaEstudiantes.push([
            index + 1,
            nombre,
            dni,
            pertenenciaInstitucional,
            (gs || 'NO ESPECIFICADO').toUpperCase(),
            formatearFechaDDMMAAAA(fechaNac)
        ]);
    });

    doc.autoTable({
        startY: 33,
        head: [['#', 'Apellido y Nombre', 'DNI', 'Pertenencia Institucional', 'G. Sanguíneo', 'Fecha Nac.']],
        body: tablaEstudiantes,
        theme: 'grid',
        headStyles: { fillColor: [25, 135, 84] },
        styles: { fontSize: 8.5 }
    });

    // ==========================================
    // HOJA C: NÓMINA DE DOCENTES
    // ==========================================
    doc.addPage(); 

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NÓMINA DE ORGANIZADORES Y DOCENTES ACOMPAÑANTES", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Destino: ${destinoFinalFormateado} | Fecha de salida: ${fechaSalidaFormat}`, 105, 27, { align: "center" });

    const cardsDocentes = document.querySelectorAll('.card-docente-item');
    const tablaDocentes = [];

    cardsDocentes.forEach((card, index) => {
        const tipo = card.getAttribute('data-tipo') === 'organizador' ? 'ORGANIZADOR' : 'ACOMPAÑANTE';
        const dni = card.querySelector('.input-docente-dni')?.value || '-';
        const apellido = (card.querySelector('.input-docente-apellido')?.value || '').toUpperCase();
        const nombre = (card.querySelector('.input-docente-nombre')?.value || '').toUpperCase();
        const telefono = card.querySelector('.input-docente-telefono')?.value || '-';
        const gs = (card.querySelector('.input-docente-gs')?.value || 'NO ESPECIFICADO').toUpperCase();
        const emergencia = card.querySelector('.input-docente-emergencia')?.value || '-';

        tablaDocentes.push([
            index + 1,
            tipo,
            `${apellido}, ${nombre}`,
            dni,
            telefono,
            gs,
            emergencia
        ]);
    });

    doc.autoTable({
        startY: 33,
        head: [['#', 'Rol', 'Apellido y Nombre', 'DNI', 'Teléfono', 'G. Sanguíneo', 'Tel. Emergencia']],
        body: tablaDocentes,
        theme: 'grid',
        headStyles: { fillColor: [13, 202, 240] },
        styles: { fontSize: 7.5 }
    });

    // ==========================================
    // ENSAMBLE CON PDF-LIB EN EL ORDEN ESPECIFICADO
    // ==========================================
    const jsPdfBuffer = doc.output('arraybuffer');
    const basePdfDoc = await PDFDocument.load(jsPdfBuffer);
    const finalDoc = await PDFDocument.create();

    const [notaElevacionPage] = await finalDoc.copyPages(basePdfDoc, [0]);
    finalDoc.addPage(notaElevacionPage);

    const inputProyecto = document.getElementById('archivoProyecto');
    if (inputProyecto && inputProyecto.files && inputProyecto.files[0]) {
        const fileProyecto = inputProyecto.files[0];
        const bufferProj = await leerArchivoComoArrayBuffer(fileProyecto);
        const projPdf = await PDFDocument.load(bufferProj);
        const projPages = await finalDoc.copyPages(projPdf, projPdf.getPageIndices());
        projPages.forEach(p => finalDoc.addPage(p));
    }

    const [estudiantesPage] = await finalDoc.copyPages(basePdfDoc, [1]);
    finalDoc.addPage(estudiantesPage);

    const [docentesPage] = await finalDoc.copyPages(basePdfDoc, [2]);
    finalDoc.addPage(docentesPage);

    if (valorTransporte === 'PRIVADO') {
        const inputsTrans = document.querySelectorAll('.input-transporte');
        for (const input of inputsTrans) {
            if (input.files && input.files[0]) {
                const file = input.files[0];
                const buffer = await leerArchivoComoArrayBuffer(file);
                if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
                    const pdfDoc = await PDFDocument.load(buffer);
                    const pages = await finalDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
                    pages.forEach(p => finalDoc.addPage(p));
                } else {
                    await agregarImagenAPdf(finalDoc, buffer, file.type);
                }
            }
        }
    }

    const finalPdfBytes = await finalDoc.save();
    const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "Salida_Educativa_Documentacion_Completa.pdf";
    link.click();
}

// ==========================================
// EXPORTAR INFORME EJECUTIVO COMPLETO A PDF 
// ==========================================
async function exportarInformeEjecutivoPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME EJECUTIVO DE SALIDAS EDUCATIVAS", 14, 15);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const fechaActual = new Date().toLocaleDateString('es-AR');
    doc.text(`Fecha de emisión: ${fechaActual} | Respaldo Físico / Archivo`, 14, 22);

    try {
        const respuesta = await fetch('/api/salidas');
        const salidas = await respuesta.json();

        if (!salidas || salidas.length === 0) {
            alert("⚠️ No hay salidas registradas actualmente para exportar.");
            return;
        }

        const filasTabla = salidas.map(s => {
            const modalidad = s.es_pernocte ? 'CON PERNOCTE' : 'SIN PERNOCTE';
            const fechaSalida = s.fecha_salida ? s.fecha_salida.split('T')[0] : '-';
            const fechaRegreso = s.fecha_regreso ? s.fecha_regreso.split('T')[0] : '-';
            
            return [
                `#${s.id}`,
                (s.docente_organizador || 'NO ESPECIFICADO').toUpperCase(),
                (s.destino || '-').toUpperCase(),
                `${fechaSalida} (${s.hora_salida || '-'})`,
                `${fechaRegreso} (${s.hora_regreso || '-'})`,
                modalidad,
                s.cant_estudiantes || 0,
                s.cant_acompanantes || 0,
                (s.estado || 'REGISTRADA').toUpperCase()
            ];
        });

        doc.autoTable({
            startY: 28,
            head: [['# ID', 'Docente/s Organizador/es', 'Destino', 'Fecha Salida', 'Fecha Regreso', 'Modalidad', 'Est.', 'Acomp.', 'Estado']],
            body: filasTabla,
            theme: 'grid',
            headStyles: { fillColor: [13, 110, 253] },
            styles: { fontSize: 8.5 }
        });

        doc.save("Informe_Ejecutivo_Salidas_Educativas_Completo.pdf");
    } catch (error) {
        console.error("Error al generar el PDF del informe ejecutivo:", error);
        alert("⚠️ Hubo un error al conectar con la base de datos para exportar el informe.");
    }
}