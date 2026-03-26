import { PrismaClient } from '@prisma/client';

type Mapping = {
    incidentId: string;
    controlId: string;
};

export async function seedIncidentControls(prisma: PrismaClient) {
    const incidents = await prisma.incident.findMany({ orderBy: { title: 'asc' }, select: { id: true } });
    const controls = await prisma.control.findMany({ orderBy: { code: 'asc' }, select: { id: true } });

    if (incidents.length === 0 || controls.length === 0) return { count: 0 };

    const mappings: Mapping[] = [];

    for (let i = 0; i < incidents.length; i++) {
        const baseIndex = (i * 2) % controls.length;
        const controlIndexes = [
            baseIndex,
            (baseIndex + 4) % controls.length,
            (baseIndex + 9) % controls.length,
        ];

        if (i % 2 === 0) {
            controlIndexes.push((baseIndex + 14) % controls.length);
        }

        for (const idx of controlIndexes) {
            mappings.push({ incidentId: incidents[i].id, controlId: controls[idx].id });
        }
    }

    await prisma.incidentControl.createMany({
        data: mappings,
        skipDuplicates: true,
    });

    return { count: mappings.length };
}

