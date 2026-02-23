import { Injectable } from '@nestjs/common';
import { AuditAction, AuditEntityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditEventsQueryDto } from './dto/audit-events.query.dto';

type AuditLogParams = {
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    controlId?: string | null;
    riskId?: string | null;
    actorId?: string | null;
    meta?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditService {
    constructor(private readonly prisma: PrismaService) {
    }

    log(params: AuditLogParams) {
        return this.prisma.auditEvent.create({
            data: {
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                controlId: params.controlId ?? null,
                riskId: params.riskId ?? null,
                actorId: params.actorId ?? null,
                ...(params.meta !== undefined ? { meta: params.meta } : {}),
            },
        });
    }

    logWith(tx: Prisma.TransactionClient, params: AuditLogParams) {
        return tx.auditEvent.create({
            data: {
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                controlId: params.controlId ?? null,
                riskId: params.riskId ?? null,
                actorId: params.actorId ?? null,
                ...(params.meta !== undefined ? { meta: params.meta } : {}),
            },
        });
    }

    async findEvents(query: AuditEventsQueryDto) {
        const limit = query.limit ?? 50;

        const baseWhere: Prisma.AuditEventWhereInput = {
            ...(query.controlId ? { controlId: query.controlId } : {}),
            ...(query.riskId ? { riskId: query.riskId } : {}),
            ...(query.actorId ? { actorId: query.actorId } : {}),
            ...(query.entityType && query.entityId
              ? { entityType: query.entityType, entityId: query.entityId }
              : {}),
        };

        const cursor = query.cursor ? this.decodeCursor(query.cursor) : null;

        const where: Prisma.AuditEventWhereInput = cursor
          ? {
              AND: [
                  baseWhere,
                  {
                      OR: [
                          { createdAt: { lt: cursor.createdAt } },
                          { createdAt: cursor.createdAt, id: { lt: cursor.id } },
                      ],
                  },
              ],
          }
          : baseWhere;

        const itemsPlus = await this.prisma.auditEvent.findMany({
            where,
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' },
            ],
            take: limit + 1,
        });

        const hasMore = itemsPlus.length > limit;
        const items = hasMore ? itemsPlus.slice(0, limit) : itemsPlus;

        const nextCursor = hasMore
          ? this.encodeCursor(items[items.length - 1].createdAt, items[items.length - 1].id)
          : null;

        return { items, nextCursor };
    }

    findForControl(controlId: string) {
        return this.prisma.auditEvent.findMany({
            where: { controlId },
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' },
            ],
        });
    }

    private encodeCursor(createdAt: Date, id: string) {
        const raw = `${createdAt.toISOString()}|${id}`;
        return Buffer.from(raw, 'utf8').toString('base64url');
    }

    private decodeCursor(cursor: string): { createdAt: Date; id: string } {
        const raw = Buffer.from(cursor, 'base64url').toString('utf8');
        const [ iso, id ] = raw.split('|');

        const createdAt = new Date(iso);
        if (!iso || !id || Number.isNaN(createdAt.getTime())) {
            throw new Error('Invalid cursor');
        }

        return { createdAt, id };
    }
}
