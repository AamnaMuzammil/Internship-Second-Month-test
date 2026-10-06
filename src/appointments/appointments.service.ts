import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildMeta } from '../common/utils/pagination';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentQueryDto } from './dto/appointment-query.dto';

type AuthUser = { id: number; role: Role };

const include = {
  service: { select: { id: true, name: true, durationMin: true, price: true } },
  staff: { select: { id: true, name: true } },
  slot: { select: { id: true, startTime: true, endTime: true } },
};

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateAppointmentDto) {
    const slot = await this.validate(dto.slotId, dto.serviceId);
    try {
      return await this.prisma.appointment.create({
        data: {
          customerId: user.id,
          staffId: slot.staffId,
          serviceId: dto.serviceId,
          slotId: slot.id,
        },
        include,
      });
    } catch (e) {
      this.handleConflict(e);
    }
  }

  async findAll(user: AuthUser, q: AppointmentQueryDto) {
    const where: Prisma.AppointmentWhereInput = {
      ...(user.role !== Role.ADMIN && { customerId: user.id }),
      ...(q.status && { status: q.status }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        include,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.appointment.count({ where }),
    ]);
    return { data, meta: buildMeta(total, q.page, q.limit) };
  }

  async findOne(user: AuthUser, id: number) {
    const appt = await this.getOwned(user, id);
    return this.prisma.appointment.findUnique({ where: { id: appt.id }, include });
  }

  async update(user: AuthUser, id: number, dto: UpdateAppointmentDto) {
    const appt = await this.getOwned(user, id);
    if (appt.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cancelled appointments cannot be updated');
    }
    if (dto.slotId === undefined && dto.serviceId === undefined) {
      throw new BadRequestException('Provide slotId and/or serviceId');
    }

    const slotId = dto.slotId ?? appt.slotId;
    const serviceId = dto.serviceId ?? appt.serviceId;
    const slot = await this.validate(slotId, serviceId);

    try {
      return await this.prisma.appointment.update({
        where: { id },
        data: { slotId, serviceId, staffId: slot.staffId },
        include,
      });
    } catch (e) {
      this.handleConflict(e);
    }
  }

  async cancel(user: AuthUser, id: number) {
    const appt = await this.getOwned(user, id);
    if (appt.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment is already cancelled');
    }
    return this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
      include,
    });
  }

  // ---------- helpers ----------

  private async getOwned(user: AuthUser, id: number) {
    const appt = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (user.role !== Role.ADMIN && appt.customerId !== user.id) {
      throw new ForbiddenException('You can only access your own appointments');
    }
    return appt;
  }

  private async validate(slotId: number, serviceId: number) {
    const slot = await this.prisma.timeSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.startTime <= new Date()) throw new BadRequestException('Cannot book a past slot');

    const service = await this.prisma.service.findFirst({ where: { id: serviceId, isActive: true } });
    if (!service) throw new NotFoundException('Service not found');

    const link = await this.prisma.staffService.findUnique({
      where: { staffId_serviceId: { staffId: slot.staffId, serviceId } },
    });
    if (!link) throw new BadRequestException('This staff member does not perform this service');

    return slot;
  }

  private handleConflict(e: unknown): never {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      throw new ConflictException('This time slot is already booked');
    }
    throw e;
  }
}