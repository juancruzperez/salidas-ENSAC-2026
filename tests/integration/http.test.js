const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.TEST_BASE_URL;
const BYPASS = process.env.TEST_VERCEL_BYPASS;

const USERS = {
    docente: {
        username: process.env.TEST_DOCENTE_USERNAME,
        password: process.env.TEST_DOCENTE_PASSWORD
    },

    secretaria: {
        username: process.env.TEST_SECRETARIA_USERNAME,
        password: process.env.TEST_SECRETARIA_PASSWORD
    },

    direccion: {
        username: process.env.TEST_DIRECCION_USERNAME,
        password: process.env.TEST_DIRECCION_PASSWORD
    },

    admin: {
        username: process.env.TEST_ADMIN_USERNAME,
        password: process.env.TEST_ADMIN_PASSWORD
    }
};
if (!USERS.docente.username || !USERS.docente.password) {
    throw new Error(
        'Faltan TEST_DOCENTE_USERNAME o TEST_DOCENTE_PASSWORD.'
    );
}

if (!USERS.secretaria.username || !USERS.secretaria.password) {
    throw new Error(
        'Faltan TEST_SECRETARIA_USERNAME o TEST_SECRETARIA_PASSWORD.'
    );
}

if (!USERS.direccion.username || !USERS.direccion.password) {
    throw new Error(
        'Faltan TEST_DIRECCION_USERNAME o TEST_DIRECCION_PASSWORD.'
    );
}

if (!USERS.admin.username || !USERS.admin.password) {
    throw new Error(
        'Faltan TEST_ADMIN_USERNAME o TEST_ADMIN_PASSWORD.'
    );
}
if (!BASE_URL) {
    throw new Error('Falta TEST_BASE_URL.');
}

if (!BYPASS) {
    throw new Error('Falta TEST_VERCEL_BYPASS.');
}

if (!USERS.docente.username || !USERS.docente.password) {
    throw new Error(
        'Faltan TEST_DOCENTE_USERNAME o TEST_DOCENTE_PASSWORD.'
    );
}

if (!USERS.direccion.username || !USERS.direccion.password) {
    throw new Error(
        'Faltan TEST_DIRECCION_USERNAME o TEST_DIRECCION_PASSWORD.'
    );
}

function buildHeaders(extra = {}) {
    return {
        'Content-Type': 'application/json',
        Origin: new URL(BASE_URL).origin,
        'x-vercel-protection-bypass': BYPASS,
        ...extra
    };
}

async function request(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: buildHeaders(options.headers)
    });

    let body = null;

    try {
        body = await response.json();
    } catch {
        body = null;
    }

    return {
        response,
        body,
        status: response.status
    };
}

async function login(username, password) {
    const result = await request('/api/login', {
        method: 'POST',
        body: JSON.stringify({
            username,
            password
        })
    });

    const setCookie = result.response.headers.get('set-cookie');

    return {
        ...result,
        cookie: setCookie
            ? setCookie.split(';')[0]
            : null
    };
}

async function docentes(cookie, payload) {
    return request('/api/docentes', {
        method: 'POST',
        headers: {
            Cookie: cookie
        },
        body: JSON.stringify(payload)
    });
}

/*
 * ---------------------------------------------------------------------------
 * 01 - SESIÓN
 * ---------------------------------------------------------------------------
 */

test('01 - session sin autenticación', async () => {
    const result = await request('/api/session');

    assert.equal(result.status, 401);
    assert.equal(result.body.authenticated, false);
});

/*
 * ---------------------------------------------------------------------------
 * 02 - AUTENTICACIÓN / DOCENTES
 * ---------------------------------------------------------------------------
 */

test('02 - docentes rechaza petición sin sesión', async () => {
    const result = await request('/api/docentes', {
        method: 'POST',
        body: JSON.stringify({
            action: 'find',
            dni: '999999999'
        })
    });

    assert.equal(result.status, 401);
    assert.equal(result.body.error, 'No autenticado.');
});

/*
 * ---------------------------------------------------------------------------
 * 03 - VALIDACIÓN DE OPERACIÓN
 * ---------------------------------------------------------------------------
 */

test('03 - action inválida', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await docentes(loginResult.cookie, {
        action: 'invalid',
        dni: '999999999'
    });

    assert.equal(result.status, 400);
    assert.match(result.body.error, /operación inválida/i);
});

/*
 * ---------------------------------------------------------------------------
 * 04 - VALIDACIÓN DNI
 * ---------------------------------------------------------------------------
 */

