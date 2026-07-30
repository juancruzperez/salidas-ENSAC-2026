// ==========================================
// VARIABLES GLOBALES DE SECCIONES
// ==========================================
const seccion1 = document.getElementById('seccion1-gestion');
const seccion2 = document.getElementById('seccion2-estudiantes');
const seccion3 = document.getElementById('seccion3-docentes');
const seccion4 = document.getElementById('seccion4-transporte');

// ------------------------------------------------------------
// LÓGICA DEL PASO 1: GESTIÓN
// ------------------------------------------------------------
const formGestion = document.getElementById('formGestion');
const cantEstudiantes = document.getElementById('cantEstudiantes');
const cantAcompanantes = document.getElementById('cantAcompanantes');
const alertaAcompanantes = document.getElementById('alertaAcompanantes');

const inputFechaSalida = document.getElementById('fechaSalida');
const inputFechaRegreso = document.getElementById('fechaRegreso');
const inputHoraSalida = document.getElementById('horaSalida');
const inputHoraRegreso = document.getElementById('horaRegreso');
const checkboxSinPernocte = document.getElementById('sinPernocte');
const seccionAlojamiento = document.getElementById('seccionAlojamiento');
const inputsAlojamiento = document.querySelectorAll('.input-alojamiento');

const btnSiguienteEstudiantes = document.getElementById('btnSiguienteEstudiantes');

// --- NUEVO: Manejo de Destino Local / Exterior ---
const checkboxSalidaLocal = document.getElementById('salidaLocal');
const camposDestinoExtra = document.getElementById('camposDestinoExtra');
const inputsDestinoExtra = document.querySelectorAll('.input-destino-extra');

function manejarSalidaLocal() {
    if (checkboxSalidaLocal.checked) {
        camposDestinoExtra.classList.add('d-none');
        inputsDestinoExtra.forEach(input => {
            input.required = false;
            input.value = '';
        });
    } else {
        camposDestinoExtra.classList.remove('d-none');
        inputsDestinoExtra.forEach(input => {
            input.required = true;
        });
    }
}
checkboxSalidaLocal.addEventListener('change', manejarSalidaLocal);
manejarSalidaLocal(); // Ejecutar al cargar la página
// --------------------------------------------------

function validarCantidades() {
    const numEstudiantes = parseInt(cantEstudiantes.value) || 0;
    const numAcompanantes = parseInt(cantAcompanantes.value) || 0;

    if (numEstudiantes > 0) {
        const minimoAcompanantes = Math.ceil(numEstudiantes / 10);
        cantAcompanantes.min = minimoAcompanantes;

        if (numAcompanantes > 0 && numAcompanantes < minimoAcompanantes) {
            alertaAcompanantes.textContent = `Mínimo requerido: ${minimoAcompanantes} (1 cada 10 estudiantes).`;
            alertaAcompanantes.classList.remove('d-none');
        } else {
            alertaAcompanantes.classList.add('d-none');
        }
    } else {
        cantAcompanantes.min = 1;
        alertaAcompanantes.classList.add('d-none');
    }
    validarEstudiantes();
    generarCamposDocentes();
}

formGestion.addEventListener('input', validarCantidades);
formGestion.addEventListener('change', validarCantidades);

function manejarPernocte() {
    if (checkboxSinPernocte.checked) {
        inputFechaRegreso.value = inputFechaSalida.value;
        inputFechaRegreso.readOnly = true;
        inputFechaRegreso.classList.add('bg-light', 'text-muted');
        seccionAlojamiento.style.display = 'none';
        inputsAlojamiento.forEach(input => { input.required = false; input.value = ''; });
    } else {
        inputFechaRegreso.readOnly = false;
        inputFechaRegreso.classList.remove('bg-light', 'text-muted');
        seccionAlojamiento.style.display = 'block';
        inputsAlojamiento.forEach(input => input.required = true);
    }
    if (inputFechaSalida.value) {
        inputFechaRegreso.min = inputFechaSalida.value;
    }
}

