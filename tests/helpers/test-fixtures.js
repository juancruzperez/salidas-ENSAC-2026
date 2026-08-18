const RUN_ID = `${Date.now()}${process.pid}`.slice(-9);

const DNI = `999${RUN_ID}`;

const EMAIL = `test-docente-${RUN_ID}@ensac.test`;

const UPDATED_EMAIL = `test-docente-updated-${RUN_ID}@ensac.test`;

const DOCENTE = {
    dni: DNI,
    apellido: 'DOCENTE',
    nombre: 'PRUEBA',
    telefono: '3510000000',
    grupoSanguineo: 'O+',
    contactoEmergencia: 'Contacto Prueba'
};

const DOCENTE_UPDATED = {
    dni: DNI,
    apellido: 'DOCENTE ACTUALIZADO',
    nombre: 'PRUEBA',
    telefono: '3511111111',
    grupoSanguineo: 'A+',
    contactoEmergencia: 'Contacto Actualizado'
};

module.exports = {
    RUN_ID,
    DNI,
    EMAIL,
    UPDATED_EMAIL,
    DOCENTE,
    DOCENTE_UPDATED
};
