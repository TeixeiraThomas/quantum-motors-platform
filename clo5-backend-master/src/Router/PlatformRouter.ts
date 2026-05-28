import { PlatformController } from "../Controller/PlatformController";
import { BaseRouter } from "./BaseRouter";
import { RouterInterface } from "./RouterInterface";

export class PlatformRouter extends BaseRouter implements RouterInterface {
  controller: PlatformController = new PlatformController();

  run(): void {
    this.router.get(
      "/platform/summary",
      this.controller.summary.bind(this.controller)
    );

    this.router.get(
      "/platform/configurations",
      this.controller.listConfigurations.bind(this.controller)
    );
    this.router.post(
      "/platform/configurations",
      this.controller.createConfiguration.bind(this.controller)
    );

    this.router.get(
      "/platform/orders",
      this.controller.listOrders.bind(this.controller)
    );
    this.router.post(
      "/platform/orders",
      this.controller.createOrder.bind(this.controller)
    );

    this.router.get(
      "/platform/fleet",
      this.controller.listFleetVehicles.bind(this.controller)
    );
    this.router.post(
      "/platform/fleet",
      this.controller.createFleetVehicle.bind(this.controller)
    );

    this.router.get(
      "/platform/maintenance",
      this.controller.listMaintenanceAppointments.bind(this.controller)
    );
    this.router.post(
      "/platform/maintenance",
      this.controller.createMaintenanceAppointment.bind(this.controller)
    );

    this.router.get(
      "/platform/crm-leads",
      this.controller.listCrmLeads.bind(this.controller)
    );
    this.router.post(
      "/platform/crm-leads",
      this.controller.createCrmLead.bind(this.controller)
    );
  }
}
