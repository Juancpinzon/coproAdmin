import React from 'react';
import { OnboardingDraft, SetOnboardingData, OnboardingErrors } from './types';
import { StepHeader, Field, Input, Ico, formatNIT, onlyDigits, computeDV } from './ui';

export function StepConjunto({ data, setData, errors }: { data: OnboardingDraft, setData: SetOnboardingData, errors: OnboardingErrors }) {
  const c = data.conjunto;
  const set = (k: string, v: string) => setData((d: OnboardingDraft) => ({ ...d, conjunto: { ...d.conjunto, [k]: v } }));
  const dv = computeDV(c.nit);
  const nitOk = onlyDigits(c.nit).length >= 9;

  return (
    <div className="anim-fade">
      <StepHeader icon={Ico.building} eyebrow="Paso 1 de 5" title="Datos del conjunto"
        desc="Información legal y general de la copropiedad." />
      <div className="space-y-4">
        <Field label="Nombre del conjunto" required error={errors.nombre} htmlFor="cj-nombre">
          <Input id="cj-nombre" value={c.nombre} placeholder="Ej. Conjunto Residencial Altos del Parque"
            invalid={!!errors.nombre} onChange={(e) => set('nombre', e.target.value)} />
        </Field>

        <Field label="Dirección" required error={errors.direccion} htmlFor="cj-dir">
          <Input id="cj-dir" value={c.direccion} placeholder="Ej. Calle 134 # 7-83"
            invalid={!!errors.direccion} onChange={(e) => set('direccion', e.target.value)} />
        </Field>

        <Field label="Ciudad" htmlFor="cj-ciu" hint="Donde está ubicado el conjunto.">
          <Input id="cj-ciu" value={c.ciudad} placeholder="Ej. Bogotá D.C."
            onChange={(e) => set('ciudad', e.target.value)} />
        </Field>

        <Field label="NIT de la copropiedad" required error={errors.nit}
          hint={!errors.nit && nitOk ? null : 'Solo el número, sin el dígito de verificación.'}>
          <div className="flex items-stretch gap-2">
            <Input className="flex-1" inputMode="numeric" value={formatNIT(c.nit)} placeholder="901.234.567"
              invalid={!!errors.nit} onChange={(e) => set('nit', onlyDigits(e.target.value).slice(0, 10))} />
            <div className={`w-[58px] shrink-0 rounded-xl border flex flex-col items-center justify-center transition
              ${nitOk ? 'border-green-600 bg-green-50 text-green-700' : 'border-slate-200 bg-slate-50 text-slate-300'}`}>
              <span className="text-[9px] font-bold uppercase tracking-wide leading-none">DV</span>
              <span className="text-xl font-bold leading-none mt-0.5">{nitOk ? dv : '–'}</span>
            </div>
          </div>
          {nitOk && (
            <p className="flex items-center gap-1.5 text-xs text-green-700 font-medium mt-1.5">
              <Ico.check className="w-3.5 h-3.5" />
              NIT {formatNIT(c.nit)}-{dv} · dígito de verificación calculado
            </p>
          )}
        </Field>

        <Field label="Número de unidades" required error={errors.numUnidades}
          hint="Total de unidades privadas (apartamentos, locales, etc.).">
          <Input className="w-40" inputMode="numeric" value={c.numUnidades} placeholder="120"
            invalid={!!errors.numUnidades} onChange={(e) => set('numUnidades', onlyDigits(e.target.value).slice(0, 4))} />
        </Field>
      </div>
    </div>
  );
}
