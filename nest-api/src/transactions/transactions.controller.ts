import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/v2/transactions')
@UseGuards(AuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.transactionsService.findAll(req.user.id);
  }

  @Post()
  create(@Body() createTransactionDto: CreateTransactionDto, @Request() req: any) {
    return this.transactionsService.create(createTransactionDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.transactionsService.remove(id, req.user.id);
  }
}
