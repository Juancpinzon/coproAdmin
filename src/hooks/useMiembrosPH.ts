import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface MiembroPH {
  id: string
  nombre_completo: string
  email: string | null
  rol: 'admin_ph' | 'propietario' | 'residente'
}

export function useMiembrosPH() {
  return useQuery<MiembroPH[]>({
    queryKey: ['miembros_ph'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('miembros')
        .select('id, nombre_completo, email, rol')
        .eq('estado', 'activo')
        .order('nombre_completo')
      if (error) throw error
      return data as MiembroPH[]
    },
  })
}
