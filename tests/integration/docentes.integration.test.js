const test = require('node:test');
const assert = require('node:assert/strict');
const { sql } = require('@vercel/postgres');

const {
    DNI,
    EMAIL,
    UPDATED_EMAIL,
    DOCENTE,
    DOCENTE_UPDATED
} = require('../helpers/test-fixtures');

const { requestJson } = require('../helpers/http');

const BASE_URL = process.env.TEST_BASE_URL;
const DOCENTE_COOKIE = process.env.TEST_DOCENTE_SESSION_COOKIE;
const DIRECCION_COOKIE = process.env.TEST_DIRECCION_SESSION_COOKIE;

if (!BASE_URL) {
    throw new Error(
        'Falta TEST_BASE_URL.'
    );
}

if (!DOCENTE_COOKIE) {
    throw new Error(
        'Falta TEST_DOCENTE_SESSION_COOKIE.'
    );
}

if (!DIRECCION_COOKIE) {
    throw new Error(
        'Falta TEST_DIRECCION_SESSION_COOKIE.'
    );
}

async function cleanup() {
    await sql`
        DELETE FROM docentes
        WHERE dni = ${DNI}
    `;

    const result = await sql`
        SELECT COUNT(*)::int AS count
        FROM docentes
        WHERE dni = ${DNI}
    `;

    assert.equal(
        result.rows[0].count,
        0,
        'El fixture de prueba no fue eliminado.'
    );
}

test.before(async () => {
    await cleanup();
});

test.after(async () => {
    await cleanup();
});

test('01 - action inválida devuelve 400', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'invalid',
            dni: DNI
        },
        DOCENTE_COOKIE
    );

    assert.equal(result.status, 400);
});

test('02 - DNI ausente devuelve 400', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'find'
        },
        DOCENTE_COOKIE
    );

    assert.equal(result.status, 400);
});

test('03 - find sin sesión devuelve 401', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'find',
            dni: DNI
        }
    );

    assert.equal(result.status, 401);
});

test('04 - create sin sesión devuelve 401', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'create',
            ...DOCENTE,
            emailDocente: EMAIL
        }
    );

    assert.equal(result.status, 401);
});

test('05 - update sin sesión devuelve 401', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'update',
            ...DOCENTE_UPDATED,
            modifiedByEmail: UPDATED_EMAIL
        }
    );

    assert.equal(result.status, 401);
});

test('06 - find DNI inexistente devuelve found:false', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'find',
            dni: DNI
        },
        DOCENTE_COOKIE
    );

    assert.equal(result.status, 200);
    assert.equal(result.data.found, false);
    assert.equal(result.data.docente, null);
});

test('07 - create sin apellido devuelve 400', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'create',
            ...DOCENTE,
            apellido: '',
            emailDocente: EMAIL
        },
        DOCENTE_COOKIE
    );

    assert.equal(result.status, 400);
});

test('08 - create sin nombre devuelve 400', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'create',
            ...DOCENTE,
            nombre: '',
            emailDocente: EMAIL
        },
        DOCENTE_COOKIE
    );

    assert.equal(result.status, 400);
});

test('09 - create sin email devuelve 400', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'create',
            ...DOCENTE
        },
        DOCENTE_COOKIE
    );

    assert.equal(result.status, 400);
});

test('10 - create válido devuelve 201', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'create',
            ...DOCENTE,
            emailDocente: EMAIL
        },
        DOCENTE_COOKIE
    );

    assert.equal(result.status, 201);
    assert.equal(result.data.created, true);
    assert.equal(result.data.docente.dni, DNI);
});

test('11 - find recupera el docente recién creado', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'find',
            dni: DNI
        },
        DOCENTE_COOKIE
    );

    assert.equal(result.status, 200);
    assert.equal(result.data.found, true);
    assert.equal(result.data.docente.dni, DNI);
    assert.equal(result.data.docente.apellido, DOCENTE.apellido);
    assert.equal(result.data.docente.nombre, DOCENTE.nombre);
});

test('12 - created_by y modified_by quedan registrados correctamente', async () => {
    const result = await sql`
        SELECT
            creado_por_email,
            actualizado_por_email
        FROM docentes
        WHERE dni = ${DNI}
    `;

    assert.equal(result.rows.length, 1);
    assert.equal(
        result.rows[0].creado_por_email,
        EMAIL
    );
    assert.equal(
        result.rows[0].actualizado_por_email,
        EMAIL
    );
});

