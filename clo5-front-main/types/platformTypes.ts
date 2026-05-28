export type PlatformSummary = {
  savedConfigurations: number;
  orders: number;
  fleetVehicles: number;
  upcomingMaintenance: number;
  crmLeads: number;
  recentOrders: VehicleOrder[];
  recentMaintenance: MaintenanceAppointment[];
};

export type SavedConfiguration = {
  id: number;
  customerName: string;
  customerEmail: string;
  country: string;
  locale: string;
  modelName: string;
  finishName?: string | null;
  batteryName?: string | null;
  colorName?: string | null;
  totalPrice: number;
  notes?: string | null;
  createdAt: string;
};

export type VehicleOrder = {
  id: number;
  reference: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  country: string;
  pointOfSale: string;
  vehicleModel: string;
  totalPrice: number;
  createdAt: string;
};

export type BusinessFleetVehicle = {
  id: number;
  companyName: string;
  contactName: string;
  contactEmail: string;
  country: string;
  vehicleLabel: string;
  vin?: string | null;
  licensePlate?: string | null;
  status: string;
  createdAt: string;
};

export type MaintenanceAppointment = {
  id: number;
  customerName?: string | null;
  customerEmail: string;
  vehicleLabel: string;
  serviceCenter: string;
  appointmentDate: string;
  serviceType: string;
  status: string;
  notes?: string | null;
  createdAt: string;
};

export type CrmLead = {
  id: number;
  source: string;
  status: string;
  fullName: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  topic: string;
  message: string;
  vehicleInterest?: string | null;
  createdAt: string;
};

export type PlatformData = {
  summary: PlatformSummary | null;
  configurations: SavedConfiguration[];
  orders: VehicleOrder[];
  fleet: BusinessFleetVehicle[];
  maintenance: MaintenanceAppointment[];
  crmLeads: CrmLead[];
};
