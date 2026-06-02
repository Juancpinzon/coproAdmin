import React from 'react';

/* ───────────────────────── Helpers de dominio ───────────────────────── */

export const onlyDigits = (s: string) => (s || '').toString().replace(/\D/g, '');

export function formatCOP(n: string | number) {
  if (n === '' || n == null || isNaN(Number(n))) return '';
  return '$' + Number(n).toLocaleString('es-CO');
}
export function formatCOPshort(n: string | number) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return '$' + (v / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' M';
  if (v >= 1000) return '$' + Math.round(v / 1000) + ' mil';
  return '$' + v;
}

export function formatNIT(s: string) {
  const d = onlyDigits(s);
  if (!d) return '';
  return Number(d).toLocaleString('es-CO');
}

export function computeDV(nitRaw: string) {
  const d = onlyDigits(nitRaw);
  if (!d) return null;
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const rev = d.split('').reverse();
  let sum = 0;
  for (let i = 0; i < rev.length; i++) sum += parseInt(rev[i], 10) * (weights[i] || 0);
  const mod = sum % 11;
  return mod > 1 ? 11 - mod : mod;
}

const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const validateEmail = (s: string) => reEmail.test((s || '').trim());

export function formatPhone(s: string) {
  const d = onlyDigits(s).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return d.slice(0, 3) + ' ' + d.slice(3);
  return d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6);
}
export const validatePhone = (s: string) => onlyDigits(s).length === 10;

export const TIPOS_UNIDAD = ['Apartamento', 'Local_comercial', 'Parqueadero', 'Deposito'];
export const TIPO_ABBR: Record<string, string> = { Apartamento: 'Apto', Local_comercial: 'Local', Parqueadero: 'Parq', Deposito: 'Dep' };

/* ───────────────────────── Iconos ───────────────────────── */

export const Ico = {
  check: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  chevL: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  chevR: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  plus: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>),
  trash: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  upload: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 16V4m0 0L7 9m5-5l5 5M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  building: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 21V5a1 1 0 011-1h7a1 1 0 011 1v16M13 21V9h5a1 1 0 011 1v11M3 21h18M7 8h2M7 12h2M7 16h2M16 13h0M16 17h0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  coin: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7v10M14.5 9.2c-.5-.7-1.4-1.1-2.5-1.1-1.5 0-2.5.8-2.5 1.9 0 2.6 5 1.4 5 4 0 1.1-1 1.9-2.5 1.9-1.1 0-2-.4-2.5-1.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>),
  grid: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/><rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.7"/></svg>),
  users: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7"/><path d="M3.5 20c0-3 2.5-5 5.5-5s5.5 2 5.5 5M16 6.5a3 3 0 010 5.6M17.5 20c0-2.2-1-3.8-2.5-4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>),
  trees: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3l5 7h-3l3 5h-4v6h-2v-6H7l3-5H7l5-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>),
  alert: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 9v4m0 4h0M10.3 4.3L2.7 17a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  clock: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7"/><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  save: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M5 4h11l3 3v13a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6"/><path d="M8 4v5h7M8 14h8v6H8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>),
  spark: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg>),
  doc: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M6 3h8l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M13 3v5h5M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>),
  edit: (p: any) => (<svg viewBox="0 0 24 24" fill="none" {...p}><path d="M4 20h4l10-10-4-4L4 16v4z M13.5 6.5l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
};

/* ───────────────────────── Primitivas UI ───────────────────────── */

export function Button({ variant = 'primary', size = 'md', className = '', children, ...rest }: any) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition active:scale-[.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-40 disabled:pointer-events-none select-none';
  const sizes: any = {
    md: 'h-12 px-5 text-[15px]',
    lg: 'h-[52px] px-6 text-base',
    sm: 'h-10 px-3 text-sm',
    icon: 'h-12 w-12',
    iconSm: 'h-9 w-9',
  };
  const variants: any = {
    primary: 'bg-primary text-white shadow-sm hover:bg-primary/90',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    success: 'bg-green-600 text-white hover:brightness-95 shadow-sm',
    danger: 'text-red-500 hover:bg-red-50',
    subtle: 'bg-blue-50 text-primary hover:bg-blue-100',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>{children}</button>
  );
}

