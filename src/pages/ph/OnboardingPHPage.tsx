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
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: data.conjunto.nombre,
          tenant_type: 'propiedad_horizontal',
          nit: data.conjunto.nit,
          direccion: data.conjunto.direccion,
          ciudad: data.conjunto.ciudad,
          num_unidades: parseInt(data.conjunto.numUnidades) || 0,
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Unirse como administrador
      const { error: adminError } = await supabase
        .from('miembros')
        .insert({
          tenant_id: tenant.id,
          user_id: user.id,
          nombre: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin',
          email: user.email,
          rol: 'admin_ph'
        });

      if (adminError) {
        await supabase.from('tenants').delete().eq('id', tenant.id);
        throw adminError;
      }

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
            tenant_id: tenant.id,
            nombre: d.nombre,
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

      // Crear cuota base
      const { data: cuota, error: cuotaError } = await supabase
        .from('cuotas_administracion')
        .insert({
          tenant_id: tenant.id,
          nombre: 'Cuota base de administración',
          monto_base: parseFloat(data.cuotaBase) || 0,
          periodo: new Date().toISOString().substring(0, 7),
          activa: true,
        })
        .select()
        .single();
      
      if (cuotaError) throw cuotaError;

      // Crear unidades
      const dbUnidades = data.unidades.map(u => {
        const dKey = u.owner?.email?.toLowerCase().trim() || u.owner?.nombre?.trim();
        const dId = dKey ? dueños[dKey]?.db_id : null;
        
        return {
          tenant_id: tenant.id,
          numero: u.numero,
          torre_bloque: u.torre || null,
          tipo: u.tipo,
          piso: parseInt(u.piso) || null,
          estrato: parseInt(u.estrato) || null,
          coeficiente_copropiedad: parseFloat(u.coef) || 0,
          propietario_id: dId || null,
          cuota_admin_id: cuota.id
        };
      });

      if (dbUnidades.length > 0) {
        const { error: errorU } = await supabase.from('unidades').insert(dbUnidades);
        if (errorU) throw errorU;
      }

      // Crear zonas
      const dbZonas = data.zonas.map(z => ({
        tenant_id: tenant.id,
        nombre: z.nombre,
        capacidad: parseInt(z.capacidad) || null,
        hora_apertura: z.apertura + ':00',
        hora_cierre: z.cierre + ':00'
      }));

      if (dbZonas.length > 0) {
        const { error: errorZ } = await supabase.from('zonas_comunes').insert(dbZonas);
        if (errorZ) throw errorZ;
      }

      // Seed obligaciones legales iniciales (Fase 6 — Ley 675 de 2001)
      // No-throw: el tenant ya existe; el seed es idempotente (ON CONFLICT DO NOTHING).
      const { error: seedError } = await supabase.rpc('seed_obligaciones_iniciales', {
        p_tenant_id: tenant.id,
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
