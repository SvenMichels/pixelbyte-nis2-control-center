import { PrismaClient } from '@prisma/client';

type Mapping = {
    riskId: string;
    controlId: string;
};

export async function seedRiskControls(prisma: PrismaClient) {
    const risks = await prisma.risk.findMany({ orderBy: { title: 'asc' }, select: { id: true } });
    const controls = await prisma.control.findMany({ orderBy: { code: 'asc' }, select: { id: true } });

    if (risks.length === 0 || controls.length === 0) {
        return { count: 0 };
    }

    const mappings: Mapping[] = [];

    for (let i = 0; i < risks.length; i += 1) {
        const baseIndex = (i * 3) % controls.length;
        const controlIndexes = [ baseIndex, (baseIndex + 5) % controls.length, (baseIndex + 11) % controls.length ];

        if (i % 3 === 0) {
            controlIndexes.push((baseIndex + 17) % controls.length);
        }

        for (const idx of controlIndexes) {
            mappings.push({ riskId: risks[i].id, controlId: controls[idx].id });
        }
    }

    await prisma.riskControl.createMany({
        data: mappings,
        skipDuplicates: true,
    });

    return { count: mappings.length };
}

