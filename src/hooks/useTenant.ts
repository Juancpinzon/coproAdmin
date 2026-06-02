import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tenant } from '@/types/database'

export function useTenant() {
  return useQuery<Tenant>({
    queryKey: ['tenant'],
    queryFn: async () => {
      // Primero obtener tenant_id desde miembros
      const { data: miembro, error: me } = await supabase
        .from('miembros')
        .select('tenant_id')
        .single()
      if (me) throw me

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', miembro.tenant_id)
        .single()
      if (error) throw error
      return data as Tenant
    },
  })
}

export function useUpdateTenant() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (updates: Partial<Pick<Tenant, 'nombre' | 'cuota_mensual' | 'dia_corte' | 'tasa_interes_mensual' | 'multa_mora' | 'trial_ends_at' | 'suscripcion_activa' | 'plan'>>) => {
      // Obtenemos el tenant_id del perfil actual
      const { data: miembro, error: me } = await supabase
        .from('miembros')
        .select('tenant_id')
        .single()
      if (me) throw me

      const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', miembro.tenant_id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant'] })
    },
  })
}
