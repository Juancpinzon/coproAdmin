import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface TenantAdmin {
  id: string;
  nombre: string;
  slug: string;
  suscripcion_activa: boolean;
  plan: string;
  trial_ends_at: string;
  created_at: string;
}

export function useSuperAdmin() {
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [tenants, setTenants] = useState<TenantAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsSuperAdmin(false);
      setLoading(false);
      return;
    }

    checkSuperAdmin();
  }, [user]);

  const checkSuperAdmin = async () => {
    try {
      // Usamos el RPC para verificar
      const { data, error } = await supabase.rpc('is_super_admin');
      
      if (error) throw error;
      
      setIsSuperAdmin(!!data);
      
      if (data) {
        await fetchTenants();
      }
    } catch (error) {
      console.error("Error verificando super admin:", error);
      setIsSuperAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error("Error fetching tenants:", error);
    }
  };

  const toggleSuscripcion = async (tenantId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ suscripcion_activa: !currentState })
        .eq('id', tenantId);

      if (error) throw error;
      
      // Actualizar estado local
      setTenants(prev => prev.map(t => 
        t.id === tenantId ? { ...t, suscripcion_activa: !currentState } : t
      ));
      
      return { success: true };
    } catch (error: any) {
      console.error("Error updating tenant:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    isSuperAdmin,
    tenants,
    loading,
    toggleSuscripcion,
    refresh: fetchTenants
  };
}
