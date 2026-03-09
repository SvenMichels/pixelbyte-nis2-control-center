import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { BusinessConflictException, BusinessValidationException, ResourceNotFoundException } from '../common/exceptions';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    private readonly safeUserSelect = {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
    } as const;

    constructor(private readonly prisma: PrismaService,
    ) {
    }

    findAuthUserByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    findPublicUserById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            select: this.safeUserSelect,
        });
    }

    findAll() {
        return this.prisma.user.findMany({ select: this.safeUserSelect });
    }

    createUser(email: string, passwordHash: string, role: Role = Role.USER) {
        return this.prisma.user.create({ data: { email, passwordHash, role } });
    }

    async updateUser(id: string, dto: UpdateUserDto, _ctx: { isAdmin: boolean; isSelf: boolean }) {
        if (!dto.email && !dto.password) {
            throw new BusinessValidationException('Es wurden keine Felder zum Aktualisieren übermittelt.');
        }

        const existing = await this.prisma.user.findUnique({ where: { id } });
        if (!existing) throw new ResourceNotFoundException('Benutzer', id);

        const data: Prisma.UserUpdateInput = {};

        if (dto.email) data.email = dto.email;
        if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 12);

        try {
            return await this.prisma.user.update({
                where: { id },
                data,
                select: { id: true, email: true, role: true },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new BusinessConflictException('Diese E-Mail-Adresse wird bereits verwendet.');
            }
            throw error;
        }

    }

    async remove(id: string) {
        await this.prisma.user.delete({ where: { id } });
        return { ok: true, deletedId: id };
    }
}
