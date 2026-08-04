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