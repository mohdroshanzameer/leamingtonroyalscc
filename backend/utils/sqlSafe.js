const { DB_TABLES, DB_COLUMNS } = require("../db/pool");

function pascalToSnake(str = "") {
  return String(str)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

function pluralizeSnake(snake = "") {
  if (snake.endsWith("y")) return snake.slice(0, -1) + "ies";
  if (snake.endsWith("s")) return snake + "es";
  return snake + "s";
}

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function resolveTable(entityName) {
  const snake = pascalToSnake(entityName);
  const plural = pluralizeSnake(snake);

  if (DB_TABLES.has(plural)) return plural;
  if (DB_TABLES.has(snake)) return snake;
  const raw = String(entityName || "").toLowerCase();
  if (DB_TABLES.has(raw)) return raw;
  return null;
}

function resolveOrderBy(tableName, sortParam) {
  if (!sortParam) return null;
  const cols = DB_COLUMNS.get(tableName);
  if (!cols) return null;

  const s = String(sortParam);
  const desc = s.startsWith("-");
  const col = desc ? s.slice(1) : s;

  if (!cols.has(col)) return null;
  return { col, desc };
}

module.exports = { quoteIdent, resolveTable, resolveOrderBy };