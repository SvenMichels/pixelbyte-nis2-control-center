import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EvidenceType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEvidenceDto } from './dto/create-evidence.dto';

@Injectable()
export class ControlsEvidenceService {
    constructor(private readonly prisma: PrismaService) {
    }

    async create(controlId: string, dto: CreateEvidenceDto) {
        await this.ensureControlExists(controlId);
        this.validate(dto);

        return this.prisma.controlEvidence.create({
            data: {
                controlId,
                type: dto.type,
                note: dto.note ?? null,
                link: dto.link ?? null,
            },
        });
    }

    async findAll(controlId: string) {
        await this.ensureControlExists(controlId);

        return this.prisma.controlEvidence.findMany({
            where: { controlId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async remove(controlId: string, evidenceId: string) {
        await this.ensureControlExists(controlId);

        const ev = await this.prisma.controlEvidence.findFirst({
            where: { id: evidenceId, controlId },
            select: { id: true },
        });

        if (!ev) throw new NotFoundException('Evidence not found');

        await this.prisma.controlEvidence.delete({
            where: { id: evidenceId },
        });

        return { ok: true, deletedId: evidenceId };
    }

    async removeAll(controlId: string) {
        await this.ensureControlExists(controlId);

        const res = await this.prisma.controlEvidence.deleteMany({
            where: { controlId },
        });

        return { ok: true, deletedCount: res.count };
    }

    private validate(dto: CreateEvidenceDto) {
        if (dto.type === EvidenceType.NOTE && !dto.note?.trim()) {
            throw new BadRequestException('note is required when type=NOTE');
        }
        if (dto.type === EvidenceType.LINK && !dto.link?.trim()) {
            throw new BadRequestException('link is required when type=LINK');
        }
    }

    private async ensureControlExists(controlId: string) {
        const exists = await this.prisma.control.findUnique({
            where: { id: controlId },
            select: { id: true },
        });
        if (!exists) throw new NotFoundException('Control not found');
    }
}
