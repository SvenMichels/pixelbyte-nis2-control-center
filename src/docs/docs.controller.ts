import { Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';

@ApiTags('docs')
@Controller('docs')
export class DocsController {

    @Post()
    @ApiBearerAuth('bearer')
    @Auth(Role.ADMIN)
    createDoc() {
        return {
            status: 'ok',
            message: 'Document created successfully',
        };
    }

    @Get()
    @ApiBearerAuth('bearer')
    @Auth(Role.ADMIN)
    getDocsInfo() {
        return {
            status: 'ok',
            service: 'Docs Service',
        };
    }

    @Patch(':id')
    @ApiBearerAuth('bearer')
    @Auth(Role.ADMIN)
    updateDoc(@Param('id') id: string) {
        return {
            status: 'ok',
            message: 'Document updated successfully',
        };
    }

    @Delete(':id')
    @ApiBearerAuth('bearer')
    @Auth(Role.ADMIN)
    deleteDoc(@Param('id') id: string) {
        return {
            status: 'ok',
            message: 'Document deleted successfully',
        };
    }
}
