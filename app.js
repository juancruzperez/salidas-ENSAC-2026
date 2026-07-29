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
// LÓGICA DEL PASO 2: ESTUDIANTES (Conectado a Vercel Postgres)
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

// Función asíncrona para consultar la API de Vercel
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
                            <input class="form-check-input check-estudiante" type="checkbox" value="${alumno.dni}" onchange="validarEstudiantes()" checked>
                        </td>
                        <td>
                            <strong>${alumno.apellido_nombre}</strong><br>
                            <small class="text-muted">DNI: ${alumno.dni} | ${alumno.ano}° "${alumno.division}"</small>
                        </td>
                        <td>${alumno.dni}</td>
                        <td>
                            <select class="form-select form-select-sm input-grupo-sanguineo">
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
                            <input type="date" class="form-control form-control-sm" value="${alumno.fecha_nacimiento || ''}">
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
            <div class="card mb-3 p-3 bg-white border">
                <h6 class="text-primary fw-bold mb-3">Docente Acompañante #${i}</h6>
                <div class="row">
                    <div class="col-md-3 mb-3">
                        <label class="form-label fw-bold">DNI</label>
                        <input type="text" class="form-control input-docente" placeholder="Sin puntos" required>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label class="form-label fw-bold">Apellido/s</label>
                        <input type="text" class="form-control input-docente" placeholder="Apellidos" required>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label class="form-label fw-bold">Nombres</label>
                        <input type="text" class="form-control input-docente" placeholder="Nombres" required>
                    </div>
                    <div class="col-md-3 mb-3">
                        <label class="form-label fw-bold">Teléfono</label>
                        <input type="tel" class="form-control input-docente" placeholder="Cod. área + nro" required>
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
// LÓGICA DEL PASO 4: TRANSPORTE Y VALIDACIÓN DE FECHAS DE VALIDEZ
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

formTransporte.addEventListener('submit', function(e) {
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
        alert("🎉 ¡Excelente! La salida educativa ha sido validada y registrada exitosamente bajo los requerimientos de la Resolución Ministerial N°59/2026.");
        location.reload(); 
    } else {
        formTransporte.classList.add('was-validated');
        alert("⚠️ Por favor, completa toda la documentación requerida del transporte o marca la casilla 'Sin transporte'.");
    }
});