function isValidDate(value) {
    if (typeof value !== 'string') {
        return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00Z`);

    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
}

function isValidTime(value) {
    return (
        typeof value === 'string' &&
        /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
    );
}

function validateSalida(data = {}) {
    const errors = [];

    const {
        cantEstudiantes,
        cantAcompanantes,
        fechaSalida,
        horaSalida,
        fechaRegreso,
        horaRegreso,
        sinPernocte,
        nombreAlojamiento
    } = data;

    if (typeof sinPernocte !== 'boolean') {
        errors.push(
            'El campo sinPernocte debe ser booleano.'
        );
    }

    if (
        !Number.isInteger(cantEstudiantes) ||
        cantEstudiantes < 1
    ) {
        errors.push(
            'La cantidad de estudiantes debe ser un entero mayor o igual a 1.'
        );
    }

    if (
        !Number.isInteger(cantAcompanantes) ||
        cantAcompanantes < Math.ceil(cantEstudiantes / 10)
    ) {
        errors.push(
            `La cantidad de acompañantes debe ser al menos ${Math.ceil(cantEstudiantes / 10)}.`
        );
    }

    if (!isValidDate(fechaSalida)) {
        errors.push(
            'La fecha de salida no es válida.'
        );
    }

    if (!isValidDate(fechaRegreso)) {
        errors.push(
            'La fecha de regreso no es válida.'
        );
    }

    if (!isValidTime(horaSalida)) {
        errors.push(
            'La hora de salida no es válida.'
        );
    }

    if (!isValidTime(horaRegreso)) {
        errors.push(
            'La hora de regreso no es válida.'
        );
    }

    if (
        isValidDate(fechaSalida) &&
        isValidDate(fechaRegreso)
    ) {
        if (fechaRegreso < fechaSalida) {
            errors.push(
                'La fecha de regreso no puede ser anterior a la fecha de salida.'
            );
        }

        if (
            sinPernocte === true &&
            fechaRegreso !== fechaSalida
        ) {
            errors.push(
                'Una salida sin pernocte debe regresar el mismo día.'
            );
        }

        if (
            fechaRegreso === fechaSalida &&
            isValidTime(horaSalida) &&
            isValidTime(horaRegreso) &&
            horaRegreso <= horaSalida
        ) {
            errors.push(
                'Si la salida y el regreso son el mismo día, la hora de regreso debe ser posterior a la hora de salida.'
            );
        }
    }

    if (
        typeof sinPernocte === 'boolean' &&
        sinPernocte === false
    ) {
        if (
            typeof nombreAlojamiento !== 'string' ||
            nombreAlojamiento.trim() === ''
        ) {
            errors.push(
                'El alojamiento es obligatorio para una salida con pernocte.'
            );
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateSalida,
    isValidDate,
    isValidTime
};