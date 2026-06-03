import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SuscripcionVencidaPageProps {
  onLogout: () => void;
}

const WA_HREF =
  "https://wa.me/573000000000?text=Hola%2C%20quiero%20activar%20mi%20suscripci%C3%B3n%20a%20CoproAdmin";

const SuscripcionVencidaPage = ({ onLogout }: SuscripcionVencidaPageProps) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
    <Lock className="w-24 h-24 text-slate-300 mb-6" />
    <h1 className="text-3xl font-bold text-slate-900 mb-2 text-center">
      Tu período de prueba ha vencido
    </h1>
    <p className="text-slate-500 mb-8 text-center max-w-md">
      Para continuar usando CoproAdmin activa tu suscripción
    </p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center">PH Básico</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-3xl font-bold">
            $89.000<span className="text-sm font-normal text-slate-500">/mes</span>
          </p>
          <p className="text-sm text-slate-500 mt-1">Hasta 50 unidades</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center">PH Pro</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-3xl font-bold">
            $149.000<span className="text-sm font-normal text-slate-500">/mes</span>
          </p>
          <p className="text-sm text-slate-500 mt-1">51 a 200 unidades</p>
        </CardContent>
      </Card>
    </div>

    <Button
      size="lg"
      className="w-full max-w-sm mb-6 text-lg h-14"
      onClick={() => window.open(WA_HREF, "_blank")}
    >
      Contactar para activar
    </Button>

    <button
      onClick={onLogout}
      className="text-slate-500 hover:text-slate-900 underline text-sm"
    >
      Cerrar sesión
    </button>
  </div>
);

export default SuscripcionVencidaPage;
