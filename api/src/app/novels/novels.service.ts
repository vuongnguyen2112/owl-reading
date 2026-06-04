import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createSlug } from '@owl-reading/shared-utils';
import { NovelStatus, Prisma } from '@prisma/client';
import { getPagination, toPaginatedResponse } from '../common/pagination';
import { PrismaService } from '../database/prisma.service';
import { CreateNovelDto } from './dto/create-novel.dto';
import { ListNovelsQueryDto } from './dto/list-novels-query.dto';
import { toNovelResponseDto } from './dto/novel-response.dto';
import { UpdateNovelDto } from './dto/update-novel.dto';

@Injectable()
export class NovelsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(query: ListNovelsQueryDto) {
    const where: Prisma.NovelWhereInput = {
      status: NovelStatus.PUBLISHED,
      ...this.buildSearchWhere(query.search),
    };
    const { skip, take } = getPagination(query.page, query.pageSize);
    const [items, total] = await Promise.all([
      this.prisma.novel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.novel.count({ where }),
    ]);

    return toPaginatedResponse(
      items.map(toNovelResponseDto),
      total,
      query.page,
      query.pageSize,
    );
  }

  async listAdmin(query: ListNovelsQueryDto) {
    const where = this.buildSearchWhere(query.search);
    const { skip, take } = getPagination(query.page, query.pageSize);
    const [items, total] = await Promise.all([
      this.prisma.novel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.novel.count({ where }),
    ]);

    return toPaginatedResponse(items, total, query.page, query.pageSize);
  }

  async findPublishedBySlug(slug: string) {
    const novel = await this.prisma.novel.findFirst({
      where: { slug, status: NovelStatus.PUBLISHED },
    });

    if (!novel) {
      throw new NotFoundException('Published novel was not found.');
    }

    return toNovelResponseDto(novel);
  }

  async findAdminById(id: string) {
    const novel = await this.prisma.novel.findUnique({ where: { id } });

    if (!novel) {
      throw new NotFoundException('Novel was not found.');
    }

    return novel;
  }

  async create(dto: CreateNovelDto) {
    try {
      return await this.prisma.novel.create({
        data: {
          title: dto.title,
          slug: this.toSlug(dto.slug ?? dto.title),
          description: dto.description,
          coverImageUrl: dto.coverImageUrl,
          status: dto.status ?? NovelStatus.DRAFT,
        },
      });
    } catch (error) {
      this.handleKnownError(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateNovelDto) {
    try {
      return await this.prisma.novel.update({
        where: { id },
        data: {
          title: dto.title,
          slug: dto.slug ? this.toSlug(dto.slug) : undefined,
          description: dto.description,
          coverImageUrl: dto.coverImageUrl,
          status: dto.status,
        },
      });
    } catch (error) {
      this.handleKnownError(error);
      throw error;
    }
  }

  async delete(id: string) {
    try {
      return await this.prisma.novel.delete({ where: { id } });
    } catch (error) {
      this.handleKnownError(error);
      throw error;
    }
  }

  private buildSearchWhere(search?: string): Prisma.NovelWhereInput {
    if (!search?.trim()) {
      return {};
    }

    return {
      title: {
        contains: search.trim(),
        mode: 'insensitive',
      },
    };
  }

  private toSlug(value: string): string {
    const slug = createSlug(value);

    if (!slug) {
      throw new ConflictException('Novel slug could not be generated.');
    }

    return slug;
  }

  private handleKnownError(error: unknown): void {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return;
    }

    if (error.code === 'P2002') {
      throw new ConflictException('Novel slug already exists.');
    }

    if (error.code === 'P2025') {
      throw new NotFoundException('Novel was not found.');
    }
  }
}
