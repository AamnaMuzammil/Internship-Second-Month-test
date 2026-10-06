import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildMeta } from '../common/utils/pagination';
import { CreateSlotDto } from './dto/create-slot.dto';
import { SlotQueryDto } from './dto/slot-query.dto';

@Injectable()
export class SlotsService {
  constructor(private prisma: PrismaService) {}

  async findAll(staffId: number, q: SlotQueryDto) {
    await this.assertStaff(staffId);

    const where: Prisma.TimeSlotWhereInput = { staffId, startTime: { gt: new Date() } };

    if (q.date) {
      const from = new Date(`${q.date.slice(0, 10)}T00:00:00.000Z`);
      const to = new Date(from);
      to.setUTCDate(to.getUTCDate() + 1);
      where.startTime = { gte: from > new Date() ? from : new Date(), lt: to };
    }
    if (q.available) {
      where.appointments = { none: { status: AppointmentStatus.BOOKED } };
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.timeSlot.findMany({
        where,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.timeSlot.count({ where }),
    ]);
    return { data, meta: buildMeta(total, q.page, q.limit) };
  }

  async create(staffId: number, dto: CreateSlotDto) {
    await this.assertStaff(staffId);

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (end <= start) throw new BadRequestException('endTime must be after startTime');
    if (start <= new Date()) throw new BadRequestException('Slot must be in the future');

    const overlap = await this.prisma.timeSlot.findFirst({
      where: { staffId, startTime: { lt: end }, endTime: { gt: start } },
    });
    if (overlap) throw new ConflictException('Slot overlaps with an existing slot');

    return this.prisma.timeSlot.create({ data: { staffId, startTime: start, endTime: end } });
  }

  async remove(staffId: number, slotId: number) {
    const slot = await this.prisma.timeSlot.findFirst({ where: { id: slotId, staffId } });
    if (!slot) throw new NotFoundException('Slot not found');

    const used = await this.prisma.appointment.count({ where: { slotId } });
    if (used > 0) throw new ConflictException('Slot has appointments and cannot be deleted');

    await this.prisma.timeSlot.delete({ where: { id: slotId } });
    return { message: 'Slot deleted' };
  }

  private async assertStaff(staffId: number) {
    const staff = await this.prisma.staff.findFirst({ where: { id: staffId, isActive: true } });
    if (!staff) throw new NotFoundException('Staff member not found');
  }
}