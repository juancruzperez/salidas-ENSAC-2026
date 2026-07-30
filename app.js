// ==========================================
// LÓGICA DE AUTENTICACIÓN, ROLES Y VISTAS ADMIN
// ==========================================
const seccionLogin = document.getElementById('seccionLogin');
const contenedorPrincipal = document.getElementById('contenedorPrincipal');
const vistaInformeEjecutivo = document.getElementById('vistaInformeEjecutivo');
const adminNavContainer = document.getElementById('adminNavContainer');
const adminNavContainerCarga = document.getElementById('adminNavContainerCarga');

const formLogin = document.getElementById('formLogin');
const loginUser = document.getElementById('loginUser');
const loginPass = document.getElementById('loginPass');
const alertaLogin = document.getElementById('alertaLogin');
const spanUsuarioRol = document.getElementById('spanUsuarioRol');
const spanRolEjecutivo = document.getElementById('spanRolEjecutivo');
const tablaResumenesEjecutivos = document.getElementById('tablaResumenesEjecutivos');

let usuarioActual = null;

if (formLogin) {
    formLogin.addEventListener('submit', async function(e) {
        e.preventDefault();
        alertaLogin.classList.add('d-none');

        try {
            const respuesta = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: loginUser.value.trim(),
                    password: loginPass.value.trim()
                })
            });

            const data = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(data.error || 'Credenciales inválidas');
            }

            usuarioActual = data.user;
            localStorage.setItem('usuarioSesion', JSON.stringify(usuarioActual));
            controlarPermisos(usuarioActual);

        } catch (error) {
            alertaLogin.textContent = error.message;
            alertaLogin.classList.remove('d-none');
        }
    });
}

function controlarPermisos(user) {
    if (seccionLogin) seccionLogin.classList.add('d-none');

    if (user.role === 'secretaria' || user.role === 'direccion') {
        if (vistaInformeEjecutivo) vistaInformeEjecutivo.classList.remove('d-none');
        if (spanRolEjecutivo) spanRolEjecutivo.textContent = user.role.toUpperCase();
        cargarInformeEjecutivo();
    } else if (user.role === 'admin') {
        if (adminNavContainerCarga) adminNavContainerCarga.classList.remove('d-none');
        if (contenedorPrincipal) contenedorPrincipal.classList.remove('d-none');
        if (spanUsuarioRol) spanUsuarioRol.textContent = `${user.username.toUpperCase()} (ADMIN)`;
    } else {
        if (contenedorPrincipal) contenedorPrincipal.classList.remove('d-none');
        if (spanUsuarioRol) spanUsuarioRol.textContent = `${user.username.toUpperCase()} (DOCENTE)`;
    }
}

function cambiarVistaAdmin(vista) {
    if (vista === 'informe') {
        if (contenedorPrincipal) contenedorPrincipal.classList.add('d-none');
        if (vistaInformeEjecutivo) vistaInformeEjecutivo.classList.remove('d-none');
        if (spanRolEjecutivo) spanRolEjecutivo.textContent = "ADMINISTRADOR (VISTA INFORME)";
        if (adminNavContainer) adminNavContainer.classList.remove('d-none');
        cargarInformeEjecutivo();
    } else {
        if (vistaInformeEjecutivo) vistaInformeEjecutivo.classList.add('d-none');
        if (contenedorPrincipal) contenedorPrincipal.classList.remove('d-none');
        if (adminNavContainerCarga) adminNavContainerCarga.classList.remove('d-none');
    }
}

