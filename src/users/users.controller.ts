import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { Authenticated } from '../auth/decorators/authenticated.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly users: UsersService) {
    }

    @Get('me')
    @Authenticated()
    me(@CurrentUser() user: any) {
        return user;
    }

    @Get(':id')
    @Authenticated()
    findOne(
      @Param('id') id: string,
      @CurrentUser() user: any,
    ) {
        const isAdmin = user.role === Role.ADMIN;
        const isSelf = user.id === id;

        if (!isAdmin && !isSelf) throw new ForbiddenException('Not allowed');

        return this.users.findPublicUserById(id);
    }

    @Get()
    @Auth(Role.ADMIN)
    findAll() {
        return this.users.findAll();
    }

    @Delete(':id')
    @Auth(Role.ADMIN)
    delete(@Param('id') id: string) {
        return this.users.remove(id);
    }

    @Patch(':id')
    @Authenticated()
    update(
      @Param('id') id: string,
      @CurrentUser() user: any,
      @Body() dto: UpdateUserDto,
    ) {
        const isAdmin = user.role === Role.ADMIN;
        const isSelf = user.id === id;

        if (!isAdmin && !isSelf) throw new ForbiddenException('Not allowed');

        return this.users.updateUser(id, dto, { isAdmin, isSelf });
    }
}

