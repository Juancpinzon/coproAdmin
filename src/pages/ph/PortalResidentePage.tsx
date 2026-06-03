import { useState } from "react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useTenant } from "@/hooks/useTenant";
import { useMiembroContext } from "@/contexts/MiembroContext";
import { useAuth } from "@/hooks/useAuth";
import { useUnidades } from "@/hooks/useUnidades";
import { useCuotasAdmin } from "@/hooks/useCuotasAdmin";
import { useZonasComunes } from "@/hooks/useZonasComunes";
import { useReservasByUnidad, useCreateReserva } from "@/hooks/useReservas";
import { usePQR, useCreatePQR } from "@/hooks/usePQR";
import {
  useConsentimientoVigente,
  useRegistrarConsentimiento,
  useSolicitudesARCOPropias,
  useCrearSolicitudARCO,
  ETIQUETAS_ARCO,
  type TipoARCO,
} from "@/hooks/useConsentimientos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCOP } from "@/lib/utils";
import {
  AlertTriangle,
  Plus,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
} from "lucide-react";

// ─── Versión de política vigente ────────────────────────────────
// Actualizar aquí cuando se publique una nueva política de privacidad.
const VERSION_POLITICA = "v1.0";

// ─── Banner de consentimiento ────────────────────────────────────

interface BannerConsentimientoProps {
  onAceptar: () => void;
  isPending: boolean;
}

function BannerConsentimiento({ onAceptar, isPending }: BannerConsentimientoProps) {
  return (
    <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-blue-900 text-sm leading-snug">
            Autorización de tratamiento de datos personales
          </p>
          <p className="text-blue-800 text-sm leading-relaxed">
            Al usar este portal, tus datos personales (nombre, email, teléfono,
            estado de cuenta) son tratados por la administración del conjunto
            para la gestión de la copropiedad, según la{" "}
            <strong>Ley 1581 de 2012</strong>. Tus datos no se comparten con
            terceros sin tu autorización.
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          id="btn-aceptar-consentimiento"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-11"
          onClick={onAceptar}
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4 mr-2" />
          )}
          {isPending ? "Registrando…" : "Acepto el tratamiento de mis datos"}
        </Button>
        <Button variant="outline" size="sm" className="sm:self-center" asChild>
          <Link to="/politica-privacidad" target="_blank">
            Ver política completa
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── Modal ARCO ──────────────────────────────────────────────────

interface ModalArcoProps {
  tipo: TipoARCO;
  onClose: () => void;
}