async function cargarInformeEjecutivo() {
    if (!tablaResumenesEjecutivos) return;
    tablaResumenesEjecutivos.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Cargando salidas registradas...</td></tr>';
    try {
        const respuesta = await fetch('/api/salidas');
        const salidas = await respuesta.json();

        tablaResumenesEjecutivos.innerHTML = '';
        if (salidas.length > 0) {
            salidas.forEach((s) => {
                const modalidad = s.es_pernocte ? 'CON PERNOCTE' : 'SIN PERNOCTE';
                const fila = `
                    <tr>
                        <td>#${s.id}</td>
                        <td><strong>${s.docente_organizador || 'No especificado'}</strong></td>
                        <td><strong>${s.destino}</strong></td>
                        <td>${s.fecha_salida ? s.fecha_salida.split('T')[0] : '-'} (${s.hora_salida})</td>
                        <td>${s.fecha_regreso ? s.fecha_regreso.split('T')[0] : '-'} (${s.hora_regreso})</td>
                        <td><span class="badge bg-info text-dark">${modalidad}</span></td>
                        <td>${s.cant_estudiantes}</td>
                        <td>${s.cant_acompanantes}</td>
                        <td><span class="badge bg-success">${s.estado}</span></td>
                    </tr>
                `;
                tablaResumenesEjecutivos.innerHTML += fila;
            });
        } else {
            tablaResumenesEjecutivos.innerHTML = '<tr><td colspan="9" class="text-center text-muted">No hay salidas registradas actualmente.</td></tr>';
        }
    } catch (error) {
        console.error("Error al cargar informe:", error);
        tablaResumenesEjecutivos.innerHTML = '<tr><td colspan="9" class="text-center text-danger">Error al conectar con la base de datos.</td></tr>';
    }
}

function cerrarSesion() {
    localStorage.removeItem('usuarioSesion');
    location.reload();
}

window.addEventListener('DOMContentLoaded', () => {
    const sesionGuardada = localStorage.getItem('usuarioSesion');
    if (sesionGuardada) {
        usuarioActual = JSON.parse(sesionGuardada);
        controlarPermisos(usuarioActual);
    }
});

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

const checkboxSalidaLocal = document.getElementById('salidaLocal');
const camposDestinoExtra = document.getElementById('camposDestinoExtra');
const inputsDestinoExtra = document.querySelectorAll('.input-destino-extra');

function manejarSalidaLocal() {
    if (checkboxSalidaLocal && checkboxSalidaLocal.checked) {
        if (camposDestinoExtra) camposDestinoExtra.classList.add('d-none');
        inputsDestinoExtra.forEach(input => {
            input.required = false;
            input.value = '';
        });
    } else {
        if (camposDestinoExtra) camposDestinoExtra.classList.remove('d-none');
        inputsDestinoExtra.forEach(input => {
            input.required = true;
        });
    }
}
if (checkboxSalidaLocal) {
    checkboxSalidaLocal.addEventListener('change', manejarSalidaLocal);
    manejarSalidaLocal();
}

function validarCantidades() {
    const numEstudiantes = parseInt(cantEstudiantes.value) || 0;
    const numAcompanantes = parseInt(cantAcompanantes.value) || 0;

    if (numEstudiantes > 0) {
        const minimoAcompanantes = Math.ceil(numEstudiantes / 10);
        if (cantAcompanantes) cantAcompanantes.min = minimoAcompanantes;

        if (numAcompanantes > 0 && numAcompanantes < minimoAcompanantes) {
            if (alertaAcompanantes) {
                alertaAcompanantes.textContent = `Mínimo requerido: ${minimoAcompanantes} (1 cada 10 estudiantes).`;
                alertaAcompanantes.classList.remove('d-none');
            }
        } else {
            if (alertaAcompanantes) alertaAcompanantes.classList.add('d-none');
        }
    } else {
        if (cantAcompanantes) cantAcompanantes.min = 1;
        if (alertaAcompanantes) alertaAcompanantes.classList.add('d-none');
    }
    validarEstudiantes();
    generarCamposDocentes();
}

if (formGestion) {
    formGestion.addEventListener('input', validarCantidades);
    formGestion.addEventListener('change', validarCantidades);
}

