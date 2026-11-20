import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { AuthGuard } from '../auth/auth.guard';
import { SubscriptionGuard } from '../billing/subscription.guard';
import {
  CustomersQueryDto,
  CustomersListResponse,
  CustomerSummary,
} from './customers.types';

@Controller('api/v2/customers')
@UseGuards(AuthGuard, SubscriptionGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(
    @Request() req: any,
    @Query() query: CustomersQueryDto
  ): Promise<CustomersListResponse> {
    return this.customersService.findAll(req.user.id, query);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Request() req: any
  ): Promise<CustomerSummary> {
    return this.customersService.findOne(req.user.id, id);
  }
}
