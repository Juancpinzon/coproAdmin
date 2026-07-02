import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useMiembro } from '@/contexts/MiembroContext'

interface InvitarMiembroParams {
  nombre_completo: string
  email: string
  telefono: string
  rol: 'admin_ph' | 'propietario' | 'residente'
}

export function useInvitarMiembro() {
  const qc = useQueryClient()
  const miembro = useMiembro()

  return useMutation({
    mutationFn: async ({
      nombre_completo,
      email,
      telefono,
      rol,
    }: InvitarMiembroParams) => {
      const { error } = await supabase
        .from('miembros')
        .insert({
          tenant_id:       miembro.tenant_id,
          nombre_completo: nombre_completo.trim(),
          email:           email.trim().toLowerCase(),
          telefono:        telefono.trim(),
          rol,
          estado:          'activo',
          user_id:         null,
        })

      if (error) throw error

      // El nuevo miembro se registra por su cuenta en la pantalla de login
      // con el mismo email. El trigger vincular_usuario_a_miembro lo enlazará
      // automáticamente al conjunto cuando cree su cuenta.
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['miembros'] })
    },
  })
}
