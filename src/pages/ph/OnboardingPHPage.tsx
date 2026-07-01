import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { OnboardingDraft } from "./onboarding/types";
import { Ico, Button, onlyDigits } from "./onboarding/ui";
import { StepConjunto } from "./onboarding/StepConjunto";
import { StepCuota } from "./onboarding/StepCuota";
import { StepUnidades, StepPropietarios, sumCoef } from "./onboarding/StepUnidades";
import { StepZonas, StepResumen, SuccessScreen } from "./onboarding/StepZonas";

const INITIAL_DRAFT: OnboardingDraft = {
  conjunto: { nombre: '', direccion: '', ciudad: '', nit: '', numUnidades: '' },
  cuotaBase: '',
  unidades: [],
  zonas: [],
};

const STEPS = [
  { n: 1, label: 'Conjunto', icon: Ico.building },
  { n: 2, label: 'Cuota', icon: Ico.coin },
  { n: 3, label: 'Unidades', icon: Ico.grid },
  { n: 4, label: 'Propietarios', icon: Ico.users },
  { n: 5, label: 'Zonas', icon: Ico.trees },
];
const TOTAL = STEPS.length;
const REVIEW = TOTAL + 1;

function validateStep(step: number, data: OnboardingDraft) {
  const e: unknown = {};
  if (step === 1) {
    const c = data.conjunto;
    if (!c.nombre.trim()) e.nombre = 'Ingresa el nombre del conjunto.';
    if (!c.direccion.trim()) e.direccion = 'Ingresa la dirección.';
    if (onlyDigits(c.nit).length < 9) e.nit = 'El NIT debe tener al menos 9 dígitos.';
    if (!c.numUnidades || Number(c.numUnidades) < 1) e.numUnidades = 'Indica cuántas unidades hay.';
  }
  if (step === 2) {
    if (!(Number(data.cuotaBase) > 0)) e.cuotaBase = 'Ingresa un valor mayor a cero.';
  }
  if (step === 3) {
    if (data.unidades.length === 0) e._ = 'Agrega al menos una unidad para continuar.';
    else if (Math.abs(100 - sumCoef(data.unidades)) >= 0.05) e._ = 'Los coeficientes de copropiedad deben sumar 100%.';
  }
  return e;
}