test('04 - DNI obligatorio', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await docentes(loginResult.cookie, {
        action: 'find'
    });

    assert.equal(result.status, 400);
    assert.match(result.body.error, /DNI/i);
});

/*
 * ---------------------------------------------------------------------------
 * 05 - FIND
 * ---------------------------------------------------------------------------
 */

test('05 - docente puede consultar DNI inexistente', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await docentes(loginResult.cookie, {
        action: 'find',
        dni: '999999999'
    });

    /*
     * Este test depende de que la tabla docentes exista
     * en la base de datos utilizada por el Preview.
     */
    assert.equal(result.status, 200);
    assert.equal(result.body.found, false);
    assert.equal(result.body.docente, null);
});

/*
 * ---------------------------------------------------------------------------
 * 06 - NORMALIZACIÓN DNI
 * ---------------------------------------------------------------------------
 */

test('06 - DNI se normaliza antes de consultar', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await docentes(loginResult.cookie, {
        action: 'find',
        dni: '99.999.999'
    });

    /*
     * Si la tabla docentes no existe en el Preview,
     * este caso fallará con 500 por infraestructura.
     */
    assert.equal(result.status, 200);
    assert.equal(result.body.found, false);
    assert.equal(result.body.docente, null);
});

/*
 * ---------------------------------------------------------------------------
 * 07 - CREATE / VALIDACIÓN
 * ---------------------------------------------------------------------------
 */

test('07 - create requiere apellido', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await docentes(loginResult.cookie, {
        action: 'create',
        dni: '999999998',
        nombre: 'Test',
        modifiedByEmail: 'test@example.com'
    });

    assert.equal(result.status, 400);
    assert.match(result.body.error, /Apellido/i);
});

/*
 * ---------------------------------------------------------------------------
 * 08 - CREATE / VALIDACIÓN
 * ---------------------------------------------------------------------------
 */

test('08 - create requiere nombre', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await docentes(loginResult.cookie, {
        action: 'create',
        dni: '999999997',
        apellido: 'Test',
        modifiedByEmail: 'test@example.com'
    });

    assert.equal(result.status, 400);
    assert.match(result.body.error, /nombre/i);
});

/*
 * ---------------------------------------------------------------------------
 * 09 - CREATE / TRAZABILIDAD
 * ---------------------------------------------------------------------------
 */

test('09 - create requiere email de trazabilidad', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await docentes(loginResult.cookie, {
        action: 'create',
        dni: '999999996',
        apellido: 'Test',
        nombre: 'Docente'
    });

    assert.equal(result.status, 400);
    assert.match(result.body.error, /email/i);
});

/*
 * ---------------------------------------------------------------------------
 * 10 - AUTORIZACIÓN / DIRECCIÓN READ
 * ---------------------------------------------------------------------------
 */

