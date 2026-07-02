import React, { useState } from 'react';
import { OnboardingDraft, UnidadDraft, OwnerDraft, SetOnboardingData } from './types';
import { StepHeader, Button, Badge, Card, Field, Input, Select, Ico, TIPOS_UNIDAD, TIPO_ABBR, onlyDigits, formatPhone, validateEmail, validatePhone, EmptyState } from './ui';

export const sumCoef = (us: UnidadDraft[]) => us.reduce((a, u) => a + (parseFloat(u.coef) || 0), 0);
export const ESTRATOS = ['1', '2', '3', '4', '5', '6'];
export const newUnidad = (over = {}): UnidadDraft => ({ id: Math.random().toString(36).slice(2,9), numero: '', tipo: 'Apartamento', piso: '', torre: '', estrato: '4', coef: '', ...over });

function BulkImport({ onImport, onClose }: { onImport: (rows: UnidadDraft[]) => void, onClose: () => void }) {
  const [text, setText] = useState('');
  const [count, setCount] = useState<number | null>(null);

  const parse = (raw: string) => {
    const lines = (raw || '').trim().split(/\r?\n/).filter((l) => l.trim());
    const out: UnidadDraft[] = [];
    lines.forEach((line, i) => {
      const cells = line.split(/\t|;|,/).map((s) => s.trim());
      if (i === 0 && /n[uú]mero|torre|tipo|coef|piso/i.test(line) && cells.every((c) => isNaN(parseFloat(c)) || /[a-zA-Z]/.test(c) === false ? false : true)) {
        // best-effort header skip
      }
      if (i === 0 && /n[uú]mero|tipo|coef|estrato/i.test(line)) return; // header
      const [numero = '', tipo = '', piso = '', torre = '', estrato = '', coef = ''] = cells;
      if (!numero && !torre) return;
      const tipoMatch = TIPOS_UNIDAD.find((t) => t.toLowerCase().startsWith((tipo || '').toLowerCase().slice(0, 4))) || 'Apartamento';
      out.push(newUnidad({
        numero: numero.replace(/^#/, ''),
        tipo: tipoMatch,
        piso: onlyDigits(piso),
        torre,
        estrato: ESTRATOS.includes(onlyDigits(estrato)) ? onlyDigits(estrato) : '4',
        coef: coef.replace(',', '.').replace(/[^\d.]/g, ''),
      }));
    });
    return out;
  };

  const handleText = (v: string) => { setText(v); setCount(parse(v).length); };
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { const v = (reader.result as string) || ''; setText(v); setCount(parse(v).length); };
    reader.readAsText(f);
  };
  const doImport = () => { const rows = parse(text); if (rows.length) onImport(rows); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-slate-900/40" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl anim-fade" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center"><Ico.upload className="w-5 h-5" /></span>
            <div>
              <h3 className="font-bold text-slate-900 leading-tight">Importar unidades</h3>
              <p className="text-xs text-slate-500">Pega desde Excel o carga un archivo CSV.</p>
            </div>
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-700">Pegar desde Excel</span>
            <label className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-300 text-[13px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
              <Ico.doc className="w-4 h-4" /> Cargar CSV
              <input type="file" accept=".csv,text/csv,text/plain" className="hidden" onChange={handleFile} />
            </label>
          </div>
          <textarea value={text} onChange={(e) => handleText(e.target.value)} rows={6}
            placeholder={'Número\tTipo\tPiso\tTorre\tEstrato\tCoef.\n101\tApartamento\t1\tA\t4\t0.85\n102\tApartamento\t1\tA\t4\t0.85'}
            className="w-full rounded-xl border border-slate-300 p-3 text-[13px] font-mono text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary resize-none" />
          <p className="text-xs text-slate-400">Columnas: Número · Tipo · Piso · Torre · Estrato · Coeficiente. Separa con tabulación, coma o punto y coma.</p>
          {count != null && (
            <Badge tone={count ? 'success' : 'amber'}>{count ? `${count} unidades detectadas` : 'Sin filas válidas'}</Badge>
          )}
        </div>
        <div className="flex gap-2 p-4 border-t border-slate-100">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" disabled={!count} onClick={doImport}>Importar {count || ''}</Button>
        </div>
      </div>
    </div>
  );
}

function UnidadCard({ u, idx, onChange, onRemove }: { u: UnidadDraft, idx: number, onChange: (nu: UnidadDraft) => void, onRemove: () => void }) {
  const set = (k: string, v: string) => onChange({ ...u, [k]: v });
  return (
    <Card className="p-3.5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-bold text-slate-400">UNIDAD {idx + 1}</span>
        <button onClick={onRemove} className="w-9 h-9 -mr-1.5 flex items-center justify-center text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition"><Ico.trash className="w-4 h-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Número"><Input className="h-11" value={u.numero} placeholder="101" onChange={(e) => set('numero', e.target.value)} /></Field>
        <Field label="Torre / Bloque"><Input className="h-11" value={u.torre} placeholder="A" onChange={(e) => set('torre', e.target.value)} /></Field>
        <Field label="Tipo">
          <Select className="h-11" value={u.tipo} onChange={(e) => set('tipo', e.target.value)}>
            {TIPOS_UNIDAD.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Piso"><Input className="h-11" inputMode="numeric" value={u.piso} placeholder="1" onChange={(e) => set('piso', onlyDigits(e.target.value))} /></Field>
        <Field label="Estrato">
          <Select className="h-11" value={u.estrato} onChange={(e) => set('estrato', e.target.value)}>
            {ESTRATOS.map((s) => <option key={s} value={s}>Estrato {s}</option>)}
          </Select>
        </Field>
        <Field label="Coef. %"><Input className="h-11" inputMode="decimal" value={u.coef} placeholder="0.85" suffix="%" onChange={(e) => set('coef', e.target.value.replace(',', '.').replace(/[^\d.]/g, ''))} /></Field>
      </div>
    </Card>
  );
}

function UnidadRow({ u, idx, onChange, onRemove }: { u: UnidadDraft, idx: number, onChange: (nu: UnidadDraft) => void, onRemove: () => void }) {
  const set = (k: string, v: string) => onChange({ ...u, [k]: v });
  const cell = 'h-10 rounded-lg border border-slate-200 px-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary bg-white w-full';
  return (
    <tr className="group">
      <td className="py-1.5 pr-2 text-center text-xs font-semibold text-slate-300 w-8">{idx + 1}</td>
      <td className="py-1.5 pr-2"><input className={cell} value={u.numero} placeholder="101" onChange={(e) => set('numero', e.target.value)} /></td>
      <td className="py-1.5 pr-2">
        <div className="relative">
          <select className={cell + ' appearance-none pr-7'} value={u.tipo} onChange={(e) => set('tipo', e.target.value)}>
            {TIPOS_UNIDAD.map((t) => <option key={t}>{t}</option>)}
          </select>
          <Ico.chevR className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
        </div>
      </td>
      <td className="py-1.5 pr-2 w-20"><input className={cell} value={u.torre} placeholder="A" onChange={(e) => set('torre', e.target.value)} /></td>
      <td className="py-1.5 pr-2 w-20"><input className={cell} inputMode="numeric" value={u.piso} placeholder="1" onChange={(e) => set('piso', onlyDigits(e.target.value))} /></td>
      <td className="py-1.5 pr-2 w-28">
        <div className="relative">
          <select className={cell + ' appearance-none pr-7'} value={u.estrato} onChange={(e) => set('estrato', e.target.value)}>
            {ESTRATOS.map((s) => <option key={s} value={s}>Estrato {s}</option>)}
          </select>
          <Ico.chevR className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
        </div>
      </td>
      <td className="py-1.5 pr-2 w-24"><input className={cell} inputMode="decimal" value={u.coef} placeholder="0.85" onChange={(e) => set('coef', e.target.value.replace(',', '.').replace(/[^\d.]/g, ''))} /></td>
      <td className="py-1.5 w-10 text-right">
        <button onClick={onRemove} className="w-8 h-8 inline-flex items-center justify-center text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition opacity-60 group-hover:opacity-100"><Ico.trash className="w-4 h-4" /></button>
      </td>
    </tr>
  );
}

export function StepUnidades({ data, setData, compact }: { data: OnboardingDraft, setData: SetOnboardingData, compact?: boolean }) {
  const [showImport, setShowImport] = useState(false);
  const us = data.unidades;
  const setUs = (fn: UnidadDraft[] | ((prev: UnidadDraft[]) => UnidadDraft[])) =>
    setData((d: OnboardingDraft) => ({ ...d, unidades: typeof fn === 'function' ? fn(d.unidades) : fn }));

  const add = () => setUs((arr: UnidadDraft[]) => [...arr, newUnidad()]);
  const update = (id: string, nu: UnidadDraft) => setUs((arr: UnidadDraft[]) => arr.map((x) => (x.id === id ? nu : x)));
  const remove = (id: string) => setUs((arr: UnidadDraft[]) => arr.filter((x) => x.id !== id));
  const importRows = (rows: UnidadDraft[]) => setUs((arr: UnidadDraft[]) => [...arr.filter((x) => x.numero || x.torre), ...rows]);
  const distribuir = () => setUs((arr: UnidadDraft[]) => arr.length ? arr.map((x) => ({ ...x, coef: (100 / arr.length).toFixed(3) })) : arr);

  const total = sumCoef(us);
  const diff = +(100 - total).toFixed(3);
  const coefOk = Math.abs(diff) < 0.05;
  const objetivo = Number(data.conjunto.numUnidades) || 0;

  return (
    <div className="anim-fade">
      <StepHeader icon={Ico.grid} eyebrow="Paso 3 de 5" title="Cargar unidades"
        desc="Registra cada unidad privada con su coeficiente de copropiedad." />

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Button variant="subtle" size="sm" onClick={add}><Ico.plus className="w-4 h-4" />Agregar unidad</Button>
        <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}><Ico.upload className="w-4 h-4" />Importar</Button>
        {us.length > 0 && <Button variant="ghost" size="sm" onClick={distribuir}><Ico.spark className="w-4 h-4" />Distribuir coef.</Button>}
        <span className="ml-auto text-[13px] text-slate-400 font-medium">
          {us.length}{objetivo ? ` / ${objetivo}` : ''} unidades
        </span>
      </div>

      <div className={`mb-4 p-3.5 rounded-xl border ${coefOk ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-semibold text-slate-600">Coeficiente de copropiedad</span>
          <span className={`text-[13px] font-bold tabular-nums ${coefOk ? 'text-green-700' : 'text-slate-700'}`}>{total.toFixed(2)}% / 100%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${coefOk ? 'bg-green-500' : total > 100 ? 'bg-red-500' : 'bg-primary'}`} style={{ width: Math.min(100, total) + '%' }} />
        </div>
        {!coefOk && us.length > 0 && (
          <p className={`text-xs mt-2 font-medium ${total > 100 ? 'text-red-500' : 'text-slate-500'}`}>
            {total > 100 ? `Excede en ${Math.abs(diff)}%. ` : `Falta ${diff}% por asignar. `}
            Debe sumar exactamente 100%.
          </p>
        )}
      </div>

      {us.length === 0 ? (
        <EmptyState icon={Ico.grid} title="Aún no hay unidades"
          desc="Agrega unidades una a una o impórtalas masivamente desde Excel."
          action={<><Button variant="secondary" onClick={() => setShowImport(true)}><Ico.upload className="w-4 h-4" />Importar</Button><Button onClick={add}><Ico.plus className="w-4 h-4" />Agregar unidad</Button></>} />
      ) : compact ? (
        <div className="space-y-2.5">
          {us.map((u, i) => <UnidadCard key={u.id} u={u} idx={i} onChange={(nu: UnidadDraft) => update(u.id, nu)} onRemove={() => remove(u.id)} />)}
          <Button variant="secondary" className="w-full" onClick={add}><Ico.plus className="w-4 h-4" />Agregar otra unidad</Button>
        </div>
      ) : (
        <Card className="p-3 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-2 w-8"></th>
                <th className="pb-2 pr-2">Número</th><th className="pb-2 pr-2">Tipo</th>
                <th className="pb-2 pr-2">Torre</th><th className="pb-2 pr-2">Piso</th>
                <th className="pb-2 pr-2">Estrato</th><th className="pb-2 pr-2">Coef. %</th><th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {us.map((u, i) => <UnidadRow key={u.id} u={u} idx={i} onChange={(nu: UnidadDraft) => update(u.id, nu)} onRemove={() => remove(u.id)} />)}
            </tbody>
          </table>
          <Button variant="ghost" size="sm" className="mt-2" onClick={add}><Ico.plus className="w-4 h-4" />Agregar fila</Button>
        </Card>
      )}

      {showImport && <BulkImport onImport={importRows} onClose={() => setShowImport(false)} />}
    </div>
  );
}

// ----------------------------------------------------
// Paso 4: Asociar Propietarios
// ----------------------------------------------------

function UnitTag({ u, className = '' }: { u: UnidadDraft, className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex flex-col items-center justify-center shrink-0 leading-none">
        <span className="text-[8px] font-bold uppercase">{TIPO_ABBR[u.tipo] || 'U'}</span>
        <span className="text-[13px] font-bold">{u.numero || '—'}</span>
      </span>
      <div className="leading-tight min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{u.numero ? `Unidad ${u.numero}` : 'Sin número'}</p>
        <p className="text-xs text-slate-400">{u.torre ? `Torre ${u.torre} · ` : ''}{u.tipo}</p>
      </div>
    </div>
  );
}

function OwnerCard({ u, onChange }: { u: UnidadDraft, onChange: (k: keyof OwnerDraft, v: string) => void }) {
  const o = u.owner || {};
  const emailBad = !!o.email && !validateEmail(o.email);
  const phoneBad = !!o.telefono && !validatePhone(o.telefono);
  return (
    <Card className="p-3.5">
      <UnitTag u={u} className="mb-3" />
      <div className="space-y-2.5">
        <Field label="Nombre del propietario"><Input className="h-11" value={o.nombre || ''} placeholder="Ej. María Fernanda Ríos" onChange={(e) => onChange('nombre', e.target.value)} /></Field>
        <Field label="Correo electrónico" error={emailBad ? 'Correo no válido' : null}><Input className="h-11" type="email" invalid={emailBad} value={o.email || ''} placeholder="correo@ejemplo.com" onChange={(e) => onChange('email', e.target.value)} /></Field>
        <Field label="Teléfono" error={phoneBad ? 'Debe tener 10 dígitos' : null}><Input className="h-11" inputMode="tel" prefix="+57" invalid={phoneBad} value={formatPhone(o.telefono || '')} placeholder="300 123 4567" onChange={(e) => onChange('telefono', onlyDigits(e.target.value).slice(0, 10))} /></Field>
      </div>
    </Card>
  );
}

function OwnerRow({ u, onChange }: { u: UnidadDraft, onChange: (k: keyof OwnerDraft, v: string) => void }) {
  const o = u.owner || {};
  const emailBad = !!o.email && !validateEmail(o.email);
  const phoneBad = !!o.telefono && !validatePhone(o.telefono);
  const cell = 'h-11 rounded-lg border border-slate-200 px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary bg-white w-full';
  return (
    <div className="flex items-center gap-3 p-3">
      <UnitTag u={u} className="w-48 shrink-0" />
      <input className={cell} value={o.nombre || ''} placeholder="Nombre del propietario" onChange={(e) => onChange('nombre', e.target.value)} />
      <div className="w-56 shrink-0">
        <input className={cell + (emailBad ? ' border-red-500 ring-2 ring-red-500/20' : '')} type="email" value={o.email || ''} placeholder="correo@ejemplo.com" onChange={(e) => onChange('email', e.target.value)} />
      </div>
      <div className="w-40 shrink-0 flex items-center h-11 rounded-lg border border-slate-200 px-3 focus-within:ring-2 focus-within:ring-primary/25 bg-white">
        <span className="text-slate-400 text-sm mr-1">+57</span>
        <input className="flex-1 min-w-0 bg-transparent text-sm focus:outline-none" inputMode="tel" value={formatPhone(o.telefono || '')} placeholder="300 123 4567" onChange={(e) => onChange('telefono', onlyDigits(e.target.value).slice(0, 10))} />
      </div>
    </div>
  );
}

export function StepPropietarios({ data, setData, compact }: { data: OnboardingDraft, setData: SetOnboardingData, compact?: boolean }) {
  const us = data.unidades;
  const setOwner = (id: string, k: keyof OwnerDraft, v: string) => setData((d: OnboardingDraft) => ({
    ...d, unidades: d.unidades.map((u) => (u.id === id ? { ...u, owner: { ...(u.owner || {}), [k]: v } } : u)),
  }));

  const asignados = us.filter((u) => (u.owner?.nombre || '').trim()).length;

  if (us.length === 0) {
    return (
      <div className="anim-fade">
        <StepHeader icon={Ico.users} eyebrow="Paso 4 de 5" title="Asociar propietarios" desc="Vincula un propietario a cada unidad." />
        <EmptyState icon={Ico.users} title="Primero registra las unidades" desc="Vuelve al Paso 3 para cargar las unidades y luego asígnales propietario." />
      </div>
    );
  }

  return (
    <div className="anim-fade">
      <StepHeader icon={Ico.users} eyebrow="Paso 4 de 5" title="Asociar propietarios"
        desc="Vincula los datos de contacto del propietario de cada unidad." />

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: (us.length ? (asignados / us.length) * 100 : 0) + '%' }} />
        </div>
        <span className="text-[13px] font-semibold text-slate-500 tabular-nums">{asignados}/{us.length}</span>
      </div>

      {compact ? (
        <div className="space-y-2.5">
          {us.map((u) => <OwnerCard key={u.id} u={u} onChange={(k, v) => setOwner(u.id, k, v)} />)}
        </div>
      ) : (
        <Card className="divide-y divide-slate-100">
          {us.map((u) => <OwnerRow key={u.id} u={u} onChange={(k, v) => setOwner(u.id, k, v)} />)}
        </Card>
      )}
    </div>
  );
}