function StepperDesktop({ step, onJump }: unknown) {
  return (
    <div className="flex items-center max-w-3xl mx-auto">
      {STEPS.map((s, i) => {
        const done = step > s.n || step === REVIEW;
        const active = step === s.n;
        const clickable = done;
        return (
          <React.Fragment key={s.n}>
            <button type="button" disabled={!clickable} onClick={() => clickable && onJump(s.n)}
              className={`flex items-center gap-2.5 ${clickable ? 'cursor-pointer group' : 'cursor-default'}`}>
              <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition shrink-0
                ${active ? 'bg-primary text-white ring-4 ring-primary/15' : done ? 'bg-primary text-white' : 'bg-white text-slate-400 border border-slate-300'}`}>
                {done ? <Ico.check className="w-4 h-4" /> : s.n}
              </span>
              <div className="text-left leading-tight hidden md:block">
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${active || done ? 'text-primary' : 'text-slate-400'}`}>Paso {s.n}</p>
                <p className={`text-[13px] font-semibold ${active ? 'text-slate-900' : done ? 'text-slate-600 group-hover:text-primary' : 'text-slate-400'}`}>{s.label}</p>
              </div>
            </button>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 rounded-full bg-slate-200 overflow-hidden min-w-[20px]">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: step > s.n || step === REVIEW ? '100%' : '0%' }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function OnboardingPHPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [data, setData] = useState<OnboardingDraft>(INITIAL_DRAFT);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<unknown>({});
  const [finished, setFinished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Cargar borrador al montar
  useEffect(() => {
    const saved = localStorage.getItem("ph_onboarding_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Compat: el formato antiguo guardaba solo el draft, sin envoltura.
        if (parsed && typeof parsed === "object" && "data" in parsed) {
          setData(parsed.data);
          if (typeof parsed.step === "number") setStep(parsed.step);
        } else {
          setData(parsed);
        }
      } catch (e) { }
    }
  }, []);

  // Guardar borrador al cambiar
  useEffect(() => {
    localStorage.setItem("ph_onboarding_draft", JSON.stringify({ data, step }));
  }, [data, step]);

  // Scroll al top al cambiar de paso
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [step]);

  const goTo = (n: number) => setStep(n);

  const handleNext = () => {
    const err = validateStep(step, data);
    setErrors(err);
    if (Object.keys(err).length === 0) {
      setStep((s) => Math.min(s + 1, REVIEW));
    }
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleFinish = async () => {
    const err = validateStep(REVIEW, data);
    if (Object.keys(err).length > 0) return;

    if (!user?.id) {
      toast.error("Debes iniciar sesión para crear un conjunto");
      return;
    }

    setIsSaving(true);
    try {
      // 'tenants' no tiene columna 'ciudad': se pliega dentro de 'direccion'.
      const direccionCompleta = [data.conjunto.direccion, data.conjunto.ciudad]
        .map((s) => s?.trim())
        .filter(Boolean)
        .join(', ');

      // Crear/actualizar tenant + admin de forma atómica y server-side.
      // RPC SECURITY DEFINER: fija rol='admin_ph' y user_id server-side, y es
      // idempotente (si el tenant ya existe desde el registro, lo actualiza).
      // El cliente ya no se auto-inserta en miembros (aislamiento multi-tenant).
      const { data: tenantId, error: rpcError } = await supabase.rpc('configurar_conjunto_ph', {
        p_nombre: data.conjunto.nombre,
        p_nit: data.conjunto.nit,
        p_direccion: direccionCompleta,
        p_num_unidades: parseInt(data.conjunto.numUnidades) || 0,
        p_cuota_mensual: Math.round(parseFloat(data.cuotaBase) || 0),
      });

      if (rpcError) throw rpcError;

      // Preparar propietarios únicos
      const dueños: unknown = {};
      data.unidades.forEach(u => {
        if (u.owner?.nombre?.trim()) {
          const key = u.owner.email?.toLowerCase().trim() || u.owner.nombre.trim();
          if (!dueños[key]) dueños[key] = { ...u.owner, db_id: null };
        }
      });

      const promisesMiembros = Object.values(dueños).map(async (d: unknown) => {
        const { data: m, error } = await supabase
          .from('miembros')
          .insert({
            tenant_id: tenantId,
            nombre_completo: d.nombre,
            email: d.email || null,
            telefono: d.telefono || null,
            rol: 'propietario'
          })
          .select()
          .single();
        if (error) throw error;
        d.db_id = m.id;
      });
      await Promise.all(promisesMiembros);

      // La cuota base mensual vive en tenants.cuota_mensual (guardada en el insert del tenant).
      // Las cuotas por unidad NO se generan aquí: son un cobro masivo con previsualización
      // obligatoria desde Cobros (Principio 5 / Flujo 2). No tocar cuotas_administracion en onboarding.

      // Crear unidades
      const dbUnidades = data.unidades.map(u => {
        const dKey = u.owner?.email?.toLowerCase().trim() || u.owner?.nombre?.trim();
        const dId = dKey ? dueños[dKey]?.db_id : null;

        return {
          tenant_id: tenantId,
          numero: u.numero,
          torre: u.torre || null,
          tipo: u.tipo,
          piso: parseInt(u.piso) || null,
          coeficiente: parseFloat(u.coef) || 0,
          miembro_id: dId || null,
        };
      });

      if (dbUnidades.length > 0) {
        const { error: errorU } = await supabase.from('unidades').insert(dbUnidades);
        if (errorU) throw errorU;
      }

      // Crear zonas
      const dbZonas = data.zonas.map(z => ({
        tenant_id: tenantId,
        nombre: z.nombre,
        capacidad_max: parseInt(z.capacidad) || null,
        horario_apertura: z.apertura + ':00',
        horario_cierre: z.cierre + ':00'
      }));

      if (dbZonas.length > 0) {
        const { error: errorZ } = await supabase.from('zonas_comunes').insert(dbZonas);
        if (errorZ) throw errorZ;
      }

      // Seed obligaciones legales iniciales (Fase 6 — Ley 675 de 2001)
      // No-throw: el tenant ya existe; el seed es idempotente (ON CONFLICT DO NOTHING).
      const { error: seedError } = await supabase.rpc('seed_obligaciones_iniciales', {
        p_tenant_id: tenantId,
      });
      if (seedError) {
        // No abortar el onboarding por esto — el admin puede reintentarlo desde Cumplimiento
        console.warn('[onboarding] seed_obligaciones_iniciales falló:', seedError.message);
      }

      localStorage.removeItem("ph_onboarding_draft");
      setFinished(true);
      toast.success("Conjunto configurado exitosamente");
    } catch (error: unknown) {
      toast.error(error.message || "Error al crear el conjunto");
    } finally {
      setIsSaving(false);
    }
  };

  if (finished) {
    return (
      <div className="h-screen bg-slate-50 flex items-center justify-center">
        <SuccessScreen 
          data={data} 
          onRestart={() => { setData(INITIAL_DRAFT); setStep(1); setFinished(false); }} 
          onDashboard={() => navigate('/ph/dashboard')}
        />
      </div>
    );
  }

  const blockMsg = errors._;
  const isReview = step === REVIEW;

  return (
    <div className="h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header & Stepper */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-4 md:px-7 md:py-5 sticky top-0 z-10">
        <StepperDesktop step={step} onJump={goTo} />
      </div>

      {/* Main Content Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-7 md:py-8">
        <div className="max-w-3xl mx-auto">
          {step === 1 && <StepConjunto data={data} setData={setData} errors={errors} />}
          {step === 2 && <StepCuota data={data} setData={setData} errors={errors} />}
          {step === 3 && <StepUnidades data={data} setData={setData} />}
          {step === 4 && <StepPropietarios data={data} setData={setData} />}
          {step === 5 && <StepZonas data={data} setData={setData} />}
          {step === REVIEW && <StepResumen data={data} goTo={goTo} />}
        </div>
      </div>

      {/* Footer Nav */}
      <div className="shrink-0 bg-white border-t border-slate-200 px-4 py-4 md:px-7 sticky bottom-0 z-10">
        {blockMsg && (
          <div className="flex items-center gap-2 mb-2.5 text-[13px] font-medium text-red-500 max-w-3xl mx-auto anim-fade">
            <Ico.alert className="w-4 h-4 shrink-0" />{blockMsg}
          </div>
        )}
        <div className="flex items-center gap-3 max-w-3xl mx-auto">
          {step > 1 ? (
            <Button variant="secondary" onClick={handleBack} disabled={isSaving}>
              <Ico.chevL className="w-4 h-4" /> Atrás
            </Button>
          ) : (
            <div className="text-[13px] text-slate-400 hidden sm:flex items-center gap-1.5">
              <Ico.save className="w-4 h-4" /> Borrador guardado
            </div>
          )}

          {isReview ? (
            <Button variant="success" className="flex-1 sm:flex-none sm:ml-auto sm:px-8" size="lg" onClick={handleFinish} disabled={isSaving}>
              {isSaving ? "Creando..." : <><Ico.check className="w-5 h-5" /> Crear conjunto</>}
            </Button>
          ) : (
            <Button className="flex-1 sm:flex-none sm:ml-auto sm:px-8" size="lg" onClick={handleNext}>
              {step === TOTAL ? 'Revisar y confirmar' : 'Continuar'} <Ico.chevR className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
