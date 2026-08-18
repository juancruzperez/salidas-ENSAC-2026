const { getSessionToken, getSession } = require('./session');

const PERMISSIONS = {
    docente: new Set([
        'salida:create',
        'estudiante:read',
        'docente:read',
        'docente:create',
        'docente:update'
    ]),

    secretaria: new Set([
        'salida:create',
        'estudiante:read',
        'salida:read',
        'salida:review',
        'informe:read',
        'estudiante:manage',
        'docente:read',
        'docente:create',
        'docente:update'
    ]),

    direccion: new Set([
        'salida:create',
        'estudiante:read',
        'salida:read',
        'salida:review',
        'salida:approve',
        'informe:read',
        'docente:read'
    ]),

    admin: new Set([
        'salida:create',
        'estudiante:read',
        'salida:read',
        'salida:review',
        'informe:read',
        'estudiante:manage',
        'usuario:manage',
        'sistema:configure',
        'docente:read',
        'docente:create',
        'docente:update'
    ])
};

async function requireSession(request) {
    const token = getSessionToken(request);

    if (!token) {
        return {
            authenticated: false,
            session: null
        };
    }

    const session = await getSession(token);

    if (!session) {
        return {
            authenticated: false,
            session: null
        };
    }

    return {
        authenticated: true,
        session
    };
}

function hasPermission(session, permission) {
    if (!session || !session.role) {
        return false;
    }

    const rolePermissions = PERMISSIONS[session.role];

    if (!rolePermissions) {
        return false;
    }

    return rolePermissions.has(permission);
}

async function requirePermission(request, permission) {
    const auth = await requireSession(request);

    if (!auth.authenticated) {
        return {
            ok: false,
            status: 401,
            error: 'No autenticado.',
            session: null
        };
    }

    if (!hasPermission(auth.session, permission)) {
        return {
            ok: false,
            status: 403,
            error: 'No tiene permisos para realizar esta operación.',
            session: auth.session
        };
    }

    return {
        ok: true,
        status: 200,
        error: null,
        session: auth.session
    };
}

module.exports = {
    PERMISSIONS,
    requireSession,
    hasPermission,
    requirePermission
};
