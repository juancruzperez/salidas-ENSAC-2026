const test = require('node:test');
const assert = require('node:assert/strict');

const {
    validateSalida,
    isValidDate,
    isValidTime
} = require('../../api/lib/validation/salida');

function salidaValida(overrides = {}) {
    return {
        cantEstudiantes: 20,
        cantAcompanantes: 2,
        fechaSalida: '2026-09-10',
        horaSalida: '08:00',
        fechaRegreso: '2026-09-10',
        horaRegreso: '18:00',
        sinPernocte: true,
        nombreAlojamiento: '',
        ...overrides
    };
}

test('fecha válida', () => {
    assert.equal(isValidDate('2026-09-10'), true);
});

test('fecha inválida', () => {
    assert.equal(isValidDate('2026-02-30'), false);
});

test('hora válida', () => {
    assert.equal(isValidTime('18:30'), true);
});

test('hora inválida', () => {
    assert.equal(isValidTime('25:00'), false);
});

test('salida válida', () => {
    assert.equal(validateSalida(salidaValida()).valid, true);
});

test('estudiantes debe ser mayor o igual a 1', () => {
    const result = validateSalida(
        salidaValida({ cantEstudiantes: 0 })
    );

    assert.equal(result.valid, false);
});

test('requiere acompañantes según cantidad de estudiantes', () => {
    const result = validateSalida(
        salidaValida({
            cantEstudiantes: 21,
            cantAcompanantes: 2
        })
    );

    assert.equal(result.valid, false);
});

test('acepta cantidad mínima de acompañantes', () => {
    const result = validateSalida(
        salidaValida({
            cantEstudiantes: 21,
            cantAcompanantes: 3
        })
    );

    assert.equal(result.valid, true);
});

test('rechaza regreso anterior a la salida', () => {
    const result = validateSalida(
        salidaValida({
            fechaSalida: '2026-09-10',
            fechaRegreso: '2026-09-09'
        })
    );

    assert.equal(result.valid, false);
});

test('rechaza regreso anterior en horario si es el mismo día', () => {
    const result = validateSalida(
        salidaValida({
            horaSalida: '18:00',
            horaRegreso: '17:00'
        })
    );

    assert.equal(result.valid, false);
});

test('sin pernocte exige regreso el mismo día', () => {
    const result = validateSalida(
        salidaValida({
            fechaRegreso: '2026-09-11'
        })
    );

    assert.equal(result.valid, false);
});

test('con pernocte exige alojamiento', () => {
    const result = validateSalida(
        salidaValida({
            sinPernocte: false,
            nombreAlojamiento: ''
        })
    );

    assert.equal(result.valid, false);
});

test('con pernocte con alojamiento es válido', () => {
    const result = validateSalida(
        salidaValida({
            sinPernocte: false,
            fechaRegreso: '2026-09-11',
            nombreAlojamiento: 'Hotel Test'
        })
    );

    assert.equal(result.valid, true);
});