checkboxSinPernocte.addEventListener('change', manejarPernocte);
inputFechaSalida.addEventListener('change', function() {
    manejarPernocte();
});
manejarPernocte();

btnSiguienteEstudiantes.addEventListener('click', function() {
    const fSalida = inputFechaSalida.value;
    const fRegreso = inputFechaRegreso.value;
    const hSalida = inputHoraSalida.value;
    const hRegreso = inputHoraRegreso.value;

    if (fSalida && fRegreso) {
        if (!checkboxSinPernocte.checked && fRegreso < fSalida) {
            alert("⚠️ La fecha de regreso no puede ser anterior a la fecha de salida.");
            return;
        }
        if (fSalida === fRegreso && hSalida && hRegreso) {
            if (hRegreso <= hSalida) {
                alert("⚠️ Para viajes en el mismo día, la hora de regreso debe ser posterior a la hora de salida.");
                return;
            }
        }
    }

    if (!formGestion.checkValidity()) {
        formGestion.classList.add('was-validated');
        alert("⚠️ Por favor, completa todos los campos obligatorios y adjunta el archivo del proyecto en el Paso 1.");
    } else {
        formGestion.classList.remove('was-validated');
        seccion2.classList.remove('d-none');
        seccion2.scrollIntoView();
    }
});

// ------------------------------------------------------------
// LÓGICA DEL PASO 2: ESTUDIANTES 
// ------------------------------------------------------------
let contadorCursos = 0;
const contenedorSeccionesCursos = document.getElementById('contenedorSeccionesCursos');
const checkAgregarOtroCurso = document.getElementById('checkAgregarOtroCurso');
const textoContadorEstudiantes = document.getElementById('textoContadorEstudiantes');
const btnSiguienteDocentes = document.getElementById('btnSiguienteDocentes');

function validarEstudiantes() {
    const declarados = parseInt(cantEstudiantes.value) || 0;
    const seleccionados = document.querySelectorAll('.check-estudiante:checked').length;

    textoContadorEstudiantes.textContent = `${seleccionados} / ${declarados}`;

    if (declarados > 0 && seleccionados === declarados) {
        textoContadorEstudiantes.classList.remove('text-danger');
        textoContadorEstudiantes.classList.add('text-success'); 
        btnSiguienteDocentes.removeAttribute('disabled'); 
    } else {
        textoContadorEstudiantes.classList.remove('text-success');
        textoContadorEstudiantes.classList.add('text-danger'); 
        btnSiguienteDocentes.setAttribute('disabled', 'true'); 
    }
}

btnSiguienteDocentes.addEventListener('click', function() {
    seccion3.classList.remove('d-none');
    seccion3.scrollIntoView();
    generarCamposDocentes();
});

