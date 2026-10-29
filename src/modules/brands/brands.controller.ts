import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { brandChecklist, getBrand, listBrands, saveBrand } from './brand-library';

class SaveBrandDto {
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]{1,48}$/, { message: 'id must be 2-49 lowercase letters, digits or dashes' })
  slug!: string;

  @IsString()
  @MinLength(200)
  @MaxLength(400_000)
  content!: string;
}

/** The brand systems every UI follows (brands/*.md). Adding a brand is admin-only (access-policy). */
@Controller('brands')
export class BrandsController {
  @Get()
  list() {
    return listBrands();
  }

  @Get(':slug')
  async one(@Param('slug') slug: string) {
    const brand = await getBrand(slug);
    if (!brand) throw new NotFoundException(`No brand "${slug}"`);
    const { content, ...summary } = brand;
    return { ...summary, platformChecklist: brandChecklist(content, 'platform'), websiteChecklist: brandChecklist(content, 'website') };
  }

  @Post()
  async save(@Body() dto: SaveBrandDto) {
    try {
      return await saveBrand(dto.slug, dto.content);
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
  }
}
