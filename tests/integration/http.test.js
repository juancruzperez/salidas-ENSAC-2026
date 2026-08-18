const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.TEST_BASE_URL;
const BYPASS = process.env.TEST_VERCEL_BYPASS;

const USERS = {
    docente: {
        username: process.env.TEST_DOCENTE_USERNAME,
        password: process.env.TEST_DOCENTE_PASSWORD
    },
    direccion: {
        username: process.env.TEST_DIRECCION_USERNAME,
        password: process.env.TEST_DIRECCION_PASSWORD
    }
};

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