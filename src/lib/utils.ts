import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, decimals?: number) {
  // Si se pasan decimales explícitos, usarlos
  if (decimals !== undefined) {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  // Auto: más decimales para precios pequeños
  const abs = Math.abs(value);
  const maxDecimals =
    abs === 0      ? 2 :
    abs < 0.001    ? 8 :
    abs < 0.01     ? 6 :
    abs < 0.1      ? 4 :
    abs < 1        ? 4 :
                     2;

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat('es-ES', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
