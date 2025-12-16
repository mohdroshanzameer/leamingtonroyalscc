// frontend/src/utils/formatters.js

export function formatCurrency(value, currency = "GBP") {
  const num =
    typeof value === "number"
      ? value
      : value == null
      ? 0
      : Number(String(value).replace(/,/g, ""));

  if (!Number.isFinite(num)) return "";

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(num);
}