function ModalArco({ tipo, onClose }: ModalArcoProps) {
  const [descripcion, setDescripcion] = useState("");
  const { toast } = useToast();
  const crearSolicitud = useCrearSolicitudARCO();

  const handleEnviar = async () => {
    if (!descripcion.trim()) return;
    try {
      await crearSolicitud.mutateAsync({ tipo, descripcion });
      toast({
        title: "Solicitud recibida",
        description: "Recibirás una respuesta en máximo 10 días hábiles.",
      });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al enviar la solicitud";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 py-2">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Describe con detalle tu solicitud de{" "}
        <strong>{ETIQUETAS_ARCO[tipo].toLowerCase()}</strong>. La administración
        tiene un plazo de <strong>10 días hábiles</strong> para responder
        (Ley 1581/2012, Art. 22).
      </p>
      <div className="space-y-2">
        <Label htmlFor={`arco-desc-${tipo}`}>Descripción</Label>
        <textarea
          id={`arco-desc-${tipo}`}
          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
          placeholder={`Explica qué datos y por qué solicitas ${ETIQUETAS_ARCO[tipo].toLowerCase()}…`}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {descripcion.trim().length} caracteres
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          id={`btn-enviar-arco-${tipo}`}
          className="flex-1"
          onClick={handleEnviar}
          disabled={!descripcion.trim() || crearSolicitud.isPending}
        >
          {crearSolicitud.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          {crearSolicitud.isPending ? "Enviando…" : "Enviar solicitud"}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─── Sección ARCO ────────────────────────────────────────────────

const TIPOS_ARCO: TipoARCO[] = ["acceso", "rectificacion", "cancelacion", "oposicion"];

const ICONO_ARCO: Record<TipoARCO, string> = {
  acceso:        "📋",
  rectificacion: "✏️",
  cancelacion:   "🗑️",
  oposicion:     "🚫",
};

function SeccionARCO() {
  const [abierto, setAbierto] = useState(false);
  const [tipoActivo, setTipoActivo] = useState<TipoARCO | null>(null);
  const { data: solicitudes = [], isLoading } = useSolicitudesARCOPropias();

  const solicitudesActivas = solicitudes.filter((s) => s.estado !== "resuelta");

  return (
    <Card>
      <CardHeader
        className="flex flex-row items-center justify-between cursor-pointer select-none"
        onClick={() => setAbierto((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-lg">Mis derechos sobre mis datos</CardTitle>
          {solicitudesActivas.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {solicitudesActivas.length} activa{solicitudesActivas.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        {abierto ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </CardHeader>

      {abierto && (
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Según la <strong>Ley 1581 de 2012</strong>, tienes derecho a
            conocer, corregir, eliminar u oponerte al tratamiento de tus datos
            personales. La administración debe responderte en máximo{" "}
            <strong>10 días hábiles</strong>.
          </p>

          {/* Botones ARCO */}
          <div className="grid grid-cols-2 gap-3">
            {TIPOS_ARCO.map((tipo) => (
              <Dialog
                key={tipo}
                open={tipoActivo === tipo}
                onOpenChange={(open) => setTipoActivo(open ? tipo : null)}
              >
                <DialogTrigger asChild>
                  <Button
                    id={`btn-arco-${tipo}`}
                    variant="outline"
                    className="h-auto py-3 flex-col gap-1 text-left items-start"
                  >
                    <span className="text-lg leading-none">{ICONO_ARCO[tipo]}</span>
                    <span className="text-sm font-medium leading-snug">
                      {ETIQUETAS_ARCO[tipo]}
                    </span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {ICONO_ARCO[tipo]} {ETIQUETAS_ARCO[tipo]}
                    </DialogTitle>
                  </DialogHeader>
                  <ModalArco tipo={tipo} onClose={() => setTipoActivo(null)} />
                </DialogContent>
              </Dialog>
            ))}
          </div>

          {/* Historial de solicitudes */}
          {!isLoading && solicitudes.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Mis solicitudes
              </p>
              {solicitudes.map((s) => (
                <div
                  key={s.id}
                  className="border rounded-lg p-3 text-sm space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {ICONO_ARCO[s.tipo]} {ETIQUETAS_ARCO[s.tipo]}
                    </span>
                    <Badge
                      variant={
                        s.estado === "resuelta"
                          ? "outline"
                          : s.plazoVencido
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {s.estado === "resuelta"
                        ? "Resuelta"
                        : s.plazoVencido
                        ? `Plazo vencido`
                        : `${s.diasRestantes}d restantes`}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs line-clamp-2">
                    {s.descripcion}
                  </p>
                  {s.respuesta && (
                    <div className="mt-1 p-2 bg-muted rounded text-xs">
                      <span className="font-medium">Respuesta: </span>
                      {s.respuesta}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cargando solicitudes…
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>
              Tus solicitudes son gestionadas por la administración del conjunto
              bajo la Ley 1581/2012.
            </span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Página principal ────────────────────────────────────────────

export default function PortalResidentePage() {
  const { user } = useAuth();
  const { data: tenant } = useTenant();
  const { miembro } = useMiembroContext();
  const { toast } = useToast();

  const { data: unidades = [] } = useUnidades();
  const misUnidades = unidades.filter((u) => u.miembro_id === miembro.id);
  const unidadSeleccionada = misUnidades[0];

  const { data: cuotas = [] } = useCuotasAdmin();
  const misCuotas = cuotas.filter((c) => c.unidad_id === unidadSeleccionada?.id);

  const tieneMora = misCuotas.some((c) => c.estado === "vencido");
  const cuotaMes = misCuotas.find(
    (c) => c.periodo === format(new Date(), "yyyy-MM-01")
  );

  const { data: zonas = [] } = useZonasComunes();
  const zonasActivas = zonas.filter((z) => z.activa);

  const createReserva = useCreateReserva();
  const createPQR = useCreatePQR();

  const { data: pqrs = [] } = usePQR(unidadSeleccionada?.id);

  // ── Consentimiento ────────────────────────────────────────────
  const { tieneConsentimiento, isLoading: loadingConsent } =
    useConsentimientoVigente(VERSION_POLITICA);
  const registrarConsentimiento = useRegistrarConsentimiento();

  const handleAceptarConsentimiento = async () => {
    try {
      await registrarConsentimiento.mutateAsync({
        version_politica: VERSION_POLITICA,
        acepto: true,
        canal: "portal",
      });
      toast({
        title: "Gracias",
        description: "Tu autorización quedó registrada.",
      });
    } catch {
      toast({
        title: "Error",
        description: "No se pudo registrar el consentimiento. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  // ── Reservas ──────────────────────────────────────────────────
  const [newReserva, setNewReserva] = useState({
    zona_id: "",
    fecha: format(new Date(), "yyyy-MM-dd"),
    hora_inicio: "10:00",
    hora_fin: "11:00",
  });

  // ── PQR ───────────────────────────────────────────────────────
  const [isPQROpen, setIsPQROpen] = useState(false);
  const [newPQR, setNewPQR] = useState<{
    tipo: "peticion" | "queja" | "reclamo";
    asunto: string;
    descripcion: string;
  }>({
    tipo: "peticion",
    asunto: "",
    descripcion: "",
  });

  const handleCreateReserva = async () => {
    const zona = zonas.find((z) => z.id === newReserva.zona_id);
    if (!zona) return;

    if (tieneMora && zona.bloquear_en_mora) {
      toast({
        title: "Acceso denegado",
        description: "No puedes reservar esta zona por mora",
        variant: "destructive",
      });
      return;
    }

    try {
      await createReserva.mutateAsync({
        tenant_id: tenant!.id,
        miembro_id: miembro.id,
        unidad_id: unidadSeleccionada.id,
        ...newReserva,
      });
      toast({ title: "Éxito", description: "Reserva confirmada" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al reservar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const handleCreatePQR = async () => {
    try {
      await createPQR.mutateAsync({
        tenant_id: tenant!.id,
        miembro_id: miembro.id,
        unidad_id: unidadSeleccionada.id,
        ...newPQR,
      });
      toast({ title: "Éxito", description: "PQR enviada" });
      setIsPQROpen(false);
    } catch {
      toast({
        title: "Error",
        description: "No se pudo enviar la PQR",
        variant: "destructive",
      });
    }
  };

  if (!unidadSeleccionada) {
    return (
      <div className="text-center p-8">No tienes unidades asignadas.</div>
    );
  }

  const zonaSeleccionadaParaReserva = zonas.find(
    (z) => z.id === newReserva.zona_id
  );
  const puedeReservar = !(
    tieneMora && zonaSeleccionadaParaReserva?.bloquear_en_mora
  );

  return (
    <div className="max-w-[480px] mx-auto space-y-6 pb-8">
      {/* Encabezado */}
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-2xl font-bold">{tenant?.nombre}</h1>
        <p className="text-xl text-muted-foreground font-medium">
          Unidad {unidadSeleccionada.numero}
        </p>
      </div>

      {/* Banner de consentimiento — solo si no tiene y ya terminó de cargar */}
      {!loadingConsent && !tieneConsentimiento && (
        <BannerConsentimiento
          onAceptar={handleAceptarConsentimiento}
          isPending={registrarConsentimiento.isPending}
        />
      )}

      {/* Estado de cuenta */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estado de cuenta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground">Estado actual</span>
            {tieneMora ? (
              <Badge variant="destructive" className="text-sm">
                En mora
              </Badge>
            ) : (
              <Badge className="bg-success text-success-foreground text-sm">
                Al día
              </Badge>
            )}
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-muted-foreground">Cuota del mes</span>
            <span className="text-xl font-mono font-bold">
              {cuotaMes ? formatCOP(cuotaMes.monto) : "---"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Reservar zona */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reservar zona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={newReserva.zona_id}
            onValueChange={(v) => setNewReserva({ ...newReserva, zona_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una zona" />
            </SelectTrigger>
            <SelectContent>
              {zonasActivas.map((z) => (
                <SelectItem key={z.id} value={z.id}>
                  {z.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {zonaSeleccionadaParaReserva &&
            tieneMora &&
            zonaSeleccionadaParaReserva.bloquear_en_mora && (
              <div className="bg-destructive/10 text-destructive p-3 rounded-md flex items-start gap-2 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <p>Esta zona está bloqueada para unidades con cartera en mora.</p>
              </div>
            )}

          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={newReserva.fecha}
              onChange={(e) =>
                setNewReserva({ ...newReserva, fecha: e.target.value })
              }
              disabled={!puedeReservar}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Inicio</Label>
              <Input
                type="time"
                value={newReserva.hora_inicio}
                onChange={(e) =>
                  setNewReserva({ ...newReserva, hora_inicio: e.target.value })
                }
                disabled={!puedeReservar}
              />
            </div>
            <div className="space-y-2">
              <Label>Fin</Label>
              <Input
                type="time"
                value={newReserva.hora_fin}
                onChange={(e) =>
                  setNewReserva({ ...newReserva, hora_fin: e.target.value })
                }
                disabled={!puedeReservar}
              />
            </div>
          </div>

          <Button
            className="w-full h-12 text-lg mt-2"
            onClick={handleCreateReserva}
            disabled={
              !puedeReservar ||
              !newReserva.zona_id ||
              createReserva.isPending
            }
          >
            Confirmar Reserva
          </Button>
        </CardContent>
      </Card>

      {/* PQR */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Mis PQR</CardTitle>
          <Dialog open={isPQROpen} onOpenChange={setIsPQROpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" /> Nueva PQR
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva PQR</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newPQR.tipo}
                    onValueChange={(v) =>
                      setNewPQR({ ...newPQR, tipo: v as "peticion" | "queja" | "reclamo" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="peticion">Petición</SelectItem>
                      <SelectItem value="queja">Queja</SelectItem>
                      <SelectItem value="reclamo">Reclamo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Asunto</Label>
                  <Input
                    value={newPQR.asunto}
                    onChange={(e) =>
                      setNewPQR({ ...newPQR, asunto: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newPQR.descripcion}
                    onChange={(e) =>
                      setNewPQR({ ...newPQR, descripcion: e.target.value })
                    }
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreatePQR}
                  disabled={
                    !newPQR.asunto || !newPQR.descripcion || createPQR.isPending
                  }
                >
                  Enviar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {pqrs.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              No tienes PQR registradas.
            </p>
          ) : (
            pqrs.map((pqr) => (
              <div key={pqr.id} className="border p-3 rounded-lg text-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{pqr.asunto}</span>
                  <Badge
                    variant={
                      pqr.estado === "abierto"
                        ? "default"
                        : pqr.estado === "en_gestion"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {pqr.estado}
                  </Badge>
                </div>
                <p className="text-muted-foreground truncate">{pqr.descripcion}</p>
                {pqr.respuesta && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <span className="font-medium">Respuesta:</span> {pqr.respuesta}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Sección ARCO — Mis derechos sobre mis datos */}
      <SeccionARCO />
    </div>
  );
}