function agregarSeccionCurso() {
    contadorCursos++;
    const idCurso = contadorCursos;

    const htmlSeccion = `
        <div class="card mb-4 border shadow-sm" id="cursoCard_${idCurso}">
            <div class="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                <h6 class="mb-0 fw-bold">Búsqueda de Curso #${idCurso}</h6>
                ${idCurso > 1 ? `<button type="button" class="btn btn-sm btn-outline-light" onclick="eliminarSeccionCurso(${idCurso})">🗑️ Eliminar</button>` : ''}
            </div>
            <div class="card-body bg-white">
                <div class="row mb-3">
                    <div class="col-md-3 mb-3">
                        <label class="form-label fw-bold">Turno</label>
                        <select class="form-select" id="filtroTurno_${idCurso}">
                            <option value="TODOS">Todos</option>
                            <option value="MAÑANA">MAÑANA</option>
                            <option value="TARDE">TARDE</option>
                        </select>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label class="form-label fw-bold">Año</label>
                        <select class="form-select" id="filtroAno_${idCurso}">
                            <option value="TODOS">Todos</option>
                            <option value="PRIMER AÑO">PRIMER AÑO</option>
                            <option value="SEGUNDO AÑO">SEGUNDO AÑO</option>
                            <option value="TERCER AÑO">TERCER AÑO</option>
                            <option value="CUARTO AÑO">CUARTO AÑO</option>
                            <option value="QUINTO AÑO">QUINTO AÑO</option>
                            <option value="SEXTO AÑO">SEXTO AÑO</option>
                        </select>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label class="form-label fw-bold">División</label>
                        <select class="form-select" id="filtroDivision_${idCurso}">
                            <option value="TODOS">Todas</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                            <option value="E">E</option>
                        </select>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label class="form-label fw-bold">Ciclo / Esp.</label>
                        <select class="form-select" id="filtroCiclo_${idCurso}">
                            <option value="TODOS">Todos</option>
                            <option value="CICLO BASICO">CICLO BASICO</option>
                            <option value="LENGUAS">LENGUAS</option>
                            <option value="CIENCIAS SOCIALES">CIENCIAS SOCIALES</option>
                            <option value="CIENCIAS NATURALES">CIENCIAS NATURALES</option>
                        </select>
                    </div>
                    <div class="col-12 text-center mt-2">
                        <button type="button" class="btn btn-outline-success px-4" onclick="buscarAlumnosPorCurso(${idCurso})">
                            🔍 Buscar Estudiantes
                        </button>
                    </div>
                </div>

                <div id="contenedorTabla_${idCurso}" class="d-none mt-3">
                    <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded border">
                        <span class="small text-muted fw-bold">Acciones rápidas:</span>
                        <div>
                            <button type="button" class="btn btn-sm btn-outline-primary me-2" onclick="seleccionarTodosAlumnos(${idCurso})">
                                ☑️ Seleccionar todos
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="deseleccionarTodosAlumnos(${idCurso})">
                                🔲 Deseleccionar todos
                            </button>
                        </div>
                    </div>
                    <div class="table-responsive">
                        <table class="table table-bordered table-hover align-middle mb-1">
                            <thead class="table-light">
                                <tr>
                                    <th scope="col" class="text-center" style="width: 50px;">Viaja</th>
                                    <th scope="col">Apellido y Nombre</th>
                                    <th scope="col">DNI</th>
                                    <th scope="col" style="width: 160px;">G. Sanguíneo y RH</th>
                                    <th scope="col" style="width: 160px;">Fecha Nac.</th>
                                </tr>
                            </thead>
                            <tbody id="cuerpoTabla_${idCurso}"></tbody>
                        </table>
                    </div>
                </div>

                <div id="mensajeSinResultados_${idCurso}" class="alert alert-warning d-none text-center mt-3" role="alert">
                    No se encontraron estudiantes para los criterios seleccionados.
                </div>
            </div>
        </div>
    `;
    contenedorSeccionesCursos.insertAdjacentHTML('beforeend', htmlSeccion);
}

