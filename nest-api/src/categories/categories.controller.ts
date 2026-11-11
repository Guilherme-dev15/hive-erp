import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AuthGuard } from '../auth/auth.guard';
import { SubscriptionGuard } from '../billing/subscription.guard';

@Controller('api/v2/categories')
@UseGuards(AuthGuard, SubscriptionGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.categoriesService.findAll(req.user.id);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(req.user.id, dto);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.categoriesService.remove(req.user.id, id);
  }
}
