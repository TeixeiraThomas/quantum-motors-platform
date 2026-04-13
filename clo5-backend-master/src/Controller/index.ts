import { Router } from "express";
import { Request, Response } from "express";

const router = Router();

// Health check
router.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    service: "quantum-motors-api",
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || "1.0.0"
  });
});

// Routes métier
// (Les routes existantes sont dans les autres contrôleurs)

export default router;