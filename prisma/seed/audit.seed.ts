import { AuditAction, AuditEntityType, PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { ControlStatus, RiskStatus, Role } from '@prisma/client';

type AuditSeed = {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    controlId?: string | null;
    riskId?: string | null;
    actorId?: string | null;
    meta?: Prisma.InputJsonValue;
};

const ACTIONS_BY_ENTITY: Record<AuditEntityType, AuditAction[]> = {
    CONTROL: [ AuditAction.CREATED, AuditAction.STATUS_CHANGED, AuditAction.UPDATED ],
    EVIDENCE: [ AuditAction.EVIDENCE_CREATED, AuditAction.EVIDENCE_DELETED ],
    RISK: [ AuditAction.CREATED, AuditAction.UPDATED, AuditAction.RISK_CONTROL_LINKED ],
};

const CONTROL_STATUS_FLOW: ControlStatus[] = [
    ControlStatus.NOT_STARTED,
    ControlStatus.IN_PROGRESS,
    ControlStatus.IMPLEMENTED,
    ControlStatus.NOT_APPLICABLE,
];

const RISK_STATUS_FLOW: RiskStatus[] = [
    RiskStatus.IDENTIFIED,
    RiskStatus.ASSESSED,
    RiskStatus.MITIGATED,
    RiskStatus.ACCEPTED,
    RiskStatus.CLOSED,
];

const SOURCES = [ 'UI', 'API', 'SYSTEM' ];
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2_1)',
    'Mozilla/5.0 (X11; Linux x86_64)',
];

type ActorRef = {
    id: string;
    role: Role;
    email: string;
};

function makeRequestId(index: number) {
    return `req-${index.toString().padStart(6, '0')}`;
}

function makeIp(index: number) {
    const a = (index % 240) + 10;
    const b = ((index * 7) % 240) + 10;
    return `10.2.${a}.${b}`;
}

function previousStatus<T extends string>(flow: T[], current: T) {
    const idx = flow.indexOf(current);
    if (idx <= 0) {
        return flow[0];
    }
    return flow[idx - 1];
}

function pickActor(actors: ActorRef[], index: number) {
    if (actors.length === 0) {
        return null;
    }
    return actors[index % actors.length];
}

function baseMeta(index: number, actor: ActorRef | null) {
    return {
        requestId: makeRequestId(index),
        ip: makeIp(index),
        source: SOURCES[index % SOURCES.length],
        userAgent: USER_AGENTS[index % USER_AGENTS.length],
        actorRole: actor?.role ?? null,
        actorEmail: actor?.email ?? null,
    } satisfies Prisma.InputJsonValue;
}