async function buscarAlumnosPorCurso(idCurso) {
    const turno = document.getElementById(`filtroTurno_${idCurso}`).value;
    const ano = document.getElementById(`filtroAno_${idCurso}`).value;
    const division = document.getElementById(`filtroDivision_${idCurso}`).value;
    const ciclo = document.getElementById(`filtroCiclo_${idCurso}`).value;

    const cuerpoTabla = document.getElementById(`cuerpoTabla_${idCurso}`);
    const contenedorTabla = document.getElementById(`contenedorTabla_${idCurso}`);
    const mensajeSinResultados = document.getElementById(`mensajeSinResultados_${idCurso}`);

    cuerpoTabla.innerHTML = '<tr><td colspan="5" class="text-center">Buscando en la base de datos...</td></tr>';
    contenedorTabla.classList.remove('d-none');
    mensajeSinResultados.classList.add('d-none');

    try {
        const respuesta = await fetch(`/api/estudiantes?turno=${encodeURIComponent(turno)}&ano=${encodeURIComponent(ano)}&division=${encodeURIComponent(division)}&ciclo=${encodeURIComponent(ciclo)}`);
        
        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status}`);
        }

        const alumnosFiltrados = await respuesta.json();

        cuerpoTabla.innerHTML = '';

        if (alumnosFiltrados.length > 0) {
            mensajeSinResultados.classList.add('d-none');
            contenedorTabla.classList.remove('d-none');

            alumnosFiltrados.forEach(alumno => {
                const gsGuardado = (alumno.grupo_sanguineo || '').trim();

                const fila = `
                    <tr>
                        <td class="text-center">
                            <input class="form-check-input check-estudiante" type="checkbox" 
                                value="${alumno.dni}" 
                                data-nombre="${alumno.apellido_nombre}" 
                                data-ano="${alumno.ano}" 
                                data-division="${alumno.division}" 
                                data-turno="${alumno.turno}" 
                                data-ciclo="${alumno.ciclo_especializacion || ''}" 
                                onchange="validarEstudiantes()">
                        </td>
                        <td>
                            <strong>${alumno.apellido_nombre}</strong><br>
                            <small class="text-muted">DNI: ${alumno.dni} | ${alumno.ano}° "${alumno.division}" - ${alumno.ciclo_especializacion}</small>
                        </td>
                        <td>${alumno.dni}</td>
                        <td>
                            <select class="form-select form-select-sm input-grupo-sanguineo" data-dni="${alumno.dni}">
                                <option value="" ${!gsGuardado ? 'selected' : ''}>- Seleccionar -</option>
                                <option value="A +" ${gsGuardado === 'A +' || gsGuardado === 'A+' ? 'selected' : ''}>A +</option>
                                <option value="A -" ${gsGuardado === 'A -' || gsGuardado === 'A-' ? 'selected' : ''}>A -</option>
                                <option value="B +" ${gsGuardado === 'B +' || gsGuardado === 'B+' ? 'selected' : ''}>B +</option>
                                <option value="B -" ${gsGuardado === 'B -' || gsGuardado === 'B-' ? 'selected' : ''}>B -</option>
                                <option value="AB +" ${gsGuardado === 'AB +' || gsGuardado === 'AB+' ? 'selected' : ''}>AB +</option>
                                <option value="AB -" ${gsGuardado === 'AB -' || gsGuardado === 'AB-' ? 'selected' : ''}>AB -</option>
                                <option value="O +" ${gsGuardado === 'O +' || gsGuardado === 'O+' ? 'selected' : ''}>O +</option>
                                <option value="O -" ${gsGuardado === 'O -' || gsGuardado === 'O-' ? 'selected' : ''}>O -</option>
                            </select>
                        </td>
                        <td>
                            <input type="date" class="form-control form-control-sm input-fecha-nacimiento" data-dni="${alumno.dni}" value="${alumno.fecha_nacimiento || ''}">
                        </td>
                    </tr>
                `;
                cuerpoTabla.innerHTML += fila;
            });
        } else {
            contenedorTabla.classList.add('d-none');
            mensajeSinResultados.classList.remove('d-none');
        }
    } catch (error) {
        console.error("Error al consultar los estudiantes:", error);
        alert("⚠️ Hubo un error al conectar con la base de datos.");
        contenedorTabla.classList.add('d-none');
    }

    validarEstudiantes();
}

function seleccionarTodosAlumnos(idCurso) {
    const checkboxes = document.querySelectorAll(`#cuerpoTabla_${idCurso} .check-estudiante`);
    checkboxes.forEach(cb => cb.checked = true);
    validarEstudiantes();
}

function deseleccionarTodosAlumnos(idCurso) {
    const checkboxes = document.querySelectorAll(`#cuerpoTabla_${idCurso} .check-estudiante`);
    checkboxes.forEach(cb => cb.checked = false);
    validarEstudiantes();
}

