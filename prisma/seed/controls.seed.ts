import { ControlStatus, PrismaClient } from '@prisma/client';

type ControlSeed = {
    code: string;
    title: string;
    description?: string;
    category?: string;
    status: ControlStatus;
    ownerId?: string | null;
};

const STATUSES: ControlStatus[] = [
    ControlStatus.NOT_STARTED,
    ControlStatus.IN_PROGRESS,
    ControlStatus.IMPLEMENTED,
    ControlStatus.NOT_APPLICABLE,
];

export async function seedControls(prisma: PrismaClient) {
    const security = await prisma.user.findUnique({
        where: { email: 'security@pixelbyte.dev' },
        select: { id: true },
    });

    const ownerId = security?.id ?? null;

    const controls: ControlSeed[] = [];

    for (const status of STATUSES) {
        controls.push(
          makeControl(status, 1, ownerId),
          makeControl(status, 2, ownerId),
          makeControl(status, 3, ownerId),
          makeControl(status, 4, ownerId),
        );
    }

    for (const c of controls) {
        await prisma.control.upsert({
            where: { code: c.code },
            update: {
                title: c.title,
                description: c.description,
                category: c.category,
                status: c.status,
                ownerId: c.ownerId ?? null,
            },
            create: c,
        });
    }

    return { count: controls.length };
}

const CATEGORIES = [
    'Governance',
    'Risk Management',
    'Incident Response',
    'Logging',
];

function makeControl(status: ControlStatus, idx: number, ownerId: string | null): ControlSeed {
    const key = statusKey(status);
    const category = CATEGORIES[(idx - 1) % CATEGORIES.length];

    return {
        code: `${key}-${idx.toString().padStart(2, '0')}`,
        title: `Seed Control (${status}) #${idx}`,
        description: `Auto-seeded control for status=${status}`,
        category,
        status,
        ownerId,
    };
}

function statusKey(status: ControlStatus): string {
    switch (status) {
        case ControlStatus.NOT_STARTED:
            return 'NS';
        case ControlStatus.IN_PROGRESS:
            return 'IP';
        case ControlStatus.IMPLEMENTED:
            return 'IM';
        case ControlStatus.NOT_APPLICABLE:
            return 'NA';
        default:
            return 'XX';
    }
}
