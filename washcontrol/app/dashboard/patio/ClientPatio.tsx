"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { cn, VEHICLE_TYPE_LABELS } from "@/lib/utils";
import { updateOrderStatus } from "@/actions/os";
import {
  Car,
  Bike,
  Truck,
  Clock,
  Phone,
  GripVertical,
  RefreshCw,
} from "lucide-react";

type OrderStatus = "WAITING_QUEUE" | "IN_PROGRESS" | "READY";

interface PatioOrder {
  id: string;
  status: OrderStatus;
  total: number;
  customerName: string;
  customerPhone: string | null;
  vehiclePlate: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleColor: string | null;
  vehicleType: string;
  serviceName: string;
  startedAt: string | null;
  createdAt: string;
}

interface Props {
  initialOrders: PatioOrder[];
  role: string;
  tenantId: string;
}

const COLUMN_CONFIG = {
  WAITING_QUEUE: {
    title: "Aguardando",
    color: "border-sky-500/30",
    headerColor: "bg-sky-500/10 text-sky-400",
    dotColor: "bg-sky-400",
  },
  IN_PROGRESS: {
    title: "Lavando",
    color: "border-purple-500/30",
    headerColor: "bg-purple-500/10 text-purple-400",
    dotColor: "bg-purple-400",
  },
  READY: {
    title: "Pronto",
    color: "border-teal-500/30",
    headerColor: "bg-teal-500/10 text-teal-400",
    dotColor: "bg-teal-400",
  },
} as const;

// Transições permitidas por role
function canDrag(
  from: OrderStatus,
  to: OrderStatus,
  role: string
): boolean {
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    WAITING_QUEUE: ["IN_PROGRESS"],
    IN_PROGRESS: ["READY"],
    READY: role === "MANAGER" ? [] : [],
  };
  if (role === "WASHER") {
    return allowed[from]?.includes(to) ?? false;
  }
  // MANAGER pode mover em qualquer direção (exceto READY→*  que é COMPLETED)
  const managerAllowed: Record<OrderStatus, OrderStatus[]> = {
    WAITING_QUEUE: ["IN_PROGRESS"],
    IN_PROGRESS: ["READY", "WAITING_QUEUE"],
    READY: ["IN_PROGRESS"],
  };
  return managerAllowed[from]?.includes(to) ?? false;
}

function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  const isLong = min >= 30;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs font-mono",
        isLong ? "text-red-400" : "text-zinc-400"
      )}
    >
      <Clock className="w-3 h-3" />
      {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
    </div>
  );
}

function VehicleIcon({ type }: { type: string }) {
  if (type === "MOTORCYCLE") return <Bike className="w-4 h-4" />;
  if (type === "TRUCK") return <Truck className="w-4 h-4" />;
  return <Car className="w-4 h-4" />;
}