function eliminarSeccionCurso(idCurso) {
    const card = document.getElementById(`cursoCard_${idCurso}`);
    if (card) {
        card.remove();
        validarEstudiantes(); 
    }
}

checkAgregarOtroCurso.addEventListener('change', function() {
    if (this.checked) {
        agregarSeccionCurso(); 
        this.checked = false;  
    }
});

agregarSeccionCurso();
validarEstudiantes();

// ------------------------------------------------------------
// LÓGICA DEL PASO 3: DOCENTES
// ------------------------------------------------------------
const formDocentes = document.getElementById('formDocentes');
const labelCantDocentes = document.getElementById('labelCantDocentes');
const contenedorDocentesForm = document.getElementById('contenedorDocentesForm');
const btnSiguienteTransporte = document.getElementById('btnSiguienteTransporte');

function generarCamposDocentes() {
    const cant = parseInt(cantAcompanantes.value) || 0;
    labelCantDocentes.textContent = cant;
    contenedorDocentesForm.innerHTML = '';

    if (cant <= 0) {
        contenedorDocentesForm.innerHTML = '<p class="text-danger">Por favor, declare primero la cantidad de acompañantes en el Paso 1.</p>';
        btnSiguienteTransporte.setAttribute('disabled', 'true');
        return;
    }

    for (let i = 1; i <= cant; i++) {
        const htmlDocente = `
            <div class="card mb-3 p-3 bg-white border card-docente-item">
                <h6 class="text-primary fw-bold mb-3">Docente Acompañante #${i}</h6>
                <div class="row">
                    <div class="col-md-3 mb-3">
                        <label class="form-label fw-bold">DNI</label>
                        <input type="text" class="form-control input-docente input-docente-dni" placeholder="Sin puntos" required>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label class="form-label fw-bold">Apellido/s</label>
                        <input type="text" class="form-control input-docente input-docente-apellido" placeholder="Apellidos" required>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label class="form-label fw-bold">Nombres</label>
                        <input type="text" class="form-control input-docente input-docente-nombre" placeholder="Nombres" required>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label class="form-label fw-bold">Teléfono</label>
                        <input type="tel" class="form-control input-docente input-docente-telefono" placeholder="Cod. área + nro" required>
                    </div>
                </div>
            </div>
        `;
        contenedorDocentesForm.insertAdjacentHTML('beforeend', htmlDocente);
    }

    const inputsDocentes = document.querySelectorAll('.input-docente');
    inputsDocentes.forEach(input => {
        input.addEventListener('input', validarDocentes);
    });

    validarDocentes();
}

function validarDocentes() {
    let todoCompleto = true;
    const inputsDocentes = document.querySelectorAll('.input-docente');
    
    if (inputsDocentes.length === 0) {
        btnSiguienteTransporte.setAttribute('disabled', 'true');
        return;
    }

    inputsDocentes.forEach(input => {
        if (!input.value.trim()) {
            todoCompleto = false;
        }
    });

    if (todoCompleto) {
        btnSiguienteTransporte.removeAttribute('disabled');
    } else {
        btnSiguienteTransporte.setAttribute('disabled', 'true');
    }
}

btnSiguienteTransporte.addEventListener('click', function() {
    seccion4.classList.remove('d-none');
    seccion4.scrollIntoView();
});

// ------------------------------------------------------------
// LÓGICA DE GENERACIÓN DE UN ÚNICO PDF CONSOLIDADO (3 HOJAS)
// ------------------------------------------------------------