test('10 - dirección puede consultar docentes', async () => {
    const loginResult = await login(
        USERS.direccion.username,
        USERS.direccion.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await docentes(loginResult.cookie, {
        action: 'find',
        dni: '999999999'
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.found, false);
});

/*
 * ---------------------------------------------------------------------------
 * 11 - AUTORIZACIÓN / DIRECCIÓN CREATE
 * ---------------------------------------------------------------------------
 */

test('11 - dirección no puede crear docentes', async () => {
    const loginResult = await login(
        USERS.direccion.username,
        USERS.direccion.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await docentes(loginResult.cookie, {
        action: 'create',
        dni: '999999995',
        apellido: 'Test',
        nombre: 'Dirección',
        modifiedByEmail: 'test@example.com'
    });

    assert.equal(result.status, 403);
});

/*
 * ---------------------------------------------------------------------------
 * 12 - AUTORIZACIÓN / DIRECCIÓN UPDATE
 * ---------------------------------------------------------------------------
 */

test('12 - dirección no puede modificar docentes', async () => {
    const loginResult = await login(
        USERS.direccion.username,
        USERS.direccion.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await docentes(loginResult.cookie, {
        action: 'update',
        dni: '999999999',
        apellido: 'Test',
        nombre: 'Dirección',
        modifiedByEmail: 'test@example.com'
    });

    assert.equal(result.status, 403);
});

/*
 * ---------------------------------------------------------------------------
 * 13 - LOGIN / USUARIO INEXISTENTE
 * ---------------------------------------------------------------------------
 */

test('13 - login usuario inexistente', async () => {
    const result = await login(
        `__test_usuario_inexistente_${Date.now()}__`,
        'password-invalida'
    );

    assert.equal(result.status, 401);
    assert.match(result.body.error, /incorrectos/i);
});

/*
 * ---------------------------------------------------------------------------
 * 14 - LOGIN / PASSWORD INCORRECTA
 * ---------------------------------------------------------------------------
 */

test('14 - login contraseña incorrecta', async () => {
    const result = await login(
        USERS.docente.username,
        '__password_incorrecta__'
    );

    assert.equal(result.status, 401);
    assert.match(result.body.error, /incorrectos/i);
});

/*
 * ---------------------------------------------------------------------------
 * 15 - LOGIN / DOCENTE
 * ---------------------------------------------------------------------------
 */

test('15 - login docente válido', async () => {
    const result = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.user.role, 'docente');
    assert.ok(result.cookie);
    assert.match(result.cookie, /^session=/);
});

/*
 * ---------------------------------------------------------------------------
 * 16 - LOGIN / DIRECCIÓN
 * ---------------------------------------------------------------------------
 */

test('16 - login dirección válido', async () => {
    const result = await login(
        USERS.direccion.username,
        USERS.direccion.password
    );

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(result.body.user.role, 'direccion');
    assert.ok(result.cookie);
    assert.match(result.cookie, /^session=/);
});
/*
 * ---------------------------------------------------------------------------
 * 17 - AUTORIZACIÓN / SALIDAS SIN SESIÓN
 * ---------------------------------------------------------------------------
 */

test('17 - salidas rechaza petición sin sesión', async () => {
    const result = await request('/api/salidas');

    assert.equal(result.status, 401);
    assert.equal(result.body.error, 'No autenticado.');
});

/*
 * ---------------------------------------------------------------------------
 * 18 - AUTORIZACIÓN / DOCENTE
 * ---------------------------------------------------------------------------
 */

test('18 - docente no puede consultar salidas', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/salidas', {
        headers: {
            Cookie: loginResult.cookie
        }
    });

    assert.equal(result.status, 403);
    assert.equal(
        result.body.error,
        'No tiene permisos para realizar esta operación.'
    );
});

/*
 * ---------------------------------------------------------------------------
 * 19 - AUTORIZACIÓN / DIRECCIÓN
 * ---------------------------------------------------------------------------
 */

test('19 - dirección puede consultar salidas', async () => {
    const loginResult = await login(
        USERS.direccion.username,
        USERS.direccion.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/salidas', {
        headers: {
            Cookie: loginResult.cookie
        }
    });

    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.body));
});

/*
 * ---------------------------------------------------------------------------
 * 20 - MÉTODO HTTP
 * ---------------------------------------------------------------------------
 */

test('20 - salidas rechaza métodos distintos de GET', async () => {
    const result = await request('/api/salidas', {
        method: 'POST'
    });

    assert.equal(result.status, 405);
    assert.equal(result.body.error, 'Método no permitido');
});
/*
 * ---------------------------------------------------------------------------
 * 21 - AUTORIZACIÓN / ESTUDIANTES SIN SESIÓN
 * ---------------------------------------------------------------------------
 */

test('21 - estudiantes rechaza petición sin sesión', async () => {
    const result = await request('/api/estudiantes');

    assert.equal(result.status, 401);
    assert.equal(result.body.error, 'No autenticado.');
});

/*
 * ---------------------------------------------------------------------------
 * 22 - AUTORIZACIÓN / ESTUDIANTES DOCENTE
 * ---------------------------------------------------------------------------
 */

test('22 - docente puede consultar estudiantes', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/estudiantes', {
        headers: {
            Cookie: loginResult.cookie
        }
    });

    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.body));
});

/*
 * ---------------------------------------------------------------------------
 * 23 - AUTORIZACIÓN / ESTUDIANTES SECRETARÍA
 * ---------------------------------------------------------------------------
 */

test('23 - secretaria puede consultar estudiantes', async () => {
    const loginResult = await login(
        USERS.secretaria.username,
        USERS.secretaria.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/estudiantes', {
        headers: {
            Cookie: loginResult.cookie
        }
    });

    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.body));
});

/*
 * ---------------------------------------------------------------------------
 * 24 - AUTORIZACIÓN / ESTUDIANTES DIRECCIÓN
 * ---------------------------------------------------------------------------
 */

test('24 - dirección puede consultar estudiantes', async () => {
    const loginResult = await login(
        USERS.direccion.username,
        USERS.direccion.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/estudiantes', {
        headers: {
            Cookie: loginResult.cookie
        }
    });

    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.body));
});

