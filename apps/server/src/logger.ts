import winston from "winston";
import { config } from "./config.js";

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    config.NODE_ENV === "production"
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, stack }) => {
            const msg = stack || message;
            return `${timestamp} [${level}] ${msg}`;
          }),
        ),
  ),
  transports: [new winston.transports.Console()],
});
