import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { QueryService } from './query.service';
import { CreateQueryDto, QueryResponseDto } from './dto/query.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('query')
@UseGuards(AuthGuard('jwt'))
export class QueryController {
    constructor(private readonly queryService: QueryService) {}

    @Post('chat')
    async createQuery(
        @Body() createQueryDto: CreateQueryDto
    ): Promise<QueryResponseDto> {
        return this.queryService.createQuery(createQueryDto);
    }

    @Get('ai-result/:aiResultId')
    async getQueriesByAIResult(
        @Request() req,
        @Param('aiResultId') aiResultId: number
    ): Promise<QueryResponseDto[]> {
        return this.queryService.getQueriesByAIResult(req.user.id, aiResultId);
    }
}