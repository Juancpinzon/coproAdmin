import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useMiembroContext } from '@/contexts/MiembroContext'

interface InvitarMiembroParams {
  nombre_completo: string
  email: string
  telefono: string
  aporte_inicial: number
  rol: 'miembro' | 'comite' | 'tesorero' | 'admin'
}

export function useInvitarMiembro() {
  const qc = useQueryClient()
  const { miembro } = useMiembroContext()

  return useMutation({
    mutationFn: async ({
      nombre_completo,
      email,
      telefono,
      aporte_inicial,
      rol,
    }: InvitarMiembroParams) => {
      // 1. Crear el miembro (user_id null hasta que haga login)
      const { data: nuevoMiembro, error: errorMiembro } = await supabase
        .from('miembros')
        .insert({
          tenant_id:       miembro.tenant_id,
          nombre_completo: nombre_completo.trim(),
          email:           email.trim().toLowerCase(),
          telefono:        telefono.trim(),
          rol,
          estado:          'activo',
          aporte_inicial,
          user_id:         null,
        })
        .select('id')
        .single()

      if (errorMiembro) throw errorMiembro

      // 2. Registrar el aporte inicial como movimiento del fondo
      if (aporte_inicial > 0) {
        const { error: errorMovimiento } = await supabase
          .from('movimientos_fondo')
          .insert({
            tenant_id:      miembro.tenant_id,
            tipo:           'aporte',
            monto:          aporte_inicial,
            descripcion:    `Aporte inicial — ${nombre_completo.trim()}`,
            registrado_por: miembro.id,
            miembro_id:     nuevoMiembro.id,
          })

        if (errorMovimiento) throw errorMovimiento
      }

      // El nuevo miembro se registra por su cuenta en la pantalla de login
      // con el mismo email. El trigger vincular_usuario_a_miembro lo enlazará
      // automáticamente al fondo cuando cree su cuenta.
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['miembros'] })
      qc.invalidateQueries({ queryKey: ['transacciones'] })
      qc.invalidateQueries({ queryKey: ['fondo-stats'] })
    },
  })
}
