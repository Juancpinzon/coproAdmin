export interface ConjuntoDraft {
  nombre: string;
  direccion: string;
  ciudad: string;
  nit: string;
  numUnidades: string;
}

export interface OwnerDraft {
  nombre?: string;
  email?: string;
  telefono?: string;
}

export interface UnidadDraft {
  id: string;
  numero: string;
  tipo: string;
  piso: string;
  torre: string;
  estrato: string;
  coef: string;
  owner?: OwnerDraft;
}

export interface ZonaDraft {
  id: string;
  nombre: string;
  capacidad: string;
  apertura: string;
  cierre: string;
}

export interface OnboardingDraft {
  conjunto: ConjuntoDraft;
  cuotaBase: string;
  unidades: UnidadDraft[];
  zonas: ZonaDraft[];
}
