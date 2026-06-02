// wizard.jsx — Stepper visual + validación por paso + footer de navegación + shell del wizard.

const STEPS = [
  { n: 1, label: 'Conjunto', icon: Ico.building },
  { n: 2, label: 'Cuota', icon: Ico.coin },
  { n: 3, label: 'Unidades', icon: Ico.grid },
  { n: 4, label: 'Propietarios', icon: Ico.users },
  { n: 5, label: 'Zonas', icon: Ico.trees },
];
const TOTAL = STEPS.length;
const REVIEW = TOTAL + 1; // pantalla de resumen

function validateStep(step, data) {
  const e = {};
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

/* ─────────── Stepper escritorio ─────────── */
function StepperDesktop({ step, onJump }) {
  return (
    <div className="flex items-center">
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
              <div className="text-left leading-tight">
                <p className={`text-[11px] font-semibold uppercase tracking-wide ${active || done ? 'text-primary' : 'text-slate-400'}`}>Paso {s.n}</p>
                <p className={`text-[13px] font-semibold ${active ? 'text-slate-900' : done ? 'text-slate-600 group-hover:text-primary' : 'text-slate-400'}`}>{s.label}</p>
              </div>
            </button>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 rounded-full bg-slate-200 overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: step > s.n || step === REVIEW ? '100%' : '0%' }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─────────── Stepper móvil (compacto) ─────────── */
function StepperMobile({ step }) {
  const cur = STEPS.find((s) => s.n === step);
  const isReview = step === REVIEW;
  const pct = isReview ? 100 : ((step - 1) / (TOTAL - 1)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
            {isReview ? <Ico.check className="w-4 h-4" /> : <cur.icon className="w-4.5 h-4.5" />}
          </span>
          <div className="leading-tight">
            <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{isReview ? 'Resumen' : `Paso ${step} de ${TOTAL}`}</p>
            <p className="text-[13px] font-bold text-slate-800">{isReview ? 'Confirmar' : cur.label}</p>
          </div>
        </div>
        <span className="text-[12px] font-bold text-slate-300 tabular-nums">{Math.round(pct)}%</span>
      </div>
      <div className="flex gap-1.5">
        {STEPS.map((s) => (
          <div key={s.n} className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${step > s.n || isReview ? 'bg-primary' : step === s.n ? 'bg-primary' : ''}`}
              style={{ width: step > s.n || isReview ? '100%' : step === s.n ? '55%' : '0%' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────── Cuerpo del paso ─────────── */
function StepBody({ step, data, setData, errors, compact, goTo }) {
  if (step === 1) return <StepConjunto data={data} setData={setData} errors={errors} />;
  if (step === 2) return <StepCuota data={data} setData={setData} errors={errors} compact={compact} />;
  if (step === 3) return <StepUnidades data={data} setData={setData} compact={compact} />;
  if (step === 4) return <StepPropietarios data={data} setData={setData} compact={compact} />;
  if (step === 5) return <StepZonas data={data} setData={setData} compact={compact} />;
  if (step === REVIEW) return <StepResumen data={data} goTo={goTo} />;
  return null;
}

/* ─────────── Shell del wizard ─────────── */
function Wizard({ data, setData, step, errors, onNext, onBack, onFinish, goTo, compact, finished, onRestart }) {
  const scrollRef = React.useRef(null);
  React.useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [step]);

  if (finished) {
    return (
      <div className="h-full bg-canvas flex flex-col">
        <div className={`flex-1 overflow-y-auto no-sb flex items-center ${compact ? 'pt-12' : ''}`}>
          <div className="w-full"><SuccessScreen data={data} onRestart={onRestart} /></div>
        </div>
      </div>
    );
  }

  const isReview = step === REVIEW;
  const blockMsg = errors._;

  return (
    <div className="h-full bg-canvas flex flex-col">
      {/* Stepper */}
      <div className={`shrink-0 bg-white/85 backdrop-blur border-b border-slate-200 ${compact ? 'px-4 pt-12 pb-3' : 'px-7 py-4'}`}>
        {compact ? <StepperMobile step={step} /> : <StepperDesktop step={step} onJump={goTo} />}
      </div>

      {/* Contenido */}
      <div ref={scrollRef} className={`flex-1 overflow-y-auto no-sb ${compact ? 'px-4 py-5' : 'px-7 py-6'}`}>
        <div className={compact ? '' : 'max-w-3xl mx-auto'}>
          <StepBody step={step} data={data} setData={setData} errors={errors} compact={compact} goTo={goTo} />
        </div>
      </div>

      {/* Footer */}
      <div className={`shrink-0 bg-white border-t border-slate-200 ${compact ? 'px-4 pt-3 pb-7' : 'px-7 py-4'}`}>
        {blockMsg && (
          <div className="flex items-center gap-2 mb-2.5 text-[13px] font-medium text-danger anim-fade">
            <Ico.alert className="w-4 h-4 shrink-0" />{blockMsg}
          </div>
        )}
        <div className={`flex items-center gap-3 ${compact ? '' : 'max-w-3xl mx-auto'}`}>
          {step > 1 ? (
            <Button variant="secondary" onClick={onBack} className={compact ? 'px-4' : ''}>
              <Ico.chevL className="w-4 h-4" />{compact ? '' : 'Atrás'}
            </Button>
          ) : <div className="text-[13px] text-slate-400 hidden sm:flex items-center gap-1.5"><Ico.save className="w-4 h-4" />Borrador guardado</div>}

          {isReview ? (
            <Button variant="success" className="flex-1 sm:flex-none sm:ml-auto sm:px-8" size="lg" onClick={onFinish}>
              <Ico.check className="w-5 h-5" />Crear conjunto
            </Button>
          ) : (
            <Button className="flex-1 sm:flex-none sm:ml-auto sm:px-8" size="lg" onClick={onNext}>
              {step === TOTAL ? 'Revisar y confirmar' : 'Continuar'}<Ico.chevR className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { STEPS, TOTAL, REVIEW, validateStep, Wizard, StepperDesktop, StepperMobile });
