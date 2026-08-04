// ==========================================
// LÓGICA DEL PASO 2: ESTUDIANTES 
// ==========================================
let contadorCursos = 0;
const contenedorSeccionesCursos = document.getElementById('contenedorSeccionesCursos');
const checkAgregarOtroCurso = document.getElementById('checkAgregarOtroCurso');
const textoContadorEstudiantes = document.getElementById('textoContadorEstudiantes');
const btnSiguienteDocentes = document.getElementById('btnSiguienteDocentes');

function validarEstudiantes() {
    const inputCantEstudiantes = document.getElementById('cantEstudiantes');
    const declarados = parseInt(inputCantEstudiantes ? inputCantEstudiantes.value : 0) || 0;
    const seleccionados = document.querySelectorAll('.check-estudiante:checked').length;

    if (textoContadorEstudiantes) {
        textoContadorEstudiantes.textContent = `${seleccionados} / ${declarados}`;
    }

    if (declarados > 0 && seleccionados === declarados) {
        if (textoContadorEstudiantes) {
            textoContadorEstudiantes.classList.remove('text-danger');
            textoContadorEstudiantes.classList.add('text-success');
        }
        if (btnSiguienteDocentes) btnSiguienteDocentes.removeAttribute('disabled'); 
    } else {
        if (textoContadorEstudiantes) {
            textoContadorEstudiantes.classList.remove('text-success');
            textoContadorEstudiantes.classList.add('text-danger');
        }
        if (btnSiguienteDocentes) btnSiguienteDocentes.setAttribute('disabled', 'true'); 
    }
}

if (btnSiguienteDocentes) {
    btnSiguienteDocentes.addEventListener('click', function() {
        const checkboxesSeleccionados = document.querySelectorAll('.check-estudiante:checked');
        let datosCompletos = true;
        let nombreIncompleto = "";

        checkboxesSeleccionados.forEach(checkbox => {
            const dni = checkbox.value;
            const nombre = checkbox.getAttribute('data-nombre') || 'Estudiante';
            const selectGS = document.querySelector(`.input-grupo-sanguineo[data-dni="${dni}"]`);
            const inputFecha = document.querySelector(`.input-fecha-nacimiento[data-dni="${dni}"]`);

            if (selectGS && inputFecha) {
                if (!selectGS.value.trim() || !inputFecha.value.trim()) {
                    datosCompletos = false;
                    nombreIncompleto = nombre;
                }
            }
        });

        if (!datosCompletos) {
            alert(`⚠️ No se puede avanzar: El/la estudiante "${nombreIncompleto}" seleccionado/s tiene incompleto el Grupo Sanguíneo o la Fecha de Nacimiento.`);
            return;
        }

        const seccion3 = document.getElementById('seccion3-docentes');
        if (seccion3) {
            seccion3.classList.remove('d-none');
            seccion3.scrollIntoView();
        }
        
        // Esta función vive en app.js y se encarga de pintar las tarjetas de los docentes
        if (typeof generarCamposDocentes === 'function') {
            generarCamposDocentes();
        }
    });
}

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
    if (contenedorSeccionesCursos) {
        contenedorSeccionesCursos.insertAdjacentHTML('beforeend', htmlSeccion);
    }
}

async function buscarAlumnosPorCurso(idCurso) {
    const turno = document.getElementById(`filtroTurno_${idCurso}`).value;
    const ano = document.getElementById(`filtroAno_${idCurso}`).value;
    const division = document.getElementById(`filtroDivision_${idCurso}`).value;
    const ciclo = document.getElementById(`filtroCiclo_${idCurso}`).value;

    const cuerpoTabla = document.getElementById(`cuerpoTabla_${idCurso}`);
    const contenedorTabla = document.getElementById(`contenedorTabla_${idCurso}`);
    const mensajeSinResultados = document.getElementById(`mensajeSinResultados_${idCurso}`);

    if (cuerpoTabla) cuerpoTabla.innerHTML = '<tr><td colspan="5" class="text-center">Buscando en la base de datos...</td></tr>';
    if (contenedorTabla) contenedorTabla.classList.remove('d-none');
    if (mensajeSinResultados) mensajeSinResultados.classList.add('d-none');

    try {
        const respuesta = await fetch(`/api/estudiantes?turno=${encodeURIComponent(turno)}&ano=${encodeURIComponent(ano)}&division=${encodeURIComponent(division)}&ciclo=${encodeURIComponent(ciclo)}`);
        
        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status}`);
        }

        const alumnosFiltrados = await respuesta.json();
        if (cuerpoTabla) cuerpoTabla.innerHTML = '';

        if (alumnosFiltrados.length > 0) {
            if (mensajeSinResultados) mensajeSinResultados.classList.add('d-none');
            if (contenedorTabla) contenedorTabla.classList.remove('d-none');

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
                if (cuerpoTabla) cuerpoTabla.innerHTML += fila;
            });
        } else {
            if (contenedorTabla) contenedorTabla.classList.add('d-none');
            if (mensajeSinResultados) mensajeSinResultados.classList.remove('d-none');
        }
    } catch (error) {
        console.error("Error al consultar los estudiantes:", error);
        alert("⚠️ Hubo un error al conectar con la base de datos.");
        if (contenedorTabla) contenedorTabla.classList.add('d-none');
    }

    validarEstudiantes();
}

// Hacemos globales las funciones que el HTML llama con "onclick"
window.buscarAlumnosPorCurso = buscarAlumnosPorCurso;

function seleccionarTodosAlumnos(idCurso) {
    const checkboxes = document.querySelectorAll(`#cuerpoTabla_${idCurso} .check-estudiante`);
    checkboxes.forEach(cb => cb.checked = true);
    validarEstudiantes();
}
window.seleccionarTodosAlumnos = seleccionarTodosAlumnos;

function deseleccionarTodosAlumnos(idCurso) {
    const checkboxes = document.querySelectorAll(`#cuerpoTabla_${idCurso} .check-estudiante`);
    checkboxes.forEach(cb => cb.checked = false);
    validarEstudiantes();
}
window.deseleccionarTodosAlumnos = deseleccionarTodosAlumnos;

function eliminarSeccionCurso(idCurso) {
    const card = document.getElementById(`cursoCard_${idCurso}`);
    if (card) {
        card.remove();
        validarEstudiantes(); 
    }
}
window.eliminarSeccionCurso = eliminarSeccionCurso;

if (checkAgregarOtroCurso) {
    checkAgregarOtroCurso.addEventListener('change', function() {
        if (this.checked) {
            agregarSeccionCurso(); 
            this.checked = false;  
        }
    });
}

if (contenedorSeccionesCursos) {
    agregarSeccionCurso();
    validarEstudiantes();
}