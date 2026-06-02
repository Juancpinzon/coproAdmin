// app.jsx — estado global, autosave (localStorage), toggle Teléfono/Escritorio, montaje.
// v: build

const STORAGE_KEY = 'ph-onboarding-v1';

const seedUnidades = () => {
  // 6 unidades de ejemplo cuyos coeficientes suman ~100 para una demo realista
  const base = [
    { numero: '101', torre: 'A', piso: '1', tipo: 'Apartamento', estrato: '4', coef: '17.50', owner: { nombre: 'María Fernanda Ríos', email: 'mf.rios@gmail.com', telefono: '3012345678' } },
    { numero: '102', torre: 'A', piso: '1', tipo: 'Apartamento', estrato: '4', coef: '17.50', owner: { nombre: 'Carlos Andrés Peña', email: 'capena@hotmail.com', telefono: '3109876543' } },
    { numero: '201', torre: 'A', piso: '2', tipo: 'Apartamento', estrato: '4', coef: '17.50', owner: { nombre: '', email: '', telefono: '' } },
    { numero: '202', torre: 'A', piso: '2', tipo: 'Apartamento', estrato: '4', coef: '17.50', owner: { nombre: '', email: '', telefono: '' } },
    { numero: 'L-01', torre: 'A', piso: '1', tipo: 'Local', estrato: '4', coef: '20.00', owner: { nombre: 'Inversiones El Roble S.A.S', email: 'admin@elroble.co', telefono: '3201112233' } },
    { numero: 'P-12', torre: 'A', piso: '0', tipo: 'Parqueadero', estrato: '4', coef: '10.00', owner: { nombre: '', email: '', telefono: '' } },
  ];
  return base.map((b) => ({ id: genId(), ...b }));
};

const emptyData = () => ({
  conjunto: { nombre: '', direccion: '', ciudad: '', nit: '', numUnidades: '' },
  cuotaBase: '',
  unidades: [],
  zonas: [],
});

const demoData = () => ({
  conjunto: { nombre: 'Conjunto Residencial Altos del Parque', direccion: 'Calle 134 # 7-83', ciudad: 'Bogotá D.C.', nit: '901456789', numUnidades: '6' },
  cuotaBase: '350000',
  unidades: seedUnidades(),
  zonas: [
    { id: genId(), nombre: 'Salón social', capacidad: '40', apertura: '09:00', cierre: '22:00' },
    { id: genId(), nombre: 'Gimnasio', capacidad: '12', apertura: '05:00', cierre: '22:00' },
  ],
});

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (p && p.data) return p;
  } catch (e) {}
  return null;
}

function App() {
  const saved = React.useMemo(loadSaved, []);
  const [device, setDevice] = React.useState('phone'); // 'phone' | 'desktop'
  const [step, setStep] = React.useState(saved?.step || 1);
  const [data, setData] = React.useState(saved?.data || demoData());
  const [errors, setErrors] = React.useState({});
  const [finished, setFinished] = React.useState(false);
  const [savedTick, setSavedTick] = React.useState(false);

  // autosave con debounce
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ data, step }));
        setSavedTick(true);
        const h = setTimeout(() => setSavedTick(false), 1400);
        return () => clearTimeout(h);
      } catch (e) {}
    }, 600);
    return () => clearTimeout(t);
  }, [data, step]);

  const goTo = (n) => { setErrors({}); setStep(n); };

  const onNext = () => {
    const e = validateStep(step, data);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep((s) => Math.min(REVIEW, s + 1));
  };
  const onBack = () => { setErrors({}); setStep((s) => Math.max(1, s - 1)); };

  const onFinish = () => {
    // valida todos los pasos requeridos
    for (let s = 1; s <= 3; s++) {
      const e = validateStep(s, data);
      if (Object.keys(e).length) { setErrors(e); setStep(s); return; }
    }
    setFinished(true);
  };

  const onRestart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(emptyData()); setStep(1); setErrors({}); setFinished(false);
  };

  const wizardProps = { data, setData, step, errors, onNext, onBack, onFinish, goTo, finished, onRestart };
  const compact = device === 'phone';

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Barra de presentación */}
      <header className="shrink-0 h-16 px-5 flex items-center gap-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center"><Ico.building className="w-5 h-5" /></span>
          <div className="leading-tight">
            <p className="text-[15px] font-bold text-slate-900 tracking-tight">Administra PH</p>
            <p className="text-[11px] font-medium text-slate-400 -mt-0.5">Onboarding · Crear conjunto</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* indicador de autosave */}
          <span className={`hidden sm:inline-flex items-center gap-1.5 text-[12px] font-semibold transition-opacity duration-300 ${savedTick ? 'text-success opacity-100' : 'text-slate-300 opacity-80'}`}>
            <Ico.save className="w-3.5 h-3.5" />{savedTick ? 'Guardado' : 'Autoguardado activo'}
          </span>

          {/* toggle dispositivo */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100">
            {[['phone', 'Teléfono'], ['desktop', 'Escritorio']].map(([k, l]) => (
              <button key={k} onClick={() => setDevice(k)}
                className={`h-9 px-3.5 rounded-lg text-[13px] font-semibold transition ${device === k ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{l}</button>
            ))}
          </div>
        </div>
      </header>

      {/* Escenario */}
      <main className="flex-1 overflow-hidden bg-[#EAEEF3] flex items-center justify-center p-6">
        {compact ? (
          <div style={{ transform: 'scale(var(--phone-scale, 1))' }} className="origin-center">
            <IOSDevice width={402} height={848}>
              <div className="h-full">
                <Wizard {...wizardProps} compact />
              </div>
            </IOSDevice>
          </div>
        ) : (
          <div className="w-full h-full max-w-6xl flex items-stretch">
            <BrowserChrome url="app.administrapH.co/onboarding">
              <Wizard {...wizardProps} compact={false} />
            </BrowserChrome>
          </div>
        )}
      </main>
    </div>
  );
}

/* Chrome de navegador simple para la vista escritorio */
function BrowserChrome({ url, children }) {
  return (
    <div className="w-full h-full rounded-2xl bg-white shadow-[0_30px_70px_rgba(15,23,42,0.18)] border border-slate-200 overflow-hidden flex flex-col">
      <div className="shrink-0 h-11 px-4 flex items-center gap-3 bg-slate-50 border-b border-slate-200">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#FF5F57]"></span>
          <span className="w-3 h-3 rounded-full bg-[#FEBC2E]"></span>
          <span className="w-3 h-3 rounded-full bg-[#28C840]"></span>
        </div>
        <div className="flex-1 max-w-md mx-auto h-7 px-3 rounded-lg bg-white border border-slate-200 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-slate-400"><rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 11V8a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8"/></svg>
          <span className="text-[12px] text-slate-500 font-medium truncate">{url}</span>
        </div>
        <div className="w-12"></div>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

// Escala el teléfono para que quepa verticalmente en pantallas pequeñas
function fitPhone() {
  const avail = window.innerHeight - 64 - 48; // header + padding
  const scale = Math.min(1, avail / 848);
  document.documentElement.style.setProperty('--phone-scale', scale.toFixed(3));
}
window.addEventListener('resize', fitPhone);
fitPhone();

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
