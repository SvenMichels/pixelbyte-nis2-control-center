import { EvidenceType, PrismaClient } from '@prisma/client';

type EvidenceSeed = {
    controlId: string;
    type: EvidenceType;
    note?: string;
    link?: string;
};

const NOTE_TEMPLATES = [
    'Evidence documented in security tracker for {{code}}.',
    'Review notes captured for {{code}} with action items.',
    'Implementation proof stored in internal repository for {{code}}.',
    'Checklist completed and approved for {{code}}.',
];

const LINK_TEMPLATES = [
    'https://example.com/evidence/{{code}}/policy',
    'https://example.com/evidence/{{code}}/report',
    'https://example.com/evidence/{{code}}/review',
    'https://example.com/evidence/{{code}}/ticket',
];

const LOGGING_NOTE_TEMPLATES = [
    'SIEM coverage confirmed for {{code}} with daily alert review.',
    'Log retention settings verified for {{code}}.',
    'Detection rule mapped to {{code}} and tuned for false positives.',
];

const LOGGING_LINK_TEMPLATES = [
    'https://example.com/logging/{{code}}/dashboard',
    'https://example.com/logging/{{code}}/retention',
    'https://example.com/logging/{{code}}/alerts',
];

export async function seedControlEvidence(prisma: PrismaClient) {
    const controls = await prisma.control.findMany({
        orderBy: { code: 'asc' },
        select: { id: true, code: true, status: true, category: true },
    });

    if (controls.length === 0) {
        return { count: 0 };
    }

    const existing = await prisma.controlEvidence.findMany({
        select: { controlId: true },
    });

    const existingCounts = existing.reduce<Record<string, number>>((acc, item) => {
        acc[item.controlId] = (acc[item.controlId] ?? 0) + 1;
        return acc;
    }, {});

    const evidenceItems: EvidenceSeed[] = [];

    for (const control of controls) {
        const baseCount = control.code.endsWith('01') || control.code.endsWith('02') ? 3 : 2;
        const isLogging = control.category === 'Logging' || control.category === 'Monitoring';
        const loggingBoost = isLogging ? 1 : 0;
        const desiredCount = control.status === 'IMPLEMENTED' ? baseCount + 1 + loggingBoost : baseCount + loggingBoost;
        const currentCount = existingCounts[control.id] ?? 0;
        const remaining = Math.max(0, desiredCount - currentCount);

        for (let i = 0; i < remaining; i += 1) {
            const useLink = i % 2 === 0;
            const codeToken = control.code.toLowerCase();
            const loggingIndex = i % LOGGING_NOTE_TEMPLATES.length;
            const baseIndex = (i + control.code.length) % NOTE_TEMPLATES.length;
            const useLoggingTemplate = isLogging && i < LOGGING_NOTE_TEMPLATES.length;

            const noteTemplate = useLoggingTemplate ? LOGGING_NOTE_TEMPLATES[loggingIndex] : NOTE_TEMPLATES[baseIndex];
            const linkTemplate = useLoggingTemplate ? LOGGING_LINK_TEMPLATES[loggingIndex] : LINK_TEMPLATES[baseIndex];

            evidenceItems.push({
                controlId: control.id,
                type: useLink ? EvidenceType.LINK : EvidenceType.NOTE,
                note: useLink ? undefined : noteTemplate.replace('{{code}}', control.code),
                link: useLink ? linkTemplate.replace('{{code}}', codeToken) : undefined,
            });
        }
    }

    if (evidenceItems.length === 0) {
        return { count: 0 };
    }

    await prisma.controlEvidence.createMany({
        data: evidenceItems,
    });

    return { count: evidenceItems.length };
}