export function Field({ label, required, hint, error, htmlFor, children, className = '' }: any) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={htmlFor} className="block text-[13px] font-semibold text-slate-700">
          {label}{required && <span className="text-red-500 font-bold"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-xs text-red-500 font-medium"><Ico.alert className="w-3.5 h-3.5" />{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function Input({ className = '', invalid = false, prefix = null, suffix = null, ...rest }: any) {
  const ring = invalid ? 'border-red-500 focus:border-red-500 focus:ring-red-500/25' : 'border-slate-300 focus:border-primary focus:ring-primary/25';
  if (prefix || suffix) {
    return (
      <div className={`flex items-center h-12 rounded-xl border bg-white overflow-hidden transition focus-within:ring-2 ${ring} ${className}`}>
        {prefix && <span className="pl-3.5 pr-1 text-slate-400 text-[15px] font-medium shrink-0">{prefix}</span>}
        <input className="flex-1 min-w-0 h-full px-2 bg-transparent text-slate-900 text-[15px] placeholder:text-slate-300 focus:outline-none" {...rest} />
        {suffix && <span className="pr-3.5 pl-1 text-slate-400 text-[15px] shrink-0">{suffix}</span>}
      </div>
    );
  }
  return (
    <input className={`w-full h-12 px-3.5 rounded-xl border bg-white text-slate-900 text-[15px] placeholder:text-slate-300 transition focus:outline-none focus:ring-2 ${ring} ${className}`} {...rest} />
  );
}

export function Select({ className = '', invalid = false, children, ...rest }: any) {
  const ring = invalid ? 'border-red-500 focus:ring-red-500/25' : 'border-slate-300 focus:border-primary focus:ring-primary/25';
  return (
    <div className="relative">
      <select className={`w-full h-12 pl-3.5 pr-9 rounded-xl border bg-white text-slate-900 text-[15px] appearance-none transition focus:outline-none focus:ring-2 ${ring} ${className}`} {...rest}>{children}</select>
      <Ico.chevR className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
    </div>
  );
}

export function Card({ className = '', children }: any) {
  return <div className={`bg-white rounded-2xl border border-slate-200 ${className}`}>{children}</div>;
}

export function Badge({ tone = 'slate', className = '', children }: any) {
  const tones: any = {
    slate: 'bg-slate-100 text-slate-600',
    primary: 'bg-blue-50 text-primary',
    success: 'bg-green-50 text-green-700',
    danger: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${tones[tone]} ${className}`}>{children}</span>;
}

export function ChipGroup({ options, value, onChange, className = '' }: any) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((o: any) => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        const on = String(value) === String(v);
        return (
          <button key={v} type="button" onClick={() => onChange(v)}
            className={`h-11 px-4 rounded-xl text-sm font-semibold border transition active:scale-[.98] ${on ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}>
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function StepHeader({ icon: I, eyebrow, title, desc }: any) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center shrink-0">
          <I className="w-5 h-5" />
        </span>
        <span className="text-[12px] font-bold uppercase tracking-wider text-primary">{eyebrow}</span>
      </div>
      <h2 className="text-[22px] leading-tight font-bold text-slate-900 tracking-tight">{title}</h2>
      {desc && <p className="text-[14px] text-slate-500 mt-1 leading-snug">{desc}</p>}
    </div>
  );
}

export function EmptyState({ icon: I, title, desc, action }: any) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/60 py-10 px-5 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3"><I className="w-6 h-6" /></div>
      <h4 className="font-bold text-slate-700">{title}</h4>
      <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto leading-snug">{desc}</p>
      {action && <div className="flex flex-wrap gap-2 justify-center mt-4">{action}</div>}
    </div>
  );
}
