// steps.jsx — los 5 pasos del wizard + resumen final.
// Cada paso recibe { data, setData, compact, errors }.

const genId = () => Math.random().toString(36).slice(2, 9);

/* ════════════════════ PASO 1 · Datos del conjunto ════════════════════ */
function StepConjunto({ data, setData, errors }) {
  const c = data.conjunto;
  const set = (k, v) => setData((d) => ({ ...d, conjunto: { ...d.conjunto, [k]: v } }));
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
              ${nitOk ? 'border-success bg-success-50 text-success' : 'border-slate-200 bg-slate-50 text-slate-300'}`}>
              <span className="text-[9px] font-bold uppercase tracking-wide leading-none">DV</span>
              <span className="text-xl font-bold leading-none mt-0.5">{nitOk ? dv : '–'}</span>
            </div>
          </div>
          {nitOk && (
            <p className="flex items-center gap-1.5 text-xs text-success font-medium mt-1.5">
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

/* ════════════════════ PASO 2 · Cuota base mensual ════════════════════ */
function StepCuota({ data, setData, errors, compact }) {
  const set = (v) => setData((d) => ({ ...d, cuotaBase: v }));
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
            ${errors.cuotaBase ? 'border-danger' : 'border-slate-200 focus-within:border-primary'}`}>
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
                ${String(monto) === String(q) ? 'bg-primary-50 border-primary text-primary' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
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

Object.assign(window, { genId, StepConjunto, StepCuota });