/*
 * ---------------------------------------------------------------------------
 * 25 - AUTORIZACIÓN / ESTUDIANTES ADMIN
 * ---------------------------------------------------------------------------
 */

test('25 - admin puede consultar estudiantes', async () => {
    const loginResult = await login(
        USERS.admin.username,
        USERS.admin.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/estudiantes', {
        headers: {
            Cookie: loginResult.cookie
        }
    });

    assert.equal(result.status, 200);
    assert.ok(Array.isArray(result.body));
});

/*
 * ---------------------------------------------------------------------------
 * 26 - MÉTODO HTTP / ESTUDIANTES
 * ---------------------------------------------------------------------------
 */

test('26 - estudiantes rechaza POST', async () => {
    const result = await request('/api/estudiantes', {
        method: 'POST'
    });

    assert.equal(result.status, 405);
});

/*
 * ---------------------------------------------------------------------------
 * 27 - AUTORIZACIÓN / ACTUALIZAR ESTUDIANTES DOCENTE
 * ---------------------------------------------------------------------------
 */

test('27 - docente no puede actualizar estudiantes', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/actualizar-estudiantes', {
        method: 'POST',
        headers: {
            Cookie: loginResult.cookie
        },
        body: JSON.stringify({
            estudiantes: []
        })
    });

    assert.equal(result.status, 403);
});

/*
 * ---------------------------------------------------------------------------
 * 28 - AUTORIZACIÓN / ACTUALIZAR ESTUDIANTES DIRECCIÓN
 * ---------------------------------------------------------------------------
 */

test('28 - dirección no puede actualizar estudiantes', async () => {
    const loginResult = await login(
        USERS.direccion.username,
        USERS.direccion.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/actualizar-estudiantes', {
        method: 'POST',
        headers: {
            Cookie: loginResult.cookie
        },
        body: JSON.stringify({
            estudiantes: []
        })
    });

    assert.equal(result.status, 403);
});

test('29 - actualizar estudiantes rechaza petición sin sesión', async () => {
    const result = await request('/api/actualizar-estudiantes', {
        method: 'POST',
        body: JSON.stringify({
            estudiantes: []
        })
    });

    assert.equal(result.status, 401);
    assert.equal(result.body.error, 'No autenticado.');
});

