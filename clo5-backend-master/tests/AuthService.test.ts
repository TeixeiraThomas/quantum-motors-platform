import { AuthService } from "../src/Service/AuthService";

describe("AuthService", () => {
  it("should authenticate a user", () => {
    process.env.ADMIN_PASSWORD = "test";
    const req = {
      headers: {
        authorization: "test",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    const next = jest.fn();
    AuthService.login(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
  });

  it("should reject invalid credentials", () => {
    process.env.ADMIN_PASSWORD = "test";
    const req = {
      headers: {
        authorization: "wrong-password",
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    const next = jest.fn();
    AuthService.login(req, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({
      code: 401,
      message: "Access forbidden",
    });
  });
});
