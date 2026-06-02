import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type Mode = "login" | "register";

const LoginPage = () => {
  const [mode, setMode]           = useState<Mode>("login");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading]     = useState(false);
  const [registered, setRegistered] = useState(false);

  const { toast }         = useToast();
  const { signIn, signUp } = useAuth();

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword("");
    setPassword2("");
    setRegistered(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "register" && password !== password2) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "La contraseña debe tener mínimo 6 caracteres", variant: "destructive" });
      return;
    }

    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) {
        const msg =
          error.message === "Invalid login credentials"
            ? "Correo o contraseña incorrectos"
            : error.message.toLowerCase().includes("email not confirmed")
            ? "Debes confirmar tu correo antes de ingresar. Revisa tu bandeja de entrada."
            : error.message;
        toast({ title: "Error al iniciar sesión", description: msg, variant: "destructive" });
      }
      // On success, useAuth updates the user state → App.tsx redirects automatically
    } else {
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        setLoading(false);
        toast({
          title:       "Error al crear la cuenta",
          description: signUpError.message,
          variant:     "destructive",
        });
        return;
      }
      // Intentar login inmediato (funciona si confirmación de email está desactivada)
      const { error: signInError } = await signIn(email, password);
      setLoading(false);
      if (signInError) {
        // Confirmación de email requerida — mostrar instrucción
        setRegistered(true);
      }
      // Si signIn tuvo éxito, useAuth actualiza el user y App.tsx redirige automáticamente
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md shadow-lg border-0 shadow-primary/5">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <span className="text-2xl font-bold text-primary-foreground">F</span>
          </div>
          <CardTitle className="text-2xl font-bold text-primary">CoproAdmin</CardTitle>
          <CardDescription className="text-muted-foreground">
            Gestión de Propiedad Horizontal
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          {registered ? (
            <div className="text-center space-y-4 py-4">
              <p className="font-medium text-foreground">¡Cuenta creada!</p>
              <p className="text-sm text-muted-foreground">
                Revisa tu correo <span className="font-medium">{email}</span> y confirma tu cuenta antes de ingresar.
              </p>
              <Button className="w-full" size="lg" onClick={() => switchMode("login")}>
                Ya confirmé, iniciar sesión
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12"
                  required
                  disabled={loading}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
              </div>

              {mode === "register" && (
                <div className="space-y-2">
                  <Label htmlFor="password2">Confirmar contraseña</Label>
                  <Input
                    id="password2"
                    type="password"
                    placeholder="••••••••"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className="h-12"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading
                  ? (mode === "login" ? "Entrando…" : "Creando cuenta…")
                  : (mode === "login" ? "Entrar" : "Crear cuenta")}
              </Button>

              <p className="text-center text-sm">
                {mode === "login" ? (
                  <>
                    <span className="text-muted-foreground">¿Primera vez aquí? </span>
                    <Link
                      to="/registro"
                      className="text-primary font-medium hover:underline"
                    >
                      Crear cuenta
                    </Link>
                  </>
                ) : (
                  <>
                    <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="text-primary font-medium hover:underline"
                    >
                      Iniciar sesión
                    </button>
                  </>
                )}
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;

