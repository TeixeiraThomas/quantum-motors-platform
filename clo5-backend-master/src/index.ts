import { existsSync } from "fs";
import { resolve } from "path";
import cors from "cors";
import { configDotenv } from "dotenv";
import express from "express";
import { BatteryRouter } from "./Router/BatteryRouter";
import { CarRouter } from "./Router/CarRouter";
import { ColorRouter } from "./Router/ColorRouter";
import { FinishRouter } from "./Router/FinishRouter";
import { ModelRouter } from "./Router/ModelRouter";
import { ServiceRouter } from "./Router/ServiceRouter";

/**
 * Start Express server.
 */
function loadEnvironment() {
  const appEnv = process.env.APP_ENV || process.env.NODE_ENV;
  const baseEnvPath = resolve(process.cwd(), ".env");

  if (existsSync(baseEnvPath)) {
    configDotenv({
      path: baseEnvPath,
      override: false,
    });
  }

  if (!appEnv) {
    return;
  }

  const scopedEnvPath = resolve(process.cwd(), `.env.${appEnv}`);
  if (existsSync(scopedEnvPath)) {
    configDotenv({
      path: scopedEnvPath,
      override: true,
    });
  }
}

async function startServer() {
  loadEnvironment();

  const portAssigned = Number(process.env.PORT) || 3000;
  const hostAssigned = process.env.HOST || "localhost";
  const app = express();
  app.use("/images", express.static(__dirname + "/../images"));

  const options: cors.CorsOptions = {
    origin: process.env.CORS_ORIGIN,
  };

  // Then pass these options to cors:
  app.use(cors(options));
  app.use(express.json());
  app.use(ModelRouter.init());
  app.use(FinishRouter.init());
  app.use(BatteryRouter.init());
  app.use(ColorRouter.init());
  app.use(CarRouter.init());
  app.use(ServiceRouter.init());

  try {
    await app.listen({ port: portAssigned, host: hostAssigned });
    console.log(`🚀 Server ready at //${hostAssigned}:${portAssigned}`);
  } catch (err) {
    console.log("Failed to start server");
    console.log(err);
    process.exit(1);
  }
}

// Call startServer() to start our Express server
startServer();
