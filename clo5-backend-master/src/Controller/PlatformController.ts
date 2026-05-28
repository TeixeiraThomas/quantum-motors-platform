import { PlatformService } from "../Service/PlatformService";

type Handler = () => Promise<unknown>;

export class PlatformController {
  private service: PlatformService;

  public constructor() {
    this.service = new PlatformService();
  }

  public async summary(_: any, res: any) {
    return this.send(res, () => this.service.summary());
  }

  public async listConfigurations(_: any, res: any) {
    return this.send(res, () => this.service.listConfigurations());
  }

  public async createConfiguration(req: any, res: any) {
    return this.send(res, () => this.service.createConfiguration(req.body), 201);
  }

  public async listOrders(_: any, res: any) {
    return this.send(res, () => this.service.listOrders());
  }

  public async createOrder(req: any, res: any) {
    return this.send(res, () => this.service.createOrder(req.body), 201);
  }

  public async listFleetVehicles(_: any, res: any) {
    return this.send(res, () => this.service.listFleetVehicles());
  }

  public async createFleetVehicle(req: any, res: any) {
    return this.send(res, () => this.service.createFleetVehicle(req.body), 201);
  }

  public async listMaintenanceAppointments(_: any, res: any) {
    return this.send(res, () => this.service.listMaintenanceAppointments());
  }

  public async createMaintenanceAppointment(req: any, res: any) {
    return this.send(
      res,
      () => this.service.createMaintenanceAppointment(req.body),
      201
    );
  }

  public async listCrmLeads(_: any, res: any) {
    return this.send(res, () => this.service.listCrmLeads());
  }

  public async createCrmLead(req: any, res: any) {
    return this.send(res, () => this.service.createCrmLead(req.body), 201);
  }

  private async send(res: any, handler: Handler, successStatus = 200) {
    try {
      const value = await handler();
      return res.status(successStatus).json({
        code: successStatus,
        value,
      });
    } catch (error) {
      const err = error as Error;

      return res.status(400).json({
        code: 400,
        message: err.message,
      });
    }
  }
}
