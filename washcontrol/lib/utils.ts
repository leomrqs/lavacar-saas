import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatar valores monetários — chamar apenas em Client Components */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Formatar duração em minutos para "Xmin" ou "Xh Ymin" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}min`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

/** Calcular diferença em minutos entre duas datas */
export function diffMinutes(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / 60000;
}

/** Forçar data para T12:00:00Z (evita bug de fuso horário UTC) */
export function toSafeDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00Z`);
}

/** Gerar slug a partir de um nome */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Rótulos em PT-BR para OrderStatus */
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Agendado",
  WAITING_QUEUE: "Aguardando",
  IN_PROGRESS: "Lavando",
  READY: "Pronto",
  COMPLETED: "Finalizado",
  CANCELED: "Cancelado",
};

/** Rótulos em PT-BR para VehicleType */
export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  CAR: "Carro",
  MOTORCYCLE: "Moto",
  TRUCK: "Caminhão",
  VAN: "Van",
  SUV: "SUV",
};

/** Rótulos de método de pagamento */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  CARTAO_CREDITO: "Cartão de Crédito",
  CARTAO_DEBITO: "Cartão de Débito",
};

/** Classes de badge por status */
export const ORDER_STATUS_CLASSES: Record<string, string> = {
  PENDING:
    "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  WAITING_QUEUE:
    "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  IN_PROGRESS:
    "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  READY:
    "bg-teal-500/10 text-teal-400 border border-teal-500/20",
  COMPLETED:
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  CANCELED:
    "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
};