test('13 - DNI con formato diferente recupera el mismo docente', async () => {
    const formattedDni = DNI.slice(0, 3) + '.' + DNI.slice(3);

    const result = await requestJson(
        BASE_URL,
        {
            action: 'find',
            dni: formattedDni
        },
        DOCENTE_COOKIE
    );

    assert.equal(result.status, 200);
    assert.equal(result.data.found, true);
    assert.equal(result.data.docente.dni, DNI);
});

test('14 - update válido devuelve 200', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'update',
            ...DOCENTE_UPDATED,
            modifiedByEmail: UPDATED_EMAIL
        },
        DOCENTE_COOKIE
    );

    assert.equal(result.status, 200);
    assert.equal(result.data.updated, true);
    assert.equal(
        result.data.docente.apellido,
        DOCENTE_UPDATED.apellido
    );
});

test('15 - modified_by se actualiza', async () => {
    const result = await sql`
        SELECT
            creado_por_email,
            actualizado_por_email,
            actualizado_en
        FROM docentes
        WHERE dni = ${DNI}
    `;

    assert.equal(result.rows.length, 1);
    assert.equal(
        result.rows[0].creado_por_email,
        EMAIL
    );
    assert.equal(
        result.rows[0].actualizado_por_email,
        UPDATED_EMAIL
    );
    assert.ok(result.rows[0].actualizado_en);
});

test('16 - find devuelve los datos actualizados', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'find',
            dni: DNI
        },
        DOCENTE_COOKIE
    );

    assert.equal(result.status, 200);
    assert.equal(
        result.data.docente.apellido,
        DOCENTE_UPDATED.apellido
    );
    assert.equal(
        result.data.docente.telefono,
        DOCENTE_UPDATED.telefono
    );
    assert.equal(
        result.data.docente.grupoSanguineo,
        DOCENTE_UPDATED.grupoSanguineo
    );
});

test('17 - create duplicado devuelve 409', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'create',
            ...DOCENTE,
            emailDocente: EMAIL
        },
        DOCENTE_COOKIE
    );

    assert.equal(result.status, 409);
});

test('18 - update DNI inexistente devuelve 404', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'update',
            ...DOCENTE_UPDATED,
            dni: '888888888',
            modifiedByEmail: UPDATED_EMAIL
        },
        DOCENTE_COOKIE
    );

    assert.equal(result.status, 404);
});

test('19 - Dirección no puede crear docentes', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'create',
            ...DOCENTE,
            dni: `999${String(Number(DNI.slice(3)) + 1)}`,
            emailDocente: EMAIL
        },
        DIRECCION_COOKIE
    );

    assert.equal(result.status, 403);
});

test('20 - Dirección no puede actualizar docentes', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'update',
            ...DOCENTE_UPDATED,
            modifiedByEmail: UPDATED_EMAIL
        },
        DIRECCION_COOKIE
    );

    assert.equal(result.status, 403);
});

test('21 - Dirección puede consultar docentes', async () => {
    const result = await requestJson(
        BASE_URL,
        {
            action: 'find',
            dni: DNI
        },
        DIRECCION_COOKIE
    );

    assert.equal(result.status, 200);
});

test('22 - dos creates simultáneos respetan UNIQUE(dni)', async () => {
    const concurrentDni = `${DNI.slice(0, -1)}7`;

    try {
        const payload = {
            action: 'create',
            ...DOCENTE,
            dni: concurrentDni,
            emailDocente: EMAIL
        };

        const [first, second] = await Promise.all([
            requestJson(
                BASE_URL,
                payload,
                DOCENTE_COOKIE
            ),
            requestJson(
                BASE_URL,
                payload,
                DOCENTE_COOKIE
            )
        ]);

        const statuses = [
            first.status,
            second.status
        ].sort((a, b) => a - b);

        assert.deepEqual(
            statuses,
            [201, 409]
        );
    } finally {
        await sql`
            DELETE FROM docentes
            WHERE dni = ${concurrentDni}
        `;
    }
});
