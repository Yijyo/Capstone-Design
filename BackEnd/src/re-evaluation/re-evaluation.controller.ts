import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ReEvaluationService } from './re-evaluation.service';
import { CreateReEvaluationDto } from './dto/create-re-evaluation.dto';
import { UpdateReEvaluationDto } from './dto/update-re-evaluation.dto';

@Controller('re-evaluation')
export class ReEvaluationController {
  constructor(private readonly reEvaluationService: ReEvaluationService) {}

  @Post()
  create(@Body() createReEvaluationDto: CreateReEvaluationDto) {
    return this.reEvaluationService.create(createReEvaluationDto);
  }

  @Get()
  findAll() {
    return this.reEvaluationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reEvaluationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReEvaluationDto: UpdateReEvaluationDto) {
    return this.reEvaluationService.update(+id, updateReEvaluationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reEvaluationService.remove(+id);
  }
}
