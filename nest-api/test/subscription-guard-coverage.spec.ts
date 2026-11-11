import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AuthGuard } from '../src/auth/auth.guard';
import { SuperAdminGuard } from '../src/auth/super-admin.guard';
import { SubscriptionGuard } from '../src/billing/subscription.guard';
import { ProductsController } from '../src/products/products.controller';
import { OrdersController } from '../src/orders/orders.controller';
import { CustomersController } from '../src/customers/customers.controller';
import { CategoriesController } from '../src/categories/categories.controller';
import { SuppliersController } from '../src/suppliers/suppliers.controller';
import { TransactionsController } from '../src/transactions/transactions.controller';
import { InventoryController } from '../src/inventory/inventory.controller';
import { CouponsController } from '../src/coupons/coupons.controller';
import { CampaignsController } from '../src/campaigns/campaigns.controller';
import { DashboardController } from '../src/dashboard/dashboard.controller';
import { ConfigController } from '../src/config/config.controller';
import { TeamController } from '../src/team/team.controller';
import { BillingController } from '../src/billing/billing.controller';
import { SuperAdminController } from '../src/super-admin/super-admin.controller';
import { PublicCatalogController } from '../src/public-catalog/public-catalog.controller';

describe('Auditoria de Cobertura de Guards (Fase B - Gate de Assinatura & SuperAdmin)', () => {
  const operationalControllers = [
    ProductsController,
    OrdersController,
    CustomersController,
    CategoriesController,
    SuppliersController,
    TransactionsController,
    InventoryController,
    CouponsController,
    CampaignsController,
    DashboardController,
    ConfigController,
    TeamController,
  ];

  it.each(operationalControllers)(
    '%p deve exigir [AuthGuard, SubscriptionGuard] no nível de classe',
    (controllerClass) => {
      const guards = Reflect.getMetadata(GUARDS_METADATA, controllerClass) ?? [];
      expect(guards).toContain(AuthGuard);
      expect(guards).toContain(SubscriptionGuard);
      expect(guards.indexOf(AuthGuard)).toBeLessThan(guards.indexOf(SubscriptionGuard));
    },
  );

  it('BillingController exige AuthGuard mas NÃO exige SubscriptionGuard (permite renovação após expiração)', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, BillingController) ?? [];
    expect(guards).toContain(AuthGuard);
    expect(guards).not.toContain(SubscriptionGuard);
  });

  it('SuperAdminController exige [AuthGuard, SuperAdminGuard]', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, SuperAdminController) ?? [];
    expect(guards).toContain(AuthGuard);
    expect(guards).toContain(SuperAdminGuard);
    expect(guards.indexOf(AuthGuard)).toBeLessThan(guards.indexOf(SuperAdminGuard));
  });

  it('PublicCatalogController permanece sem AuthGuard nem SubscriptionGuard (vitrine pública sempre acessível)', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, PublicCatalogController) ?? [];
    expect(guards).not.toContain(AuthGuard);
    expect(guards).not.toContain(SubscriptionGuard);
  });
});
