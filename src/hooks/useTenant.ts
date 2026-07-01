import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Tenant } from '@/types/database'

export function useTenant() {
  return useQuery<Tenant>({
    queryKey: ['tenant'],
    queryFn: async () => {
      // Resolver el miembro vía RPC SECURITY DEFINER (LIMIT 1). Robusto ante
      // 0 o múltiples filas — evita el 406 de .single() sobre miembros, que
      // bloqueaba salir del onboarding si el usuario tenía miembros duplicados.
      const { data: miembroRows, error: me } = await supabase.rpc('get_my_miembro')
      if (me) throw me
      const tenantId = (miembroRows as Array<{ tenant_id: string }> | null)?.[0]?.tenant_id
      if (!tenantId) throw new Error('El usuario no tiene un conjunto asignado')

      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
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