function OrderCard({
  order,
  isDragging = false,
}: {
  order: PatioOrder;
  isDragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3",
        isDragging && "opacity-90 shadow-2xl border-zinc-600"
      )}
    >
      {/* Placa + veículo */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400">
            <VehicleIcon type={order.vehicleType} />
          </div>
          <div>
            <p className="text-sm font-bold text-white tracking-wider">
              {order.vehiclePlate}
            </p>
            <p className="text-xs text-zinc-500">
              {[order.vehicleBrand, order.vehicleModel, order.vehicleColor]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>
        <GripVertical className="w-4 h-4 text-zinc-600 mt-1 cursor-grab active:cursor-grabbing" />
      </div>

      {/* Serviço */}
      <div className="bg-zinc-800/60 rounded-lg px-3 py-1.5">
        <p className="text-xs text-zinc-300 truncate">{order.serviceName}</p>
      </div>

      {/* Cliente + Timer */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-300">{order.customerName}</p>
          {order.customerPhone && (
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <Phone className="w-3 h-3" />
              {order.customerPhone}
            </div>
          )}
        </div>
        {order.startedAt && order.status === "IN_PROGRESS" && (
          <ElapsedTimer startedAt={order.startedAt} />
        )}
      </div>
    </div>
  );
}

function SortableOrderCard({
  order,
  role,
  onStatusChange,
}: {
  order: PatioOrder;
  role: string;
  onStatusChange: (id: string, status: OrderStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: order.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <OrderCard order={order} />
    </div>
  );
}

export function ClientPatio({ initialOrders, role, tenantId }: Props) {
  const [orders, setOrders] = useState<PatioOrder[]>(initialOrders);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const columns: OrderStatus[] = ["WAITING_QUEUE", "IN_PROGRESS", "READY"];

  const getColumnOrders = (status: OrderStatus) =>
    orders.filter((o) => o.status === status);

  const activeOrder = activeId ? orders.find((o) => o.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || active.id === over.id) return;

      const fromOrder = orders.find((o) => o.id === active.id);
      if (!fromOrder) return;

      // Determinar coluna de destino
      const toStatus = columns.find(
        (col) =>
          col === over.id ||
          orders.find((o) => o.id === over.id)?.status === col
      );

      const targetStatus = (over.id as string) in COLUMN_CONFIG
        ? (over.id as OrderStatus)
        : orders.find((o) => o.id === over.id)?.status;

      if (!targetStatus || targetStatus === fromOrder.status) return;

      if (!canDrag(fromOrder.status, targetStatus as OrderStatus, role)) {
        toast.error("Você não tem permissão para esta transição.");
        return;
      }

      // Otimismo: atualizar UI antes da requisição
      setOrders((prev) =>
        prev.map((o) =>
          o.id === fromOrder.id ? { ...o, status: targetStatus as OrderStatus } : o
        )
      );

      try {
        await updateOrderStatus(fromOrder.id, targetStatus);
        toast.success("Status atualizado.");
      } catch (err) {
        // Reverter
        setOrders((prev) =>
          prev.map((o) =>
            o.id === fromOrder.id ? { ...o, status: fromOrder.status } : o
          )
        );
        toast.error(err instanceof Error ? err.message : "Erro ao atualizar status.");
      }
    },
    [orders, role]
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Em produção, usaria router.refresh() — aqui simulamos recarga
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div>
          <h1 className="text-lg font-bold text-white">Pátio</h1>
          <p className="text-xs text-zinc-500">
            {orders.length} {orders.length === 1 ? "veículo" : "veículos"} no pátio
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all text-sm"
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          Atualizar
        </button>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 h-full p-6 overflow-x-auto">
            {columns.map((col) => {
              const config = COLUMN_CONFIG[col];
              const colOrders = getColumnOrders(col);

              return (
                <div
                  key={col}
                  className={cn(
                    "flex flex-col w-80 min-w-[20rem] rounded-xl border bg-zinc-900/50",
                    config.color
                  )}
                >
                  {/* Column header */}
                  <div className={cn("flex items-center gap-2 px-4 py-3 rounded-t-xl", config.headerColor)}>
                    <span className={cn("w-2 h-2 rounded-full", config.dotColor)} />
                    <span className="text-sm font-semibold">{config.title}</span>
                    <span className="ml-auto text-xs font-bold bg-white/10 rounded-full w-5 h-5 flex items-center justify-center">
                      {colOrders.length}
                    </span>
                  </div>

                  {/* Drop zone */}
                  <SortableContext
                    id={col}
                    items={colOrders.map((o) => o.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div
                      className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]"
                    >
                      {colOrders.length === 0 ? (
                        <div className="flex items-center justify-center h-24 border-2 border-dashed border-zinc-800 rounded-lg">
                          <p className="text-xs text-zinc-600">Arraste aqui</p>
                        </div>
                      ) : (
                        colOrders.map((order) => (
                          <SortableOrderCard
                            key={order.id}
                            order={order}
                            role={role}
                            onStatusChange={() => {}}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeOrder && <OrderCard order={activeOrder} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
