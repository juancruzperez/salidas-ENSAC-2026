const test = require('node:test');
const assert = require('node:assert/strict');

function normalizeDni(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.replace(/\D/g, '');
}

function normalizeEmail(value) {
    if (typeof value !== 'string') {
        return '';
    }

    return value.trim().toLowerCase();
}

function cleanOptionalString(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim();

    return normalized === '' ? null : normalized;
}

test('DNI: normaliza puntos', () => {
    assert.equal(
        normalizeDni('12.345.678'),
        '12345678'
    );
});

test('DNI: normaliza guiones', () => {
    assert.equal(
        normalizeDni('12-345-678'),
        '12345678'
    );
});

test('DNI: normaliza espacios', () => {
    assert.equal(
        normalizeDni('12 345 678'),
        '12345678'
    );
});

test('DNI: elimina caracteres no numéricos', () => {
    assert.equal(
        normalizeDni(' DNI: 12.345.678 '),
        '12345678'
    );
});

test('DNI: valor no string produce vacío', () => {
    assert.equal(
        normalizeDni(null),
        ''
    );
});

test('DNI: string vacío produce vacío', () => {
    assert.equal(
        normalizeDni(''),
        ''
    );
});

test('email: elimina espacios', () => {
    assert.equal(
        normalizeEmail('  docente@example.com  '),
        'docente@example.com'
    );
});

test('email: normaliza mayúsculas', () => {
    assert.equal(
        normalizeEmail('DOCENTE@EXAMPLE.COM'),
        'docente@example.com'
    );
});

test('email inválido por tipo produce vacío', () => {
    assert.equal(
        normalizeEmail(null),
        ''
    );
});

test('campo opcional: conserva contenido', () => {
    assert.equal(
        cleanOptionalString('  3511234567  '),
        '3511234567'
    );
});

test('campo opcional: vacío produce null', () => {
    assert.equal(
        cleanOptionalString('   '),
        null
    );
});

test('campo opcional: null produce null', () => {
    assert.equal(
        cleanOptionalString(null),
        null
    );
});
