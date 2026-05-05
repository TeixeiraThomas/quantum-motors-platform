import { Model } from "../Entity/Model";
import { ModelService } from "../Service/ModelService";
import { ValidatorResponse } from "../Type/All";
import fs from "node:fs";
import path from "node:path";

/**
 * @class ModelController
 * @description Controller for Model
 * @exports ModelController
 */
export class ModelController {
  private static resolveModelImageUrl(modelId: number | string) {
    const supportedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
    const imagesDir = path.resolve(__dirname, "../../images/models");
    let fallback = `${process.env.CAR_SERVICE_IMAGE_URL}/images/models/1.png`;

    for (const extension of supportedExtensions) {
      if (fs.existsSync(path.join(imagesDir, `1${extension}`))) {
        fallback = `${process.env.CAR_SERVICE_IMAGE_URL}/images/models/1${extension}`;
        break;
      }
    }

    for (const extension of supportedExtensions) {
      const absoluteFilePath = path.join(imagesDir, `${modelId}${extension}`);
      if (fs.existsSync(absoluteFilePath)) {
        return `${process.env.CAR_SERVICE_IMAGE_URL}/images/models/${modelId}${extension}`;
      }
    }

    return fallback;
  }

  /**
   * @private
   * @type {ModelService}
   * @memberof ModelController
   */
  private service: ModelService;

  /**
   * @constructor
   * @description Creates an instance of ModelController.
   * @memberof ModelController
   */
  public constructor() {
    this.service = new ModelService();
  }

  /**
   * @method create
   * @description Create a new Model
   * @memberof ModelController
   * @param {Request} req - The Request.
   * @param {Response} res - The Response
   * @returns {Promise<Response>} - A Promise that resolves to a Response.
   * @async
   */
  public async create(req: any, res: any): Promise<Model> {
    const validate: ValidatorResponse = await this.service.validate(req.body);
    if (!validate.sucess) {
      return res.status(400).json(validate);
    }
    const rs = await this.service.create(req.body);
    return rs
      ? res.status(201).json(rs)
      : res.status(400).json({ message: "Error on create a model" });
  }

  /**
   * @method list
   * @description List all Models
   * @memberof ModelController
   * @param {Request} req - The Request.
   * @param {Response} res - The Response
   * @returns {Promise<Response>} - A Promise that resolves to a Response.
   * @async
   */
  public async list(_: any, res: any): Promise<Model[]> {
    const rs = await this.service.findAll();
    for (let i = 0; i < rs.length; i++) {
      rs[i].image = ModelController.resolveModelImageUrl(rs[i].id);
    }
    return res.status(200).json(rs);
  }

  /**
   * @method update
   * @description Update a Model
   * @memberof ModelController
   * @param {number} id - The id.
   * @param {Request} req - The Request.
   * @param {Response} res - The Response
   * @returns {Promise<Response>} - A Promise that resolves to a Response.
   * @async
   */
  public async update(id: number, req: any, res: any): Promise<Model> {
    let rs = await this.service.findOne(id);
    if (!rs) {
      return res.status(404).json({ message: "Model not found" });
    }
    const validate: ValidatorResponse = await this.service.validate(req.body);
    if (!validate.sucess) {
      return res.status(400).json(validate);
    }
    rs = await this.service.update(id, req.body);
    return rs
      ? res.status(200).json(rs)
      : res.status(500).json({ message: `Cannot update model with id ${id}` });
  }

  /**
   * @method read
   * @description Read a Model
   * @memberof ModelController
   * @param {number} id - The id.
   * @param {Response} res - The Response
   * @returns {Promise<Response>} - A Promise that resolves to a Response.
   * @async
   */
  public async read(id: number, res: any): Promise<Model> {
    const rs = await this.service.findOne(id);
    return rs
      ? res.status(200).json(rs)
      : res.status(404).json({ message: "Model not found" });
  }

  /**
   * @method delete
   * @description Delete a Model
   * @memberof ModelController
   * @param {number} id - The id.
   * @param {Response} res - The Response
   * @returns {Promise<Response>} - A Promise that resolves to a Response.
   * @async
   */
  public async delete(id: number, res: any): Promise<Response> {
    const rs = await this.service.findOne(id);
    if (!rs) {
      return res.status(404).json({ code: 404, message: "Model not found" });
    }
    const rsDelete = await this.service.delete(id);
    return rsDelete
      ? res.status(200).json({ code: 200, message: "Model deleted" })
      : res.status(500).json({ message: `Cannot delete model with id ${id}` });
  }
}