function formatearFechaDDMMAAAA(fechaISO) {
    if (!fechaISO) return '-';
    const partes = fechaISO.split('-');
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function generarPDFUnico() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Lógica del destino (Local vs Exterior)
    const destinoBase = (document.getElementById('destino').value || 'DESTINO').trim();
    let destinoFinalFormateado = "";
    
    if (document.getElementById('salidaLocal').checked) {
        destinoFinalFormateado = `${destinoBase} - CÓRDOBA`;
    } else {
        const pais = (document.getElementById('paisDestino').value || '').trim();
        const provincia = (document.getElementById('provinciaDestino').value || '').trim();
        const ciudad = (document.getElementById('ciudadDestino').value || '').trim();
        destinoFinalFormateado = `${destinoBase} - ${ciudad}, ${provincia}, ${pais}`;
    }
    
    destinoFinalFormateado = destinoFinalFormateado.toUpperCase();

    const fechaSalidaIso = document.getElementById('fechaSalida').value || '';
    const fechaSalidaFormat = formatearFechaDDMMAAAA(fechaSalidaIso);

    // ==========================================
    // HOJA 1: NOTA DE ELEVACIÓN
    // ==========================================
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NOTA DE ELEVACIÓN", 105, 20, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Por la presente se eleva la solicitud y documentación de la Salida Educativa:", 14, 32);

    const modalidad = checkboxSinPernocte.checked ? "SIN PERNOCTE (IDA Y VUELTA EN EL DÍA)" : "CON PERNOCTE";
    
    const datosPaso1 = [
        ["Destino del viaje:", destinoFinalFormateado],
        ["Lugar de salida:", (document.getElementById('lugarSalida').value || '-').toUpperCase()],
        ["Lugar de regreso:", (document.getElementById('lugarRegreso').value || '-').toUpperCase()],
        ["Cantidad de estudiantes:", document.getElementById('cantEstudiantes').value || '-'],
        ["Cantidad de acompañantes:", document.getElementById('cantAcompanantes').value || '-'],
        ["Modalidad de viaje:", modalidad],
        ["Fecha de salida:", `${fechaSalidaFormat} (${document.getElementById('horaSalida').value || '-'} HS)`],
        ["Fecha de regreso:", `${formatearFechaDDMMAAAA(document.getElementById('fechaRegreso').value)} (${document.getElementById('horaRegreso').value || '-'} HS)`]
    ];

    if (!checkboxSinPernocte.checked) {
        datosPaso1.push(
            ["Nombre del alojamiento:", (document.getElementById('nombreAlojamiento').value || '-').toUpperCase()],
            ["Domicilio del alojamiento:", (document.getElementById('domicilioAlojamiento').value || '-').toUpperCase()],
            ["Teléfono del alojamiento:", (document.getElementById('telefonoAlojamiento').value || '-').toUpperCase()]
        );
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
    // HOJA 2: NÓMINA DE ESTUDIANTES
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
    // HOJA 3: NÓMINA DE ACOMPAÑANTES
    // ==========================================
    doc.addPage(); 

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("NÓMINA DE DOCENTES ACOMPAÑANTES", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Destino: ${destinoFinalFormateado} | Fecha de salida: ${fechaSalidaFormat}`, 105, 27, { align: "center" });

    const cardsDocentes = document.querySelectorAll('.card-docente-item');
    const tablaDocentes = [];

    cardsDocentes.forEach((card, index) => {
        const dni = card.querySelector('.input-docente-dni')?.value || '-';
        const apellido = (card.querySelector('.input-docente-apellido')?.value || '').toUpperCase();
        const nombre = (card.querySelector('.input-docente-nombre')?.value || '').toUpperCase();
        const telefono = card.querySelector('.input-docente-telefono')?.value || '-';

        tablaDocentes.push([
            index + 1,
            `${apellido}, ${nombre}`,
            dni,
            telefono
        ]);
    });

    doc.autoTable({
        startY: 33,
        head: [['#', 'Apellido y Nombre', 'DNI', 'Teléfono de Contacto']],
        body: tablaDocentes,
        theme: 'grid',
        headStyles: { fillColor: [13, 202, 240] },
        styles: { fontSize: 9 }
    });

    doc.save("Salida_Educativa_Documentacion_Completa.pdf");
}

// ------------------------------------------------------------
// LÓGICA DEL PASO 4: TRANSPORTE Y GUARDADO FINAL
// ------------------------------------------------------------
const sinTransporte = document.getElementById('sinTransporte');
const camposTransporte = document.getElementById('camposTransporte');
const inputsTransporte = document.querySelectorAll('.input-transporte');
const inputsValidez = document.querySelectorAll('.input-validez');
const formTransporte = document.getElementById('formTransporte');

function manejarSinTransporte() {
    if (sinTransporte.checked) {
        camposTransporte.style.display = 'none';
        inputsTransporte.forEach(input => {
            input.required = false;
            input.value = ''; 
        });
        inputsValidez.forEach(input => {
            input.required = false;
            input.value = '';
            input.nextElementSibling.classList.add('d-none');
        });
    } else {
        camposTransporte.style.display = 'block';
        inputsTransporte.forEach(input => {
            input.required = true;
        });
        inputsValidez.forEach(input => {
            input.required = true;
        });
    }
}

sinTransporte.addEventListener('change', manejarSinTransporte);

inputsValidez.forEach(inputValidez => {
    inputValidez.addEventListener('change', function() {
        const fechaViajeStr = inputFechaSalida.value;
        const fechaValidezStr = this.value;
        const alerta = this.nextElementSibling; 

        if (fechaViajeStr && fechaValidezStr) {
            const fechaViaje = new Date(fechaViajeStr);
            const fechaValidez = new Date(fechaValidezStr);

            if (fechaValidez < fechaViaje) {
                alerta.classList.remove('d-none');
            } else {
                alerta.classList.add('d-none');
            }
        } else {
            alerta.classList.add('d-none');
        }
    });
});

formTransporte.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    let hayDocumentosVencidos = false;
    if (!sinTransporte.checked) {
        document.querySelectorAll('.alerta-vencido').forEach(alerta => {
            if (!alerta.classList.contains('d-none')) {
                hayDocumentosVencidos = true;
            }
        });
    }

    if (hayDocumentosVencidos) {
        alert("⚠️ No se puede registrar la salida: Hay documentos del transporte cuya fecha de validez es anterior al día del viaje (se encuentran vencidos).");
        return;
    }

    if (formTransporte.checkValidity()) {
        const btnSubmit = formTransporte.querySelector('button[type="submit"]');
        const textoOriginal = btnSubmit.innerHTML;
        
        btnSubmit.innerHTML = "⏳ Guardando datos y generando PDF...";
        btnSubmit.disabled = true;

        try {
            const estudiantesSeleccionados = document.querySelectorAll('.check-estudiante:checked');
            const datosAActualizar = [];

            estudiantesSeleccionados.forEach(checkbox => {
                const dni = checkbox.value;
                const selectGS = document.querySelector(`.input-grupo-sanguineo[data-dni="${dni}"]`);
                const inputFecha = document.querySelector(`.input-fecha-nacimiento[data-dni="${dni}"]`);

                if (selectGS && inputFecha) {
                    datosAActualizar.push({
                        dni: dni,
                        grupoSanguineo: selectGS.value,
                        fechaNacimiento: inputFecha.value
                    });
                }
            });

            if (datosAActualizar.length > 0) {
                await fetch('/api/actualizar-estudiantes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estudiantes: datosAActualizar })
                });
            }

            generarPDFUnico();

            alert("🎉 ¡Excelente! La salida educativa ha sido registrada, la base de datos se actualizó y se descargó el PDF con las 3 hojas completas.");
            location.reload(); 
        } catch(error) {
            console.error("Error al guardar:", error);
            alert("⚠️ Hubo un error al guardar los datos en la base de datos.");
            btnSubmit.innerHTML = textoOriginal;
            btnSubmit.disabled = false;
        }

    } else {
        formTransporte.classList.add('was-validated');
        alert("⚠️ Por favor, completa toda la documentación requerida del transporte o marca la casilla 'Sin transporte'.");
    }
});