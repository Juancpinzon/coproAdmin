// steps-extra.jsx — Paso 5 (Zonas comunes), Resumen final y pantalla de éxito

const newZona = (over = {}) => ({ id: genId(), nombre: '', capacidad: '', apertura: '08:00', cierre: '20:00', ...over });
const ZONA_PRESETS = ['Salón social', 'Piscina', 'Gimnasio', 'Zona BBQ', 'Salón infantil', 'Cancha múltiple', 'Coworking', 'Parqueadero visitantes'];

/* ════════════════════ PASO 5 · Zonas comunes ════════════════════ */
function StepZonas({ data, setData, compact }) {
  const zs = data.zonas;
  const setZs = (fn) => setData((d) => ({ ...d, zonas: typeof fn === 'function' ? fn(d.zonas) : fn }));
  const add = (nombre = '') => setZs((arr) => [...arr, newZona({ nombre })]);
  const update = (id, nz) => setZs((arr) => arr.map((x) => (x.id === id ? nz : x)));
  const remove = (id) => setZs((arr) => arr.filter((x) => x.id !== id));
  const usados = zs.map((z) => z.nombre);

  return (
    <div className="anim-fade">
      <StepHeader icon={Ico.trees} eyebrow="Paso 5 de 5" title="Zonas comunes"
        desc="Configura los espacios reservables con su capacidad y horario." />

      {/* presets rápidos */}
      <div className="mb-4">
        <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Agregar rápido</p>
        <div className="flex flex-wrap gap-2">
          {ZONA_PRESETS.filter((p) => !usados.includes(p)).map((p) => (
            <button key={p} type="button" onClick={() => add(p)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white border border-slate-200 text-[13px] font-semibold text-slate-600 hover:border-primary hover:text-primary transition active:scale-95">
              <Ico.plus className="w-3.5 h-3.5" />{p}
            </button>
          ))}
        </div>
      </div>

      {zs.length === 0 ? (
        <EmptyState icon={Ico.trees} title="Sin zonas comunes" desc="Usa los accesos rápidos de arriba o crea una zona personalizada."
          action={<Button onClick={() => add()}><Ico.plus className="w-4 h-4" />Crear zona</Button>} />
      ) : (
        <div className="space-y-2.5">
          {zs.map((z) => (
            <Card key={z.id} className="p-3.5">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-success-50 text-success flex items-center justify-center shrink-0"><Ico.trees className="w-5 h-5" /></span>
                <div className="flex-1 min-w-0 space-y-2.5">
                  <input value={z.nombre} placeholder="Nombre de la zona" onChange={(e) => update(z.id, { ...z, nombre: e.target.value })}
                    className="w-full text-[15px] font-semibold text-slate-900 placeholder:text-slate-300 focus:outline-none border-b border-transparent focus:border-slate-200 pb-1" />
                  <div className={`grid gap-2.5 ${compact ? 'grid-cols-1' : 'grid-cols-3'}`}>
                    <Field label="Capacidad (personas)"><Input className="h-11" inputMode="numeric" value={z.capacidad} placeholder="30" onChange={(e) => update(z.id, { ...z, capacidad: onlyDigits(e.target.value) })} /></Field>
                    <Field label="Apertura"><Input className="h-11" type="time" value={z.apertura} onChange={(e) => update(z.id, { ...z, apertura: e.target.value })} /></Field>
                    <Field label="Cierre"><Input className="h-11" type="time" value={z.cierre} onChange={(e) => update(z.id, { ...z, cierre: e.target.value })} /></Field>
                  </div>
                </div>
                <button onClick={() => remove(z.id)} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-danger rounded-lg hover:bg-danger-50 transition shrink-0"><Ico.trash className="w-4 h-4" /></button>
              </div>
            </Card>
          ))}
          <Button variant="secondary" className="w-full" onClick={() => add()}><Ico.plus className="w-4 h-4" />Zona personalizada</Button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════ RESUMEN FINAL ════════════════════ */
function ReviewBlock({ icon: I, title, onEdit, children }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-7 h-7 rounded-lg bg-primary-50 text-primary flex items-center justify-center shrink-0"><I className="w-4 h-4" /></span>
        <h4 className="font-bold text-slate-800 text-[15px] flex-1">{title}</h4>
        <button onClick={onEdit} className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"><Ico.edit className="w-3.5 h-3.5" />Editar</button>
      </div>
      {children}
    </Card>
  );
}

function KV({ k, v, bad }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-[13px] text-slate-400">{k}</span>
      <span className={`text-[13px] font-semibold text-right ${bad ? 'text-danger' : 'text-slate-700'}`}>{v}</span>
    </div>
  );
}

function StepResumen({ data, goTo }) {
  const c = data.conjunto;
  const dv = computeDV(c.nit);
  const total = sumCoef(data.unidades);
  const coefOk = Math.abs(100 - total) < 0.05;
  const asignados = data.unidades.filter((u) => (u.owner?.nombre || '').trim()).length;
  const monto = Number(data.cuotaBase) || 0;
  const unidades = data.unidades.length || Number(c.numUnidades) || 0;

  return (
    <div className="anim-fade">
      <StepHeader icon={Ico.check} eyebrow="Último paso" title="Revisa y confirma"
        desc="Verifica la información antes de crear el conjunto." />
      <div className="space-y-3">
        <ReviewBlock icon={Ico.building} title="Datos del conjunto" onEdit={() => goTo(1)}>
          <KV k="Nombre" v={c.nombre || '—'} bad={!c.nombre} />
          <KV k="Dirección" v={[c.direccion, c.ciudad].filter(Boolean).join(', ') || '—'} bad={!c.direccion} />
          <KV k="NIT" v={c.nit ? `${formatNIT(c.nit)}-${dv}` : '—'} bad={!c.nit} />
          <KV k="Unidades declaradas" v={c.numUnidades || '—'} />
        </ReviewBlock>

        <ReviewBlock icon={Ico.coin} title="Cuota de administración" onEdit={() => goTo(2)}>
          <KV k="Cuota base mensual" v={monto ? formatCOP(monto) : '—'} bad={!monto} />
          <KV k="Recaudo mensual estimado" v={monto && unidades ? formatCOP(monto * unidades) : '—'} />
        </ReviewBlock>

        <ReviewBlock icon={Ico.grid} title="Unidades" onEdit={() => goTo(3)}>
          <KV k="Unidades cargadas" v={`${data.unidades.length}${c.numUnidades ? ` de ${c.numUnidades}` : ''}`} bad={data.unidades.length === 0} />
          <KV k="Suma de coeficientes" v={`${total.toFixed(2)}%`} bad={!coefOk} />
          {!coefOk && data.unidades.length > 0 && <p className="text-xs text-danger mt-1.5 font-medium">Los coeficientes deben sumar 100%.</p>}
        </ReviewBlock>

        <ReviewBlock icon={Ico.users} title="Propietarios" onEdit={() => goTo(4)}>
          <KV k="Propietarios asignados" v={`${asignados} de ${data.unidades.length}`} bad={asignados < data.unidades.length} />
        </ReviewBlock>

        <ReviewBlock icon={Ico.trees} title="Zonas comunes" onEdit={() => goTo(5)}>
          {data.zonas.length === 0 ? <p className="text-[13px] text-slate-400">Ninguna zona configurada (opcional).</p> : (
            <div className="flex flex-wrap gap-1.5">
              {data.zonas.map((z) => <Badge key={z.id} tone="success">{z.nombre || 'Sin nombre'} · {z.capacidad || '?'} pers.</Badge>)}
            </div>
          )}
        </ReviewBlock>
      </div>
    </div>
  );
}

/* ════════════════════ PANTALLA DE ÉXITO ════════════════════ */
function SuccessScreen({ data, onRestart }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 anim-fade">
      <div className="w-20 h-20 rounded-full bg-success-50 flex items-center justify-center mb-5 anim-pop">
        <span className="w-14 h-14 rounded-full bg-success text-white flex items-center justify-center"><Ico.check className="w-8 h-8" /></span>
      </div>
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">¡Conjunto creado!</h2>
      <p className="text-slate-500 mt-2 max-w-sm leading-snug">
        <b className="text-slate-700">{data.conjunto.nombre || 'Tu conjunto'}</b> quedó configurado con {data.unidades.length} unidades y {data.zonas.length} zonas comunes. Ya puedes empezar a administrar.
      </p>
      <div className="flex flex-col sm:flex-row gap-2.5 mt-7 w-full max-w-xs">
        <Button className="flex-1" size="lg">Ir al panel</Button>
        <Button variant="secondary" className="flex-1" size="lg" onClick={onRestart}>Empezar de nuevo</Button>
      </div>
    </div>
  );
}

Object.assign(window, { StepZonas, StepResumen, SuccessScreen, newZona, ReviewBlock });
