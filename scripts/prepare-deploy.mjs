import "dotenv/config";

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mariadb from "mariadb";

const HISTORICAL_MIGRATIONS = [
  "202606101_mysql_initial",
  "20260611214636_site_settings_and_order_adjustments",
  "20260702090000_custom_request_order_link",
  "20260703093000_product_cost_batches",
  "20260703140000_admin_push_subscriptions",
  "20260704062045_admin_notifications",
];

const REQUIRED_TABLES = [
  "AdminUser",
  "Category",
  "Product",
  "ProductImage",
  "Ingredient",
  "IngredientPurchase",
  "Recipe",
  "RecipeIngredient",
  "Promotion",
  "Order",
  "OrderItem",
  "ProductRating",
  "CustomerUser",
  "SinpePaymentProof",
  "Review",
  "CustomDessertRequest",
  "OrderAdjustment",
  "SiteSettings",
  "ProductCostBatch",
  "ProductCostItem",
  "PushSubscription",
  "AdminNotification",
];

const CURRENT_MIGRATION = "20260717153406_site_about_and_policy_sections";
const CURRENT_COLUMNS = [
  "aboutDescription",
  "aboutEyebrow",
  "aboutImagePath",
  "aboutImageUrl",
  "aboutTitle",
  "refundPartialText",
  "refundReplacementText",
  "refundReviewText",
];

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL es requerida para preparar las migraciones.");
}

const parsedDatabaseUrl = new URL(databaseUrl);

if (!["mysql:", "mariadb:"].includes(parsedDatabaseUrl.protocol)) {
  throw new Error("DATABASE_URL debe usar el protocolo mysql o mariadb.");
}

const connection = await mariadb.createConnection({
  host: parsedDatabaseUrl.hostname,
  port: parsedDatabaseUrl.port
    ? Number.parseInt(parsedDatabaseUrl.port, 10)
    : 3306,
  user: decodeURIComponent(parsedDatabaseUrl.username),
  password: decodeURIComponent(parsedDatabaseUrl.password),
  database: decodeURIComponent(parsedDatabaseUrl.pathname.slice(1)),
});

function normalize(value) {
  return String(value).toLowerCase();
}

async function getMigrationRecords() {
  try {
    return await connection.query(
      "SELECT migration_name, finished_at, rolled_back_at FROM `_prisma_migrations`",
    );
  } catch (error) {
    if (error?.code === "ER_NO_SUCH_TABLE") {
      return [];
    }

    throw error;
  }
}

async function getExistingTables() {
  const rows = await connection.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()",
  );

  return new Set(rows.map((row) => normalize(row.TABLE_NAME)));
}

async function getSiteSettingsColumns() {
  const rows = await connection.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = LOWER(?)",
    ["SiteSettings"],
  );

  return new Set(rows.map((row) => normalize(row.COLUMN_NAME)));
}

function resolveMigration(migrationName) {
  const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  const prismaCli = path.join(
    projectRoot,
    "node_modules",
    "prisma",
    "build",
    "index.js",
  );
  const result = spawnSync(
    process.execPath,
    [prismaCli, "migrate", "resolve", "--applied", migrationName],
    {
      cwd: projectRoot,
      env: process.env,
      stdio: "inherit",
    },
  );

  if (result.status !== 0) {
    throw new Error(`No se pudo resolver la migración ${migrationName}.`);
  }
}

try {
  const records = await getMigrationRecords();
  const failed = records.filter(
    (record) => !record.finished_at && !record.rolled_back_at,
  );

  if (failed.length === 0) {
    console.log("Historial de migraciones listo.");
    process.exitCode = 0;
  } else {
    const unexpectedFailures = failed.filter(
      (record) => record.migration_name !== HISTORICAL_MIGRATIONS[0],
    );

    if (unexpectedFailures.length > 0) {
      throw new Error(
        `Hay migraciones fallidas no reconocidas: ${unexpectedFailures
          .map((record) => record.migration_name)
          .join(", ")}.`,
      );
    }

    const existingTables = await getExistingTables();
    const missingTables = REQUIRED_TABLES.filter(
      (table) => !existingTables.has(normalize(table)),
    );

    if (missingTables.length > 0) {
      throw new Error(
        `No se puede establecer la línea base porque faltan tablas: ${missingTables.join(", ")}.`,
      );
    }

    const applied = new Set(
      records
        .filter((record) => record.finished_at && !record.rolled_back_at)
        .map((record) => record.migration_name),
    );

    console.log(
      "La estructura histórica existe. Reparando únicamente el historial de Prisma.",
    );

    for (const migrationName of HISTORICAL_MIGRATIONS) {
      if (!applied.has(migrationName)) {
        resolveMigration(migrationName);
      }
    }

    const currentColumns = await getSiteSettingsColumns();
    const presentCurrentColumns = CURRENT_COLUMNS.filter((column) =>
      currentColumns.has(normalize(column)),
    );

    if (
      presentCurrentColumns.length > 0 &&
      presentCurrentColumns.length < CURRENT_COLUMNS.length
    ) {
      throw new Error(
        `La migración ${CURRENT_MIGRATION} está aplicada parcialmente.`,
      );
    }

    if (
      presentCurrentColumns.length === CURRENT_COLUMNS.length &&
      !applied.has(CURRENT_MIGRATION)
    ) {
      resolveMigration(CURRENT_MIGRATION);
    }

    console.log("Historial de migraciones reparado.");
  }
} finally {
  await connection.end();
}
