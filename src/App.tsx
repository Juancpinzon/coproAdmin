import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentMiembro } from "@/hooks/useCurrentMiembro";
import { useTenant } from "@/hooks/useTenant";
import { MiembroProvider } from "@/contexts/MiembroContext";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import RegistroPage from "./pages/RegistroPage";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";
import DashboardPHPage from "./pages/ph/DashboardPHPage";
import UnidadesPage from "./pages/ph/UnidadesPage";
import CobrosPage from "./pages/ph/CobrosPage";
import PQRPage from "./pages/ph/PQRPage";
import OnboardingPHPage from "./pages/ph/OnboardingPHPage";
import ZonasPage from "./pages/ph/ZonasPage";
import ReservasPage from "./pages/ph/ReservasPage";
import PortalResidentePage from "./pages/ph/PortalResidentePage";
import PresupuestoPage from "./pages/ph/PresupuestoPage";
import AyudaPage from "./pages/ph/AyudaPage";
import SuscripcionVencidaPage from "./pages/SuscripcionVencidaPage";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import PoliticaPrivacidadPage from "./pages/PoliticaPrivacidadPage";
import TerminosDeUsoPage from "./pages/TerminosDeUsoPage";
import PoliticaCookiesPage from "./pages/PoliticaCookiesPage";

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

  if (loading || miembroLoading || tenantLoading) {
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
      <MiembroProvider value={{ miembro: miembro as any }}>
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
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
