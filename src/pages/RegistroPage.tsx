import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Building2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type TenantType = "propiedad_horizontal" | "fondo_familiar";

const RegistroPage = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [tenantType, setTenantType] = useState<TenantType>("propiedad_horizontal");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: "La contraseña debe tener mínimo 8 caracteres", variant: "destructive" });
      return;
    }
    if (password !== passwordConfirm) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre_completo: nombre,
            tenant_type: tenantType,
          },
        },
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("No se pudo crear el usuario");

      const slug = nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Math.random().toString(36).slice(2,8);

      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          nombre: nombre,
          tenant_type: tenantType,
          slug,
          num_unidades: 0,
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          suscripcion_activa: true,
          plan: 'trial'
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      const rol = tenantType === 'propiedad_horizontal' ? 'admin_ph' : 'admin_fondo';
      const { error: miembroError } = await supabase
        .from('miembros')
        .insert({
          tenant_id: tenantData.id,
          user_id: user.id,
          nombre_completo: nombre,
          email,
          rol,
          estado: 'activo'
        });

      if (miembroError) throw miembroError;

      toast({ title: "Cuenta creada exitosamente" });
      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Error al crear la cuenta",
        description: error.message || "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md shadow-lg border-0 shadow-primary/5">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto w-12 h-12 mb-2 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-xl font-bold text-primary-foreground">F</span>
          </div>
          <CardTitle className="text-2xl font-bold">Crear tu cuenta</CardTitle>
          <CardDescription>
            {step === 1 ? "Selecciona el tipo de cuenta que necesitas" : "Completa tus datos de acceso"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 1 ? (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div
                  className={`relative flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                    tenantType === "propiedad_horizontal"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setTenantType("propiedad_horizontal")}
                >
                  <div className={`p-3 rounded-lg ${tenantType === "propiedad_horizontal" ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600"}`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Propiedad Horizontal</h3>
                    <p className="text-sm text-slate-500">Conjuntos y edificios</p>
                  </div>
                </div>

                <div
                  className={`relative flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all ${
                    tenantType === "fondo_familiar"
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setTenantType("fondo_familiar")}
                >
                  <div className={`p-3 rounded-lg ${tenantType === "fondo_familiar" ? "bg-primary text-primary-foreground" : "bg-slate-100 text-slate-600"}`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Fondo Familiar</h3>
                    <p className="text-sm text-slate-500">Grupos de ahorro</p>
                  </div>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={() => setStep(2)}>
                Continuar
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input
                  id="nombre"
                  placeholder="Tu nombre o el de la entidad"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="h-12"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">Confirmar contraseña</Label>
                <Input
                  id="passwordConfirm"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="h-12"
                  required
                  disabled={loading}
                  minLength={8}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" size="lg" className="px-4" onClick={() => setStep(1)} disabled={loading}>
                  Atrás
                </Button>
                <Button type="submit" className="flex-1" size="lg" disabled={loading}>
                  {loading ? "Creando..." : "Crear cuenta"}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-500">¿Ya tienes cuenta? </span>
            <Link to="/login" className="text-primary font-medium hover:underline">
              Inicia sesión
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistroPage;
