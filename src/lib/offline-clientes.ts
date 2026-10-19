// Soporte sin conexión para clientes: guarda una copia local y una cola de cambios
// pendientes que se envían a la base de datos cuando vuelve internet.

export interface Cliente {
  id: number;
  dni: string | null;
  apellido: string;
  nombre: string;
  cuit: string;
  telefono: string | null;
}

export type ClienteData = Omit<Cliente, "id">;

export type PendingOp =
  | { kind: "insert"; tempId: number; data: ClienteData }
  | { kind: "update"; id: number; data: ClienteData }
  | { kind: "delete"; id: number };

const CACHE_KEY = "clientes_cache_v1";
const QUEUE_KEY = "clientes_pending_v1";

const read = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const loadCache = () => read<Cliente[]>(CACHE_KEY, []);
export const saveCache = (c: Cliente[]) => localStorage.setItem(CACHE_KEY, JSON.stringify(c));
export const loadQueue = () => read<PendingOp[]>(QUEUE_KEY, []);
export const saveQueue = (q: PendingOp[]) => localStorage.setItem(QUEUE_KEY, JSON.stringify(q));

/** IDs temporales (negativos) para clientes creados sin conexión. */
export const newTempId = () => -Date.now() - Math.floor(Math.random() * 1000);

/** Agrega un cambio a la cola, combinándolo con cambios previos sobre clientes aún no enviados. */
export function enqueue(queue: PendingOp[], op: PendingOp): PendingOp[] {
  if (op.kind === "update" && op.id < 0) {
    return queue.map((q) => (q.kind === "insert" && q.tempId === op.id ? { ...q, data: op.data } : q));
  }
  if (op.kind === "delete" && op.id < 0) {
    return queue.filter((q) => !(q.kind === "insert" && q.tempId === op.id));
  }
  if (op.kind === "update") {
    return [...queue.filter((q) => !(q.kind === "update" && q.id === op.id)), op];
  }
  if (op.kind === "delete") {
    return [...queue.filter((q) => !(q.kind === "update" && q.id === op.id)), op];
  }
  return [...queue, op];
}

/** Aplica los cambios pendientes sobre la lista para mostrarlos en pantalla. */
export function applyQueue(clientes: Cliente[], queue: PendingOp[]): Cliente[] {
  let list = [...clientes];
  for (const op of queue) {
    if (op.kind === "insert") list.push({ id: op.tempId, ...op.data });
    if (op.kind === "update") list = list.map((c) => (c.id === op.id ? { id: c.id, ...op.data } : c));
    if (op.kind === "delete") list = list.filter((c) => c.id !== op.id);
  }
  return list.sort((a, b) => a.apellido.localeCompare(b.apellido));
}

export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  const msg = String((err as { message?: string })?.message ?? err ?? "");
  return /fetch|network|load failed/i.test(msg);
}

type Runner = (op: PendingOp) => Promise<{ error: unknown | null }>;

/**
 * Envía la cola en orden. Si se corta internet, deja el resto para después.
 * Los cambios rechazados por la base (por ejemplo, DNI repetido) se descartan y se cuentan.
 */
export async function flushQueue(queue: PendingOp[], run: Runner) {
  let remaining = [...queue];
  let sent = 0;
  let rejected = 0;
  while (remaining.length) {
    const op = remaining[0];
    let error: unknown | null = null;
    try {
      ({ error } = await run(op));
    } catch (e) {
      error = e;
    }
    if (error && isNetworkError(error)) break;
    if (error) rejected++;
    else sent++;
    remaining = remaining.slice(1);
  }
  return { remaining, sent, rejected };
}
