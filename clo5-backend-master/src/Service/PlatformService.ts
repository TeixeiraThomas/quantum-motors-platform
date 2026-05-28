import { PrismaConnection } from "../Utils/PrismaConnection";

type PlatformPayload = Record<string, unknown>;

const requiredString = (payload: PlatformPayload, field: string): string => {
  const value = payload[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }

  return value.trim();
};

const optionalString = (payload: PlatformPayload, field: string): string | null => {
  const value = payload[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return value.trim();
};

const optionalNumber = (payload: PlatformPayload, field: string): number | undefined => {
  const value = payload[field];
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const requiredDate = (payload: PlatformPayload, field: string): Date => {
  const value = requiredString(payload, field);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${field} must be a valid date`);
  }

  return parsed;
};

/**
 * Business platform service.
 * It covers the new customer journeys requested for phase 2.
 */
export class PlatformService {
  private prisma = PrismaConnection.getInstance() as any;

  public async summary() {
    const [
      savedConfigurations,
      orders,
      fleetVehicles,
      upcomingMaintenance,
      crmLeads,
      recentOrders,
      recentMaintenance,
    ] = await Promise.all([
      this.prisma.savedConfiguration.count(),
      this.prisma.vehicleOrder.count(),
      this.prisma.businessFleetVehicle.count({
        where: {
          status: {
            not: "RETIRED",
          },
        },
      }),
      this.prisma.maintenanceAppointment.count({
        where: {
          appointmentDate: {
            gte: new Date(),
          },
          status: "PLANNED",
        },
      }),
      this.prisma.crmLead.count({
        where: {
          status: {
            in: ["NEW", "SENT_TO_CRM", "QUALIFIED"],
          },
        },
      }),
      this.prisma.vehicleOrder.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.prisma.maintenanceAppointment.findMany({
        orderBy: { appointmentDate: "asc" },
        take: 5,
      }),
    ]);

    return {
      savedConfigurations,
      orders,
      fleetVehicles,
      upcomingMaintenance,
      crmLeads,
      recentOrders,
      recentMaintenance,
    };
  }

  public async listConfigurations() {
    return this.prisma.savedConfiguration.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  public async createConfiguration(payload: PlatformPayload) {
    return this.prisma.savedConfiguration.create({
      data: {
        customerName: requiredString(payload, "customerName"),
        customerEmail: requiredString(payload, "customerEmail"),
        country: optionalString(payload, "country") || "France",
        locale: optionalString(payload, "locale") || "fr-FR",
        modelName: requiredString(payload, "modelName"),
        finishName: optionalString(payload, "finishName"),
        batteryName: optionalString(payload, "batteryName"),
        colorName: optionalString(payload, "colorName"),
        totalPrice: optionalNumber(payload, "totalPrice") || 0,
        notes: optionalString(payload, "notes"),
      },
    });
  }

  public async listOrders() {
    return this.prisma.vehicleOrder.findMany({
      include: {
        configuration: true,
        crmLead: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  public async createOrder(payload: PlatformPayload) {
    const crmLeadId = optionalNumber(payload, "crmLeadId");
    const configurationId = optionalNumber(payload, "configurationId");

    return this.prisma.vehicleOrder.create({
      data: {
        reference: this.buildOrderReference(),
        customerName: requiredString(payload, "customerName"),
        customerEmail: requiredString(payload, "customerEmail"),
        customerPhone: optionalString(payload, "customerPhone"),
        country: optionalString(payload, "country") || "France",
        pointOfSale: requiredString(payload, "pointOfSale"),
        vehicleModel: requiredString(payload, "vehicleModel"),
        totalPrice: optionalNumber(payload, "totalPrice") || 0,
        configurationId,
        crmLeadId,
      },
    });
  }

  public async listFleetVehicles() {
    return this.prisma.businessFleetVehicle.findMany({
      include: {
        maintenanceAppointments: {
          orderBy: { appointmentDate: "asc" },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  public async createFleetVehicle(payload: PlatformPayload) {
    return this.prisma.businessFleetVehicle.create({
      data: {
        companyName: requiredString(payload, "companyName"),
        contactName: requiredString(payload, "contactName"),
        contactEmail: requiredString(payload, "contactEmail"),
        country: optionalString(payload, "country") || "France",
        vehicleLabel: requiredString(payload, "vehicleLabel"),
        vin: optionalString(payload, "vin"),
        licensePlate: optionalString(payload, "licensePlate"),
      },
    });
  }

  public async listMaintenanceAppointments() {
    return this.prisma.maintenanceAppointment.findMany({
      include: {
        configuration: true,
        fleetVehicle: true,
      },
      orderBy: { appointmentDate: "asc" },
      take: 50,
    });
  }

  public async createMaintenanceAppointment(payload: PlatformPayload) {
    const configurationId = optionalNumber(payload, "configurationId");
    const fleetVehicleId = optionalNumber(payload, "fleetVehicleId");

    return this.prisma.maintenanceAppointment.create({
      data: {
        customerName: optionalString(payload, "customerName"),
        customerEmail: requiredString(payload, "customerEmail"),
        vehicleLabel: requiredString(payload, "vehicleLabel"),
        serviceCenter: requiredString(payload, "serviceCenter"),
        appointmentDate: requiredDate(payload, "appointmentDate"),
        serviceType: optionalString(payload, "serviceType") || "REVISION",
        notes: optionalString(payload, "notes"),
        configurationId,
        fleetVehicleId,
      },
    });
  }

  public async listCrmLeads() {
    return this.prisma.crmLead.findMany({
      include: {
        orders: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  public async createCrmLead(payload: PlatformPayload) {
    return this.prisma.crmLead.create({
      data: {
        source: optionalString(payload, "source") || "CONTACT_FORM",
        fullName: requiredString(payload, "fullName"),
        email: requiredString(payload, "email"),
        phone: optionalString(payload, "phone"),
        company: optionalString(payload, "company"),
        topic: requiredString(payload, "topic"),
        message: requiredString(payload, "message"),
        vehicleInterest: optionalString(payload, "vehicleInterest"),
      },
    });
  }

  private buildOrderReference(): string {
    const dateSegment = Date.now().toString(36).toUpperCase();
    const randomSegment = Math.random().toString(36).slice(2, 7).toUpperCase();

    return `QM-${dateSegment}-${randomSegment}`;
  }
}
