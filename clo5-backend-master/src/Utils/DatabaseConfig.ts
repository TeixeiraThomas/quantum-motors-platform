const {
  DB_HOST = "mariadb",
  DB_PORT = "3306",
  DB_USER = "quantum_user",
  DB_PASSWORD = "changeme",
  DB_NAME = "quantum_motors",
  NODE_ENV = "development"
} = process.env;

const DATABASE_URL =
  `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public`;

console.log(`[DatabaseConfig] Connecting to ${DB_HOST}:${DB_PORT}/${DB_NAME} (env: ${NODE_ENV})`);

export default DATABASE_URL;