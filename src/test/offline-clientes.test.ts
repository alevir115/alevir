import { describe, it, expect } from "vitest";
import { enqueue, applyQueue, flushQueue, PendingOp, Cliente } from "@/lib/offline-clientes";

const data = { dni: "1", apellido: "A", nombre: "N", cuit: "c", telefono: null };
const base: Cliente[] = [{ id: 5, ...data }];

describe("cambios sin conexión", () => {
  it("un cliente creado sin conexión aparece en la lista", () => {
    const q = enqueue([], { kind: "insert", tempId: -1, data: { ...data, dni: "2", apellido: "B" } });
    expect(applyQueue(base, q).map((c) => c.id)).toEqual([5, -1]);
  });

  it("borrar sin conexión un cliente que nunca se envió no deja nada para enviar", () => {
    let q: PendingOp[] = enqueue([], { kind: "insert", tempId: -1, data });
    q = enqueue(q, { kind: "delete", id: -1 });
    expect(q).toEqual([]);
  });

  it("si se corta internet al sincronizar, los cambios quedan pendientes", async () => {
    const q: PendingOp[] = [{ kind: "delete", id: 5 }, { kind: "delete", id: 6 }];
    let calls = 0;
    const res = await flushQueue(q, async () => (++calls === 1 ? { error: null } : { error: new Error("Failed to fetch") }));
    expect(res.sent).toBe(1);
    expect(res.remaining).toEqual([{ kind: "delete", id: 6 }]);
  });
});
