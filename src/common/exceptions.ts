import { HttpException, HttpStatus } from '@nestjs/common';

export class ResourceNotFoundException extends HttpException {
    constructor(resource: string, identifier?: string) {
        const message = identifier
            ? `${resource} mit ID "${identifier}" wurde nicht gefunden.`
            : `${resource} wurde nicht gefunden.`;
        super({ statusCode: HttpStatus.NOT_FOUND, error: 'Nicht gefunden', message }, HttpStatus.NOT_FOUND);
    }
}

export class BusinessConflictException extends HttpException {
    constructor(message: string) {
        super({ statusCode: HttpStatus.CONFLICT, error: 'Konflikt', message }, HttpStatus.CONFLICT);
    }
}

export class BusinessValidationException extends HttpException {
    constructor(message: string) {
        super({ statusCode: HttpStatus.BAD_REQUEST, error: 'Validierungsfehler', message }, HttpStatus.BAD_REQUEST);
    }
}

