import { useMemo, lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentMiembro } from "@/hooks/useCurrentMiembro";
import { useTenant } from "@/hooks/useTenant";
import { MiembroProvider } from "@/contexts/MiembroContext";
import AppLayout from "./components/AppLayout";

// Páginas cargadas de forma diferida (code-splitting por ruta): cada una queda
// en su propio chunk junto con las librerías pesadas que arrastra (xlsx, jspdf,
// recharts, framer-motion), fuera del bundle inicial.
const LoginPage = lazy(() => import("./pages/LoginPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const RegistroPage = lazy(() => import("./pages/RegistroPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DashboardPHPage = lazy(() => import("./pages/ph/DashboardPHPage"));
const UnidadesPage = lazy(() => import("./pages/ph/UnidadesPage"));
const CobrosPage = lazy(() => import("./pages/ph/CobrosPage"));
const PQRPage = lazy(() => import("./pages/ph/PQRPage"));
const OnboardingPHPage = lazy(() => import("./pages/ph/OnboardingPHPage"));
const ZonasPage = lazy(() => import("./pages/ph/ZonasPage"));
const ReservasPage = lazy(() => import("./pages/ph/ReservasPage"));
const PortalResidentePage = lazy(() => import("./pages/ph/PortalResidentePage"));
const PresupuestoPage = lazy(() => import("./pages/ph/PresupuestoPage"));
const AyudaPage = lazy(() => import("./pages/ph/AyudaPage"));
const CumplimientoPage = lazy(() => import("./pages/ph/CumplimientoPage"));
const SuscripcionVencidaPage = lazy(() => import("./pages/SuscripcionVencidaPage"));
const SuperAdminDashboard = lazy(() => import("./pages/superadmin/SuperAdminDashboard"));
const PoliticaPrivacidadPage = lazy(() => import("./pages/PoliticaPrivacidadPage"));
const TerminosDeUsoPage = lazy(() => import("./pages/TerminosDeUsoPage"));
const PoliticaCookiesPage = lazy(() => import("./pages/PoliticaCookiesPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2,
    },
  },
});

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const { data: miembro, isLoading: miembroLoading } = useCurrentMiembro(user);
  const { data: tenant, isLoading: tenantLoading } = useTenant();
  const location = useLocation();

  const onboardingMiembroValue = useMemo(() => ({ miembro: miembro ?? null }), [miembro]);

  // Solo mostrar el gate global en la carga inicial (sin datos aún).
  // Un refetch o evento de auth en segundo plano deja isLoading en false y
  // conserva el estado conocido, por lo que NO colapsa el árbol ya montado
  // ni cae a la rama no-autenticada de forma transitoria.
  const cargaInicial =
    loading || (!!user && ((miembroLoading && !miembro) || (tenantLoading && !tenant)));

  if (cargaInicial) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Cargando…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />
        <Route path="/politica-privacidad" element={<PoliticaPrivacidadPage />} />
        <Route path="/terminos-de-uso" element={<TerminosDeUsoPage />} />
        <Route path="/politica-cookies" element={<PoliticaCookiesPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    );
  }

  const diasRestantes = tenant?.trial_ends_at
    ? Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 30 // default seguro si no hay fecha

  const suscripcionVencida = !tenant
    ? false // si el tenant no cargó, no bloquear
    : tenant.plan === 'trial'
      ? (!tenant.suscripcion_activa && diasRestantes <= 0)
      : !tenant.suscripcion_activa

  if (suscripcionVencida) return <SuscripcionVencidaPage onLogout={signOut} />;

  // Permitir que el superadmin entre a su panel saltándose el onboarding
  if (location.pathname === '/superadmin') {
    return (
      <Routes>
        <Route path="/superadmin" element={<SuperAdminDashboard />} />
      </Routes>
    );
  }

  // Siempre asumir que estamos en PH, ya que la aplicación se separó.
  // Si no hay unidades configuradas, mandar al onboarding de PH.
  if (!tenant || tenant?.num_unidades === 0 || tenant?.num_unidades === null) {
    return (
      <MiembroProvider value={onboardingMiembroValue}>
        <OnboardingPHPage />
      </MiembroProvider>
    );
  }

  if (!miembro) {
    // Fallback if no member exists but tenant does (edge case)
    return <OnboardingPHPage />;
  }

  return (
    <MiembroProvider value={{ miembro }}>
      <AppLayout onLogout={signOut}>
        <Routes>
          <Route path="/" element={<DashboardPHPage />} />
          <Route path="/ph/unidades" element={<AppLayout onLogout={signOut}><UnidadesPage /></AppLayout>} />

          {/* Panel de Dueño del Software */}
          <Route path="/superadmin" element={<SuperAdminDashboard />} />

          {/* Catch-all */}
          <Route path="/unidades" element={<UnidadesPage />} />
          <Route path="/cobros" element={<CobrosPage />} />
          <Route path="/zonas" element={<ZonasPage />} />
          <Route path="/reservas" element={<ReservasPage />} />
          <Route path="/pqr" element={<PQRPage />} />
          <Route path="/presupuesto" element={<PresupuestoPage />} />
          <Route path="/portal" element={<PortalResidentePage />} />
          <Route path="/ayuda" element={<AyudaPage />} />
          <Route path="/cumplimiento" element={<CumplimientoPage />} />
          <Route path="/politica-privacidad" element={<PoliticaPrivacidadPage />} />
          <Route path="/terminos-de-uso" element={<TerminosDeUsoPage />} />
          <Route path="/politica-cookies" element={<PoliticaCookiesPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppLayout>
    </MiembroProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="text-muted-foreground text-sm">Cargando…</div>
            </div>
          }
        >
          <AppContent />
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
