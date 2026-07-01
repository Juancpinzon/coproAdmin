import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const RegistroPage = () => {
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
            tenant_type: "propiedad_horizontal",
          },
        },
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("No se pudo crear el usuario");

      // tenant + admin se crean server-side vía RPC SECURITY DEFINER: fija
      // rol='admin_ph' y user_id, sin auto-insertar desde el cliente en
      // miembros. Idempotente: el onboarding luego completa los datos.
      const { error: rpcError } = await supabase.rpc("configurar_conjunto_ph", {
        p_nombre: nombre,
      });

      if (rpcError) throw rpcError;

      toast({ title: "Cuenta creada exitosamente" });
      window.location.href = "/";
    } catch (error: unknown) {
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
            <span className="text-xl font-bold text-primary-foreground">C</span>
          </div>
          <CardTitle className="text-2xl font-bold">Crear tu cuenta</CardTitle>
          <CardDescription>Completa tus datos de acceso</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                placeholder="Tu nombre o el del conjunto"
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
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Creando..." : "Crear cuenta"}
              </Button>
            </div>
          </form>

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