function manejarPernocte() {
    if (checkboxSinPernocte && checkboxSinPernocte.checked) {
        if (inputFechaRegreso) {
            inputFechaRegreso.value = inputFechaSalida.value;
            inputFechaRegreso.readOnly = true;
            inputFechaRegreso.classList.add('bg-light', 'text-muted');
        }
        if (seccionAlojamiento) seccionAlojamiento.style.display = 'none';
        inputsAlojamiento.forEach(input => { input.required = false; input.value = ''; });
    } else {
        if (inputFechaRegreso) {
            inputFechaRegreso.readOnly = false;
            inputFechaRegreso.classList.remove('bg-light', 'text-muted');
        }
        if (seccionAlojamiento) seccionAlojamiento.style.display = 'block';
        inputsAlojamiento.forEach(input => input.required = true);
    }
    if (inputFechaSalida && inputFechaSalida.value && inputFechaRegreso) {
        inputFechaRegreso.min = inputFechaSalida.value;
    }
}

if (checkboxSinPernocte) {
    checkboxSinPernocte.addEventListener('change', manejarPernocte);
    if (inputFechaSalida) {
        inputFechaSalida.addEventListener('change', function() {
            manejarPernocte();
        });
    }
    manejarPernocte();
}

if (btnSiguienteEstudiantes) {
    btnSiguienteEstudiantes.addEventListener('click', function() {
        const fSalida = inputFechaSalida ? inputFechaSalida.value : '';
        const fRegreso = inputFechaRegreso ? inputFechaRegreso.value : '';
        const hSalida = inputHoraSalida ? inputHoraSalida.value : '';
        const hRegreso = inputHoraRegreso ? inputHoraRegreso.value : '';

        if (fSalida && fRegreso) {
            if (checkboxSinPernocte && !checkboxSinPernocte.checked && fRegreso < fSalida) {
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

        if (formGestion && !formGestion.checkValidity()) {
            formGestion.classList.add('was-validated');
            alert("⚠️ Por favor, completa todos los campos obligatorios en el Paso 1.");
        } else {
            if (formGestion) formGestion.classList.remove('was-validated');
            if (seccion2) {
                seccion2.classList.remove('d-none');
                seccion2.scrollIntoView();
            }
        }
    });
}

// ------------------------------------------------------------
// LÓGICA DEL PASO 2: ESTUDIANTES 
// ------------------------------------------------------------
let contadorCursos = 0;
const contenedorSeccionesCursos = document.getElementById('contenedorSeccionesCursos');
const checkAgregarOtroCurso = document.getElementById('checkAgregarOtroCurso');
const textoContadorEstudiantes = document.getElementById('textoContadorEstudiantes');
const btnSiguienteDocentes = document.getElementById('btnSiguienteDocentes');

function validarEstudiantes() {
    const declarados = parseInt(cantEstudiantes ? cantEstudiantes.value : 0) || 0;
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

        if (seccion3) {
            seccion3.classList.remove('d-none');
            seccion3.scrollIntoView();
        }
        generarCamposDocentes();
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

// ------------------------------------------------------------
// LÓGICA DEL PASO 3: DOCENTES (ORGANIZADORES Y ACOMPAÑANTES)
// ------------------------------------------------------------
const formDocentes = document.getElementById('formDocentes');
const contenedorDocentesForm = document.getElementById('contenedorDocentesForm');
const btnSiguienteTransporte = document.getElementById('btnSiguienteTransporte');

let cantidadOrganizadoresActual = 1;

function generarCamposDocentes() {
    const cantTotalDeclarada = parseInt(cantAcompanantes ? cantAcompanantes.value : 0) || 0;
    if (!contenedorDocentesForm) return;
    contenedorDocentesForm.innerHTML = '';

    if (cantTotalDeclarada <= 0) {
        contenedorDocentesForm.innerHTML = '<p class="text-danger">Por favor, declare primero la cantidad total de acompañantes en el Paso 1.</p>';
        if (btnSiguienteTransporte) btnSiguienteTransporte.setAttribute('disabled', 'true');
        return;
    }

    if (cantidadOrganizadoresActual > cantTotalDeclarada) {
        cantidadOrganizadoresActual = cantTotalDeclarada;
    }
    if (cantidadOrganizadoresActual < 1) {
        cantidadOrganizadoresActual = 1;
    }

    const cantAcompanantesRegulares = cantTotalDeclarada - cantidadOrganizadoresActual;

    let htmlSeccionDocentes = `
        <div class="mb-4">
            <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                <h5 class="text-primary fw-bold mb-0">Docente/s Organizador/es</h5>
                ${cantidadOrganizadoresActual < cantTotalDeclarada ? `
                    <button type="button" class="btn btn-sm btn-outline-primary" onclick="cambiarOrganizadores(1)">
                        ➕ Agregar otro organizador
                    </button>` : ''}
            </div>
            <div id="contenedorOrganizadores"></div>
        </div>
        <div class="mb-3">
            <h5 class="text-secondary fw-bold border-bottom pb-2 mb-3">Docentes Acompañantes (${cantAcompanantesRegulares})</h5>
            <div id="contenedorAcompanantes">
                ${cantAcompanantesRegulares === 0 ? '<p class="text-muted fst-italic">No hay docentes acompañantes adicionales (todos los cupos declarados están cubiertos por los organizadores).</p>' : ''}
            </div>
        </div>
    `;

    contenedorDocentesForm.innerHTML = htmlSeccionDocentes;

    const contenedorOrg = document.getElementById('contenedorOrganizadores');
    for (let i = 1; i <= cantidadOrganizadoresActual; i++) {
        if (contenedorOrg) contenedorOrg.innerHTML += crearCardDocente(`Docente Organizador #${i}`, 'organizador', i > 1);
    }

    const contenedorAcomp = document.getElementById('contenedorAcompanantes');
    for (let i = 1; i <= cantAcompanantesRegulares; i++) {
        if (contenedorAcomp) contenedorAcomp.innerHTML += crearCardDocente(`Docente Acompañante #${i}`, 'acompanante', false);
    }

    configurarListenersDocentes();
}

function crearCardDocente(titulo, tipo, esRemovible) {
    return `
        <div class="card mb-3 p-3 bg-white border card-docente-item" data-tipo="${tipo}">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h6 class="text-primary fw-bold mb-0">${titulo}</h6>
                ${esRemovible ? `<button type="button" class="btn btn-sm btn-outline-danger" onclick="cambiarOrganizadores(-1)">🗑️ Eliminar</button>` : ''}
            </div>
            <div class="row">
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">DNI</label>
                    <input type="text" class="form-control input-docente input-docente-dni" placeholder="Sin puntos" required>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Apellido/s</label>
                    <input type="text" class="form-control input-docente input-docente-apellido" placeholder="Apellidos" required>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Nombres</label>
                    <input type="text" class="form-control input-docente input-docente-nombre" placeholder="Nombres" required>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Teléfono de Contacto</label>
                    <input type="tel" class="form-control input-docente input-docente-telefono" placeholder="Cod. área + nro" required>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">G. Sanguíneo y RH</label>
                    <select class="form-select form-select-sm input-docente-gs" required>
                        <option value="">- Seleccionar -</option>
                        <option value="A +">A +</option>
                        <option value="A -">A -</option>
                        <option value="B +">B +</option>
                        <option value="B -">B -</option>
                        <option value="AB +">AB +</option>
                        <option value="AB -">AB -</option>
                        <option value="O +">O +</option>
                        <option value="O -">O -</option>
                    </select>
                </div>
                <div class="col-md-4 mb-3">
                    <label class="form-label fw-bold">Tel. Emergencia</label>
                    <input type="tel" class="form-control input-docente input-docente-emergencia" placeholder="Cod. área + nro" required>
                </div>
            </div>
        </div>
    `;
}

function cambiarOrganizadores(delta) {
    const cantTotalDeclarada = parseInt(cantAcompanantes ? cantAcompanantes.value : 0) || 0;
    cantidadOrganizadoresActual += delta;
    if (cantidadOrganizadoresActual < 1) cantidadOrganizadoresActual = 1;
    if (cantidadOrganizadoresActual > cantTotalDeclarada) cantidadOrganizadoresActual = cantTotalDeclarada;
    generarCamposDocentes();
}

function configurarListenersDocentes() {
    const inputsDocentes = document.querySelectorAll('.input-docente, .input-docente-gs');
    inputsDocentes.forEach(input => {
        input.removeEventListener('input', validarDocentes);
        input.removeEventListener('change', validarDocentes);
        input.addEventListener('input', validarDocentes);
        input.addEventListener('change', validarDocentes);
    });
    validarDocentes();
}

function validarDocentes() {
    let todoCompleto = true;
    const inputsDocentes = document.querySelectorAll('.input-docente');
    const selectsGs = document.querySelectorAll('.input-docente-gs');
    
    if (inputsDocentes.length === 0) {
        if (btnSiguienteTransporte) btnSiguienteTransporte.setAttribute('disabled', 'true');
        return;
    }

    inputsDocentes.forEach(input => {
        if (!input.value.trim()) {
            todoCompleto = false;
        }
    });

    selectsGs.forEach(select => {
        if (!select.value) {
            todoCompleto = false;
        }
    });

    if (todoCompleto) {
        if (btnSiguienteTransporte) btnSiguienteTransporte.removeAttribute('disabled');
    } else {
        if (btnSiguienteTransporte) btnSiguienteTransporte.setAttribute('disabled', 'true');
    }
}

if (btnSiguienteTransporte) {
    btnSiguienteTransporte.addEventListener('click', function() {
        if (seccion4) {
            seccion4.classList.remove('d-none');
            seccion4.scrollIntoView();
        }
    });
}

// ------------------------------------------------------------
// LÓGICA DE GENERACIÓN DE UN ÚNICO PDF CONSOLIDADO (3 HOJAS)
// ------------------------------------------------------------
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

function generarPDFUnico() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const destinoFinalFormateado = obtenerDestinoFormateado();
    const fechaSalidaIso = document.getElementById('fechaSalida') ? document.getElementById('fechaSalida').value : '';
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

    const modalidad = checkboxSinPernocte && checkboxSinPernocte.checked ? "SIN PERNOCTE (IDA Y VUELTA EN EL DÍA)" : "CON PERNOCTE";
    
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

    if (checkboxSinPernocte && !checkboxSinPernocte.checked) {
        datosPaso1.push(
            ["Nombre del alojamiento:", (document.getElementById('nombreAlojamiento') ? document.getElementById('nombreAlojamiento').value : '-').toUpperCase()],
            ["Domicilio del alojamiento:", (document.getElementById('domicilioAlojamiento') ? document.getElementById('domicilioAlojamiento').value : '-').toUpperCase()],
            ["Teléfono del alojamiento:", (document.getElementById('telefonoAlojamiento') ? document.getElementById('telefonoAlojamiento').value : '-').toUpperCase()]
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
    // HOJA 3: NÓMINA DE ORGANIZADORES Y ACOMPAÑANTES
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
    if (sinTransporte && sinTransporte.checked) {
        if (camposTransporte) camposTransporte.style.display = 'none';
        inputsTransporte.forEach(input => {
            input.required = false;
            input.value = ''; 
        });
        inputsValidez.forEach(input => {
            input.required = false;
            input.value = '';
            if (input.nextElementSibling) input.nextElementSibling.classList.add('d-none');
        });
    } else {
        if (camposTransporte) camposTransporte.style.display = 'block';
        inputsTransporte.forEach(input => {
            input.required = true;
        });
        inputsValidez.forEach(input => {
            input.required = true;
        });
    }
}

if (sinTransporte) {
    sinTransporte.addEventListener('change', manejarSinTransporte);
}

inputsValidez.forEach(inputValidez => {
    inputValidez.addEventListener('change', function() {
        const fechaViajeStr = inputFechaSalida ? inputFechaSalida.value : '';
        const fechaValidezStr = this.value;
        const alerta = this.nextElementSibling; 

        if (fechaViajeStr && fechaValidezStr && alerta) {
            const fechaViaje = new Date(fechaViajeStr);
            const fechaValidez = new Date(fechaValidezStr);

            if (fechaValidez < fechaViaje) {
                alerta.classList.remove('d-none');
            } else {
                alerta.classList.add('d-none');
            }
        } else if (alerta) {
            alerta.classList.add('d-none');
        }
    });
});

if (formTransporte) {
    formTransporte.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        let hayDocumentosVencidos = false;
        if (sinTransporte && !sinTransporte.checked) {
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
            const textoOriginal = btnSubmit ? btnSubmit.innerHTML : '';
            
            if (btnSubmit) {
                btnSubmit.innerHTML = "⏳ Guardando datos y generando PDF...";
                btnSubmit.disabled = true;
            }

            try {
                // 1. Guardar datos médicos de estudiantes en base de datos
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

                // 2. Recopilar y concatenar docentes organizadores con espacios
                const cardsOrganizadores = document.querySelectorAll('.card-docente-item[data-tipo="organizador"]');
                let nombresOrganizadoresArr = [];
                cardsOrganizadores.forEach(card => {
                    const apellido = (card.querySelector('.input-docente-apellido')?.value || '').trim();
                    const nombre = (card.querySelector('.input-docente-nombre')?.value || '').trim();
                    if (apellido || nombre) {
                        nombresOrganizadoresArr.push(`${apellido} ${nombre}`.trim());
                    }
                });
                const docenteOrganizadorConcatenado = nombresOrganizadoresArr.join('   ');

                // 3. Registrar la salida educativa en la tabla 'salidas'
                const destinoFinal = obtenerDestinoFormateado();
                const payloadSalida = {
                    destinoFinal,
                    lugarSalida: document.getElementById('lugarSalida') ? document.getElementById('lugarSalida').value.trim() : '',
                    lugarRegreso: document.getElementById('lugarRegreso') ? document.getElementById('lugarRegreso').value.trim() : '',
                    cantEstudiantes: parseInt(document.getElementById('cantEstudiantes') ? document.getElementById('cantEstudiantes').value : 0) || 0,
                    cantAcompanantes: parseInt(document.getElementById('cantAcompanantes') ? document.getElementById('cantAcompanantes').value : 0) || 0,
                    fechaSalida: document.getElementById('fechaSalida') ? document.getElementById('fechaSalida').value : '',
                    horaSalida: document.getElementById('horaSalida') ? document.getElementById('horaSalida').value : '',
                    fechaRegreso: document.getElementById('fechaRegreso') ? document.getElementById('fechaRegreso').value : '',
                    horaRegreso: document.getElementById('horaRegreso') ? document.getElementById('horaRegreso').value : '',
                    sinPernocte: checkboxSinPernocte ? checkboxSinPernocte.checked : false,
                    nombreAlojamiento: document.getElementById('nombreAlojamiento') ? document.getElementById('nombreAlojamiento').value.trim() : '',
                    docenteOrganizador: docenteOrganizadorConcatenado
                };

                await fetch('/api/guardar-salida', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payloadSalida)
                });

                // 4. Generar y descargar PDF consolidado
                generarPDFUnico();

                alert("🎉 ¡Excelente! La salida educativa ha sido registrada en el sistema, la base de datos se actualizó y se descargó el PDF con las 3 hojas completas.");
                location.reload(); 
            } catch(error) {
                console.error("Error al guardar:", error);
                alert("⚠️ Hubo un error al guardar los datos en la base de datos.");
                if (btnSubmit) {
                    btnSubmit.innerHTML = textoOriginal;
                    btnSubmit.disabled = false;
                }
            }

        } else {
            formTransporte.classList.add('was-validated');
            alert("⚠️ Por favor, completa toda la documentación requerida del transporte o marca la casilla 'Sin transporte'.");
        }
    });
}