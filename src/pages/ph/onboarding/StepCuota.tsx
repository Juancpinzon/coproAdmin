import React from 'react';
import { OnboardingDraft } from './types';
import { StepHeader, Field, Card, Ico, formatCOP, formatCOPshort, onlyDigits } from './ui';

export function StepCuota({ data, setData, errors, compact }: { data: OnboardingDraft, setData: any, errors: any, compact?: boolean }) {
  const set = (v: string) => setData((d: OnboardingDraft) => ({ ...d, cuotaBase: v }));
  const base = data.cuotaBase;
  const monto = Number(base) || 0;
  const unidades = Number(data.conjunto.numUnidades) || data.unidades.length || 0;
  const recaudo = monto * unidades;

  const quick = [180000, 250000, 350000, 480000];

  return (
    <div className="anim-fade">
      <StepHeader icon={Ico.coin} eyebrow="Paso 2 de 5" title="Cuota de administración"
        desc="Valor base mensual que pagará cada unidad. Luego podrás ajustarla por coeficiente." />

      <Card className="p-5 mb-4">
        <Field label="Cuota base mensual (COP)" required error={errors.cuotaBase}>
          <div className={`flex items-end gap-1 rounded-xl border-2 px-4 py-3 transition
            ${errors.cuotaBase ? 'border-red-500' : 'border-slate-200 focus-within:border-primary'}`}>
            <span className="text-2xl font-bold text-slate-400 pb-0.5">$</span>
            <input inputMode="numeric" value={monto ? monto.toLocaleString('es-CO') : ''} placeholder="0"
              onChange={(e) => set(onlyDigits(e.target.value).slice(0, 9))}
              className="flex-1 min-w-0 bg-transparent text-3xl font-bold text-slate-900 placeholder:text-slate-200 focus:outline-none tracking-tight" />
            <span className="text-sm font-semibold text-slate-400 pb-1.5">/ mes</span>
          </div>
        </Field>
        <div className="flex flex-wrap gap-2 mt-3">
          {quick.map((q) => (
            <button key={q} type="button" onClick={() => set(String(q))}
              className={`h-9 px-3 rounded-lg text-[13px] font-semibold border transition active:scale-95
                ${String(monto) === String(q) ? 'bg-blue-50 border-primary text-primary' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
              {formatCOP(q)}
            </button>
          ))}
        </div>
      </Card>

      <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-2'}`}>
        <Card className="p-4">
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">Recaudo mensual estimado</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{recaudo ? formatCOP(recaudo) : '—'}</p>
          <p className="text-xs text-slate-400 mt-0.5">{unidades || 0} unidades × cuota base</p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide">Proyección anual</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{recaudo ? formatCOPshort(recaudo * 12) : '—'}</p>
          <p className="text-xs text-slate-400 mt-0.5">Recaudo × 12 meses</p>
        </Card>
      </div>

      <div className="flex items-start gap-2.5 mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-100">
        <Ico.alert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-[13px] text-amber-700 leading-snug">
          La cuota efectiva de cada unidad se calculará multiplicando este valor por su <b>coeficiente de copropiedad</b> (Paso 3).
        </p>
      </div>
    </div>
  );
}
