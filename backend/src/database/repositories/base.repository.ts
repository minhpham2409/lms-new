import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResponse } from '../../shared/interfaces';

/**
 * Base repository providing common CRUD and pagination operations.
 * All domain repositories should extend this class.
 */
@Injectable()
export abstract class BaseRepository<T> {
  constructor(protected readonly prisma: PrismaService) {}

  abstract get model(): any;

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<T[]> {
    return this.model.findMany(params);
  }

  async create(data: any): Promise<T> {
    return this.model.create({ data });
  }

  async update(id: string, data: any): Promise<T> {
    return this.model.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } });
  }

  async count(where?: any): Promise<number> {
    return this.model.count({ where });
  }

  async findOne(where: any): Promise<T | null> {
    return this.model.findFirst({ where });
  }

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    select?: any;
    include?: any;
  }): Promise<T[]> {
    return this.model.findMany(params);
  }

  async deleteMany(where: any): Promise<{ count: number }> {
    return this.model.deleteMany({ where });
  }

  /**
   * Paginated find with standardized response format.
   * Returns `{ data, meta: { total, page, limit, totalPages } }`.
   *
   * @param params.page   - 1-indexed page number (default 1)
   * @param params.limit  - items per page (default 20)
   * @param params.where  - Prisma where clause
   * @param params.orderBy - Prisma orderBy clause
   * @param params.select  - Prisma select clause (mutually exclusive with include)
   * @param params.include - Prisma include clause (mutually exclusive with select)
   */
  async findPaginated(params: {
    page?: number;
    limit?: number;
    where?: any;
    orderBy?: any;
    select?: any;
    include?: any;
  }): Promise<PaginatedResponse<T>> {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const queryParams: any = {
      skip,
      take: limit,
      where: params.where,
      orderBy: params.orderBy,
    };

    // select and include are mutually exclusive in Prisma
    if (params.select) {
      queryParams.select = params.select;
    } else if (params.include) {
      queryParams.include = params.include;
    }

    const [data, total] = await Promise.all([
      this.model.findMany(queryParams),
      this.model.count({ where: params.where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
