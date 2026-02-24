import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

type SeedUser = {
    email: string;
    role: Role;
    password: string;
};

export async function seedUsers(prisma: PrismaClient) {
    const users: SeedUser[] = [
        { email: 'test@pixelbyte.dev', role: Role.USER, password: 'Test123!' },
        { email: 'guest@pixelbyte.dev', role: Role.USER, password: 'Guest123!change' },
        { email: 'admin@pixelbyte.dev', role: Role.ADMIN, password: 'Admin123!change' },
        { email: 'security@pixelbyte.dev', role: Role.SECURITY, password: 'Security123!change' },
        { email: 'auditor@pixelbyte.dev', role: Role.AUDITOR, password: 'Auditor123!change' },
    ];

    for (const u of users) {
        const passwordHash = await bcrypt.hash(u.password, 12);

        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                role: u.role,
                passwordHash,
            },
            create: {
                email: u.email,
                role: u.role,
                passwordHash,
            },
        });
    }

    return { count: users.length };
}
