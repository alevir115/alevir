import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let dni: string | null = new URL(req.url).searchParams.get("dni");
  if (!dni && req.method === "POST") {
    try {
      const body = await req.json();
      dni = body?.dni != null ? String(body.dni) : null;
    } catch { /* ignore */ }
  }
  dni = dni?.replace(/\D/g, "") ?? "";
  if (!dni) return json({ error: "Debe enviar el campo 'dni'" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data, error } = await supabase
    .from("clientes")
    .select("id, dni, apellido, nombre, cuit, telefono, created_at")
    .eq("dni", dni)
    .maybeSingle();

  if (error) return json({ error: "Error al consultar" }, 500);
  if (!data) return json({ error: "Cliente no encontrado" }, 404);
  return json(data);
});