test('30 - secretaria puede actualizar estudiantes', async () => {
    const loginResult = await login(
        USERS.secretaria.username,
        USERS.secretaria.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/actualizar-estudiantes', {
        method: 'POST',
        headers: {
            Cookie: loginResult.cookie
        },
        body: JSON.stringify({
            estudiantes: []
        })
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
});

test('31 - admin puede actualizar estudiantes', async () => {
    const loginResult = await login(
        USERS.admin.username,
        USERS.admin.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/actualizar-estudiantes', {
        method: 'POST',
        headers: {
            Cookie: loginResult.cookie
        },
        body: JSON.stringify({
            estudiantes: []
        })
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
});

test('32 - actualizar estudiantes rechaza GET', async () => {
    const result = await request('/api/actualizar-estudiantes', {
        method: 'GET'
    });

    assert.equal(result.status, 405);
});

/*
 * ---------------------------------------------------------------------------
 * 33 - AUTORIZACIÓN / GUARDAR SALIDA SIN SESIÓN
 * ---------------------------------------------------------------------------
 */

test('33 - guardar salida rechaza petición sin sesión', async () => {
    const result = await request('/api/guardar-salida', {
        method: 'POST',
        body: JSON.stringify({})
    });

    assert.equal(result.status, 401);
    assert.equal(result.body.error, 'No autenticado.');
});

/*
 * ---------------------------------------------------------------------------
 * 34 - MÉTODO HTTP / GUARDAR SALIDA
 * ---------------------------------------------------------------------------
 */

test('34 - guardar salida rechaza métodos distintos de POST', async () => {
    const result = await request('/api/guardar-salida', {
        method: 'GET'
    });

    assert.equal(result.status, 405);
});

/*
 * ---------------------------------------------------------------------------
 * 35 - FLUJO FUNCIONAL / GUARDAR SALIDA
 * ---------------------------------------------------------------------------
 */

test('35 - docente puede crear una salida', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const runId = `${Date.now()}${process.pid}`;

    const result = await request('/api/guardar-salida', {
        method: 'POST',
        headers: {
            Cookie: loginResult.cookie
        },
        body: JSON.stringify({
            destinoFinal: `TEST - Destino ${runId}`,
            lugarSalida: 'ENSAC',
            lugarRegreso: 'ENSAC',
            cantEstudiantes: 10,
            cantAcompanantes: 2,
            fechaSalida: '2099-12-01',
            horaSalida: '08:00',
            fechaRegreso: '2099-12-01',
            horaRegreso: '18:00',
            sinPernocte: true,
            nombreAlojamiento: '',
            docenteOrganizador: 'DOCENTE TEST',
            emailDocente: process.env.TEST_EMAIL_TO
        })
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.ok(result.body.idSalida);
});
/*
 * ---------------------------------------------------------------------------
 * 36 - LOGOUT / INVALIDACIÓN DE SESIÓN
 * ---------------------------------------------------------------------------
 */

test('36 - logout invalida la sesión', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const beforeLogout = await request('/api/session', {
        headers: {
            Cookie: loginResult.cookie
        }
    });

    assert.equal(beforeLogout.status, 200);
    assert.equal(beforeLogout.body.authenticated, true);

    const logoutResult = await request('/api/logout', {
        method: 'POST',
        headers: {
            Cookie: loginResult.cookie
        }
    });

    assert.equal(logoutResult.status, 200);
    assert.equal(logoutResult.body.success, true);

    const afterLogout = await request('/api/session', {
        headers: {
            Cookie: loginResult.cookie
        }
    });

    assert.equal(afterLogout.status, 401);
    assert.equal(afterLogout.body.authenticated, false);
});

/*
 * ---------------------------------------------------------------------------
 * 37 - LOGOUT / SIN SESIÓN
 * ---------------------------------------------------------------------------
 */

test('37 - logout sin sesión sigue siendo exitoso', async () => {
    const result = await request('/api/logout', {
        method: 'POST'
    });

    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
});

/*
 * ---------------------------------------------------------------------------
 * 38 - LOGOUT / MÉTODO HTTP
 * ---------------------------------------------------------------------------
 */

test('38 - logout rechaza métodos distintos de POST', async () => {
    const result = await request('/api/logout', {
        method: 'GET'
    });

    assert.equal(result.status, 405);
    assert.equal(result.body.error, 'Método no permitido.');
});

/*
 * ---------------------------------------------------------------------------
 * 39 - CSRF / GUARDAR SALIDA SIN ORIGIN
 * ---------------------------------------------------------------------------
 */

test('39 - guardar salida rechaza petición sin Origin', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/guardar-salida', {
        method: 'POST',
        headers: {
            Cookie: loginResult.cookie,
            Origin: undefined
        },
        body: JSON.stringify({})
    });

    assert.equal(result.status, 403);
    assert.equal(result.body.error, 'Origen no permitido.');
});

/*
 * ---------------------------------------------------------------------------
 * 40 - CSRF / GUARDAR SALIDA ORIGIN EXTERNO
 * ---------------------------------------------------------------------------
 */

test('40 - guardar salida rechaza Origin externo', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/guardar-salida', {
        method: 'POST',
        headers: {
            Cookie: loginResult.cookie,
            Origin: 'https://evil.example.com'
        },
        body: JSON.stringify({})
    });

    assert.equal(result.status, 403);
    assert.equal(result.body.error, 'Origen no permitido.');
});

/*
 * ---------------------------------------------------------------------------
 * 41 - CSRF / GUARDAR SALIDA ORIGIN VÁLIDO
 * ---------------------------------------------------------------------------
 */

test('41 - guardar salida acepta Origin válido', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/guardar-salida', {
        method: 'POST',
        headers: {
            Cookie: loginResult.cookie,
            Origin: new URL(BASE_URL).origin
        },
        body: JSON.stringify({})
    });

    assert.notEqual(result.status, 403);
});

/*
 * ---------------------------------------------------------------------------
 * 42 - CSRF / LOGOUT ORIGIN EXTERNO
 * ---------------------------------------------------------------------------
 */

test('42 - logout rechaza Origin externo', async () => {
    const loginResult = await login(
        USERS.docente.username,
        USERS.docente.password
    );

    assert.equal(loginResult.status, 200);
    assert.ok(loginResult.cookie);

    const result = await request('/api/logout', {
        method: 'POST',
        headers: {
            Cookie: loginResult.cookie,
            Origin: 'https://evil.example.com'
        }
    });

    assert.equal(result.status, 403);
    assert.equal(result.body.error, 'Origen no permitido.');
});