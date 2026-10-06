import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { SlotsService } from './slots.service';
import { CreateSlotDto } from './dto/create-slot.dto';
import { SlotQueryDto } from './dto/slot-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('staff/:staffId/slots')
export class SlotsController {
  constructor(private slots: SlotsService) {}

  @Get()
  findAll(@Param('staffId', ParseIntPipe) staffId: number, @Query() q: SlotQueryDto) {
    return this.slots.findAll(staffId, q);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  create(@Param('staffId', ParseIntPipe) staffId: number, @Body() dto: CreateSlotDto) {
    return this.slots.create(staffId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':slotId')
  remove(
    @Param('staffId', ParseIntPipe) staffId: number,
    @Param('slotId', ParseIntPipe) slotId: number,
  ) {
    return this.slots.remove(staffId, slotId);
  }
}