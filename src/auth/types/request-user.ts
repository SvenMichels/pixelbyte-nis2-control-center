import type { Role } from '@prisma/client';

export class RequestUser {
    id!: string;
    email!: string;
    role!: Role;
}

