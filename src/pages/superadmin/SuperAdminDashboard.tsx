import React from 'react';
import { useSuperAdmin } from '@/hooks/useSuperAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ShieldAlert, Users, Building2, Calendar, Power } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboard = () => {
  const { isSuperAdmin, tenants, loading, toggleSuscripcion } = useSuperAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (loading) {
    return <div className="p-10 text-center">Cargando panel de administración...</div>;
  }

  if (isSuperAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full border-red-100 shadow-xl shadow-red-100/50">
          <CardContent className="pt-6 text-center space-y-4">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-slate-800">Acceso Denegado</h2>
            <p className="text-slate-500">No tienes permisos para ver esta pantalla.</p>
            <Button className="w-full mt-4" onClick={() => navigate('/')}>Volver al inicio</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleToggle = async (id: string, currentState: boolean, nombre: string) => {
    const action = currentState ? 'desactivar' : 'activar';
    if (!window.confirm(`¿Estás seguro de ${action} el servicio para ${nombre}?`)) return;

    const result = await toggleSuscripcion(id, currentState);
    if (result.success) {
      toast({
        title: "Suscripción actualizada",
        description: `El servicio para ${nombre} ha sido ${currentState ? 'desactivado' : 'activado'}.`,
      });
    } else {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado.",
        variant: "destructive"
      });
    }
  };

  const activeCount = tenants.filter(t => t.suscripcion_activa).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">CoproAdmin <span className="text-blue-600">Backoffice</span></h1>
            <p className="text-slate-500 mt-1">Panel de control exclusivo para el dueño del software.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>Volver a la App</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Conjuntos</p>
                <h3 className="text-3xl font-bold text-slate-900">{tenants.length}</h3>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-4 bg-green-50 text-green-600 rounded-2xl">
                <Power className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Suscripciones Activas</p>
                <h3 className="text-3xl font-bold text-slate-900">{activeCount}</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Suscripciones Cortadas</p>
                <h3 className="text-3xl font-bold text-slate-900">{tenants.length - activeCount}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Directorio de Clientes</CardTitle>
            <CardDescription>Gestiona el acceso de todas las propiedades horizontales registradas.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-xl">Conjunto</th>
                    <th className="px-4 py-3">Slug (URL)</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3">Registro</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-right rounded-tr-xl">Activar / Cortar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 font-medium text-slate-900">{t.nombre}</td>
                      <td className="px-4 py-4 text-slate-500">{t.slug}</td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className="capitalize bg-white">{t.plan}</Badge>
                      </td>
                      <td className="px-4 py-4 text-slate-500">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge variant={t.suscripcion_activa ? "default" : "destructive"} className={t.suscripcion_activa ? "bg-green-500" : ""}>
                          {t.suscripcion_activa ? 'Activo' : 'Cortado'}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch 
                            checked={t.suscripcion_activa} 
                            onCheckedChange={() => handleToggle(t.id, t.suscripcion_activa, t.nombre)}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Aún no hay clientes registrados en la plataforma.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
