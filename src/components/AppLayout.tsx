import { useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Menu,
  X,
  LogOut,
  User,
  BarChart3,
  Building2,
  DollarSign,
  MessageSquare,
  Layers,
  CalendarDays,
  PieChart,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMiembroContext } from "@/contexts/MiembroContext";
import { useTenant } from "@/hooks/useTenant";
import { TrialBanner } from "./shared/TrialBanner";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const phAdminNavItems: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/unidades", icon: Building2, label: "Unidades" },
  { to: "/cobros", icon: DollarSign, label: "Cobros" },
  { to: "/zonas", icon: Layers, label: "Zonas" },
  { to: "/reservas", icon: CalendarDays, label: "Reservas" },
  { to: "/presupuesto", icon: PieChart, label: "Presupuesto" },
  { to: "/pqr", icon: MessageSquare, label: "PQR" },
  { to: "/cumplimiento", icon: ShieldCheck, label: "Cumplimiento" },
  { to: "/portal", icon: User, label: "Mi Portal" },
  { to: "/ayuda", icon: HelpCircle, label: "Manual de Uso" },
];

const phPropietarioNavItems: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/cobros", icon: DollarSign, label: "Mis Cobros" },
  { to: "/pqr", icon: MessageSquare, label: "PQR" },
  { to: "/portal", icon: User, label: "Mi Portal" },
  { to: "/ayuda", icon: HelpCircle, label: "Manual de Uso" },
];

interface AppLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

const AppLayout = ({ children, onLogout }: AppLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { miembro } = useMiembroContext();
  const { data: tenant } = useTenant();

  const appName = tenant?.nombre ?? "CoproAdmin";
  const navItems: NavItem[] = miembro.rol === "admin_ph" ? phAdminNavItems : phPropietarioNavItems;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground lg:hidden">
        <div className="flex items-center justify-between h-14 px-4">
          <span className="font-bold text-lg">{appName}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-primary-foreground hover:bg-primary/80 min-h-[48px] min-w-[48px]"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 lg:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-primary text-primary-foreground transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-14 px-4 border-b border-primary-foreground/10">
          <span className="font-bold text-lg">{appName}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            className="text-primary-foreground hover:bg-primary/80 min-h-[48px] min-w-[48px]"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 min-h-[48px] text-sm transition-colors",
                  isActive
                    ? "bg-primary-foreground/10 font-medium"
                    : "hover:bg-primary-foreground/5",
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 min-h-[48px] text-sm w-full text-left hover:bg-primary-foreground/5 text-primary-foreground/70"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </nav>
      </aside>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-primary text-primary-foreground">
          <div className="flex items-center h-16 px-6 border-b border-primary-foreground/10">
            <span className="font-bold text-xl">{appName}</span>
          </div>

          <nav className="flex-1 py-4 space-y-1 px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-3 min-h-[48px] rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground font-medium"
                      : "hover:bg-primary-foreground/10",
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-3 border-t border-primary-foreground/10">
            <div className="px-3 py-2 text-xs text-primary-foreground/50 truncate">
              {miembro.nombre_completo} · {miembro.rol}
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-3 px-3 py-3 min-h-[48px] rounded-lg text-sm w-full hover:bg-primary-foreground/10 text-primary-foreground/70 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Cerrar sesión
            </button>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64">
          <TrialBanner />
          <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
