import { format, formatDistanceToNow } from "date-fns";

export const formatDate = (value?: string | Date, pattern = "dd MMM yyyy") => {
  if (!value) return "Not set";
  return format(new Date(value), pattern);
};

export const formatTimeAgo = (value: string) => `${formatDistanceToNow(new Date(value), { addSuffix: true })}`;

export const formatCurrency = (amount: number, currency = "PKR") =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatPercent = (value: number) => `${Math.round(value * 10) / 10}%`;

export const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);