export async function seedAuditEvents(prisma: PrismaClient) {
    const users = await prisma.user.findMany({
        where: { email: { in: [ 'admin@pixelbyte.dev', 'security@pixelbyte.dev', 'auditor@pixelbyte.dev' ] } },
        select: { id: true, role: true, email: true },
    });

    const actors: ActorRef[] = users.map((user) => ({ id: user.id, role: user.role, email: user.email }));

    const controls = await prisma.control.findMany({
        orderBy: { code: 'asc' },
        select: { id: true, code: true, status: true, ownerId: true },
    });

    const risks = await prisma.risk.findMany({
        orderBy: { title: 'asc' },
        select: { id: true, title: true, status: true },
    });

    const evidences = await prisma.controlEvidence.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true, controlId: true, type: true },
    });

    const desiredTotal = Math.max(250, controls.length * 3 + risks.length * 2 + evidences.length);
    const existingCount = await prisma.auditEvent.count();

    if (existingCount >= desiredTotal) {
        return { count: 0 };
    }

    const audits: AuditSeed[] = [];

    controls.forEach((control, index) => {
        const actor = pickActor(actors, index);
        const actions = ACTIONS_BY_ENTITY.CONTROL;
        const metaBase = baseMeta(index, actor);
        const fromStatus = previousStatus(CONTROL_STATUS_FLOW, control.status);

        audits.push({
            action: actions[0],
            entityType: AuditEntityType.CONTROL,
            entityId: control.id,
            controlId: control.id,
            actorId: actor?.id ?? null,
            meta: {
                ...metaBase,
                code: control.code,
                status: control.status,
                after: { status: control.status, ownerId: control.ownerId },
            },
        });

        audits.push({
            action: actions[1],
            entityType: AuditEntityType.CONTROL,
            entityId: control.id,
            controlId: control.id,
            actorId: actor?.id ?? null,
            meta: {
                ...metaBase,
                before: { status: fromStatus },
                after: { status: control.status },
            },
        });

        if (index % 3 === 0) {
            audits.push({
                action: actions[2],
                entityType: AuditEntityType.CONTROL,
                entityId: control.id,
                controlId: control.id,
                actorId: actor?.id ?? null,
                meta: {
                    ...metaBase,
                    fields: [ 'ownerId', 'description' ],
                    before: { ownerId: null },
                    after: { ownerId: control.ownerId },
                },
            });
        }
    });

    risks.forEach((risk, index) => {
        const actor = pickActor(actors, index + 17);
        const actions = ACTIONS_BY_ENTITY.RISK;
        const metaBase = baseMeta(index + 17, actor);
        const fromStatus = previousStatus(RISK_STATUS_FLOW, risk.status);

        audits.push({
            action: actions[0],
            entityType: AuditEntityType.RISK,
            entityId: risk.id,
            riskId: risk.id,
            actorId: actor?.id ?? null,
            meta: {
                ...metaBase,
                status: risk.status,
                title: risk.title,
                after: { status: risk.status },
            },
        });

        if (index % 2 === 0) {
            audits.push({
                action: actions[1],
                entityType: AuditEntityType.RISK,
                entityId: risk.id,
                riskId: risk.id,
                actorId: actor?.id ?? null,
                meta: {
                    ...metaBase,
                    fields: [ 'status', 'severity' ],
                    before: { status: fromStatus },
                    after: { status: risk.status },
                },
            });
        }
    });

    evidences.forEach((evidence, index) => {
        const actor = pickActor(actors, index + 43);
        const metaBase = baseMeta(index + 43, actor);
        audits.push({
            action: AuditAction.EVIDENCE_CREATED,
            entityType: AuditEntityType.EVIDENCE,
            entityId: evidence.id,
            controlId: evidence.controlId,
            actorId: actor?.id ?? null,
            meta: {
                ...metaBase,
                type: evidence.type,
                after: { type: evidence.type },
            },
        });

        if (index % 10 === 0) {
            audits.push({
                action: AuditAction.EVIDENCE_DELETED,
                entityType: AuditEntityType.EVIDENCE,
                entityId: evidence.id,
                controlId: evidence.controlId,
                actorId: actor?.id ?? null,
                meta: {
                    ...metaBase,
                    reason: 'Outdated evidence replaced',
                    before: { type: evidence.type },
                    after: null,
                },
            });
        }
    });

    const riskControls = await prisma.riskControl.findMany({
        select: { riskId: true, controlId: true },
    });

    riskControls.forEach((mapping, index) => {
        const actor = pickActor(actors, index + 71);
        const metaBase = baseMeta(index + 71, actor);
        audits.push({
            action: AuditAction.RISK_CONTROL_LINKED,
            entityType: AuditEntityType.RISK,
            entityId: mapping.riskId,
            riskId: mapping.riskId,
            controlId: mapping.controlId,
            actorId: actor?.id ?? null,
            meta: {
                ...metaBase,
                linkedControlId: mapping.controlId,
                before: { linked: false },
                after: { linked: true },
            },
        });
    });

    const remaining = Math.max(0, desiredTotal - existingCount);
    const toInsert = audits.slice(0, remaining);

    if (toInsert.length === 0) {
        return { count: 0 };
    }

    await prisma.auditEvent.createMany({
        data: toInsert,
    });

    return { count: toInsert.length };
}
