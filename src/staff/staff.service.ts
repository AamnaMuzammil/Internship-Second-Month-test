import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { buildMeta } from '../common/utils/pagination';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { StaffQueryDto } from './dto/staff-query.dto';

const include = {
  services: {
    include: { service: { select: { id: true, name: true, durationMin: true, price: true } } },
  },
};

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll(q: StaffQueryDto) {
    const where: Prisma.StaffWhereInput = {
      isActive: true,
      ...(q.serviceId && { services: { some: { serviceId: q.serviceId } } }),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.staff.findMany({
        where,
        include,
        skip: (q.page - 1) * q.limit,
        take: q.limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.staff.count({ where }),
    ]);
    return { data, meta: buildMeta(total, q.page, q.limit) };
  }

  async findOne(id: number) {
    const staff = await this.prisma.staff.findFirst({ where: { id, isActive: true }, include });
    if (!staff) throw new NotFoundException('Staff member not found');
    return staff;
  }

  async create(dto: CreateStaffDto) {
    const ids = [...new Set(dto.serviceIds)];
    await this.assertServicesExist(ids);
    return this.prisma.staff.create({
      data: { name: dto.name, services: { create: ids.map((serviceId) => ({ serviceId })) } },
      include,
    });
  }

  async update(id: number, dto: UpdateStaffDto) {
    await this.findOne(id);
    const ids = dto.serviceIds ? [...new Set(dto.serviceIds)] : undefined;
    if (ids) await this.assertServicesExist(ids);

    return this.prisma.$transaction(async (tx) => {
      if (ids) {
        await tx.staffService.deleteMany({ where: { staffId: id } });
        await tx.staffService.createMany({
          data: ids.map((serviceId) => ({ staffId: id, serviceId })),
        });
      }
      return tx.staff.update({
        where: { id },
        data: { name: dto.name, isActive: dto.isActive },
        include,
      });
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.staff.update({ where: { id }, data: { isActive: false } });
    return { message: 'Staff member deactivated' };
  }

  private async assertServicesExist(ids: number[]) {
    const count = await this.prisma.service.count({ where: { id: { in: ids }, isActive: true } });
    if (count !== ids.length) throw new BadRequestException('One or more serviceIds are invalid');
  }
}