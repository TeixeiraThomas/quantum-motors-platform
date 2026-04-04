/**
 * This is a service class for authentication
 * @class
 * @classdesc This class is used to authenticate the user
 *
 */
export class AuthService {
  /**
   * This is a method for authenticating the user
   * @method
   * @param {any} req - The request object
   * @param {any} res - The response object
   * @param {any} next - The next object
   * @returns {void}
   */
  static async login(req: any, res: any, next: any) {
    const auth = req.headers.authorization;
    const adminPassword = process.env.ADMIN_PASSWORD || "P@ssw0rd!";

    if (auth === adminPassword) {
      next();
    } else {
      res.status(401);
      res.send({ code: 401, message: "Access forbidden" });
    }
  }
}
