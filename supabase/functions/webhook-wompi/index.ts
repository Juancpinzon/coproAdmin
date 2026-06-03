import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// TODO: Reemplazar con el secret real del webhook Wompi (dashboard.wompi.co → Webhooks)
// Configurar como secret en Supabase: supabase secrets set WOMPI_WEBHOOK_SECRET=xxx
const WOMPI_WEBHOOK_SECRET = Deno.env.get("WOMPI_WEBHOOK_SECRET") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
// TODO: Configurar como secret: supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Wompi firma los eventos con HMAC-SHA256.
// Concatena: properties + timestamp + secret, luego SHA256 hex.
async function verificarFirmaWompi(
  body: string,
  signatureHeader: string | null,
  timestampHeader: string | null,
): Promise<boolean> {
  if (!signatureHeader || !timestampHeader || !WOMPI_WEBHOOK_SECRET) return false;

  const payload = `${body}${timestampHeader}${WOMPI_WEBHOOK_SECRET}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(WOMPI_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hex === signatureHeader;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Wompi solo envía POST
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await req.text();

  const signatureHeader = req.headers.get("x-event-signature");
  const timestampHeader = req.headers.get("x-event-timestamp");

  const firmaValida = await verificarFirmaWompi(rawBody, signatureHeader, timestampHeader);
  if (!firmaValida) {
    // Loguear pero responder 200 para no dejar Wompi en loop de reintentos
    console.error("Firma Wompi inválida — evento descartado", { signatureHeader });
    return new Response("ok", { status: 200 });
  }

  let evento: Record<string, unknown>;
  try {
    evento = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    console.error("Body no es JSON válido");
    return new Response("ok", { status: 200 });
  }

  const tipoEvento = evento["event"] as string | undefined;

  if (tipoEvento !== "transaction.updated") {
    // Evento no relevante para este webhook — ignorar silenciosamente
    return new Response("ok", { status: 200 });
  }

  const data = evento["data"] as Record<string, unknown> | undefined;
  const transaction = data?.["transaction"] as Record<string, unknown> | undefined;

  if (!transaction) {
    console.error("Payload sin campo transaction", evento);
    return new Response("ok", { status: 200 });
  }

  const transactionId = transaction["id"] as string | undefined;
  const status = transaction["status"] as string | undefined;
  const referenceCode = transaction["reference"] as string | undefined; // = cuota_admin_id

  if (!transactionId || !referenceCode) {
    console.error("transaction.id o reference ausente", transaction);
    return new Response("ok", { status: 200 });
  }

  if (status !== "APPROVED") {
    console.log(`Transacción ${transactionId} con status ${status} — sin acción`);
    return new Response("ok", { status: 200 });
  }

  // Solo se usa service_role dentro de una Edge Function segura en servidor — nunca en cliente
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Verificar que la cuota existe y está pendiente antes de actualizar
  const { data: cuota, error: fetchError } = await supabase
    .from("cuotas_administracion")
    .select("id, tenant_id, unidad_id, monto, estado")
    .eq("id", referenceCode)
    .single();

  if (fetchError || !cuota) {
    console.error("Cuota no encontrada", { referenceCode, fetchError });
    return new Response("ok", { status: 200 });
  }

  if (cuota.estado === "pagado") {
    // Idempotencia: Wompi puede reenviar el mismo evento
    console.log(`Cuota ${referenceCode} ya estaba pagada — idempotente`);
    return new Response("ok", { status: 200 });
  }

  // Marcar cuota como pagada
  const { error: updateError } = await supabase
    .from("cuotas_administracion")
    .update({
      estado: "pagado",
      fecha_pago: new Date().toISOString(),
      referencia_wompi: transactionId,
    })
    .eq("id", referenceCode)
    .eq("estado", "pendiente"); // guardia adicional contra race conditions

  if (updateError) {
    console.error("Error actualizando cuota", updateError);
    // No reintentamos — el estado ya puede ser 'pagado' por otro evento concurrente
    return new Response("ok", { status: 200 });
  }

  // Registrar movimiento de fondo
  const { error: movimientoError } = await supabase
    .from("movimientos_fondo")
    .insert({
      tenant_id: cuota.tenant_id,
      tipo: "ingreso",
      monto: cuota.monto,
      descripcion: `Pago online Wompi — cuota ${referenceCode}`,
      fecha: new Date().toISOString().slice(0, 10),
      categoria: "administracion",
    });

  if (movimientoError) {
    // La cuota ya quedó pagada; el movimiento fallido es recuperable manualmente
    console.error("Error insertando movimiento_fondo", movimientoError);
  }

  console.log(`Cuota ${referenceCode} pagada via Wompi transaction ${transactionId}`);
  return new Response("ok", { status: 200 });
});
