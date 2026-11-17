import "dotenv/config";

const requiredInProduction = ["MONGODB_URI", "JWT_SECRET"] as const;

for (const key of requiredInProduction) {
  if (process.env.NODE_ENV === "production" && !process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/lendly",
  jwtSecret: process.env.JWT_SECRET ?? "lendly-local-development-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5175",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5175",
  // The prototype returns the reset token in the response so the flow can be
  // demoed without a mail server. Never enable this in production.
  exposeResetToken:
    process.env.EXPOSE_RESET_TOKEN === "true" ||
    (process.env.EXPOSE_RESET_TOKEN !== "false" && (process.env.NODE_ENV ?? "development") !== "production"),
};
