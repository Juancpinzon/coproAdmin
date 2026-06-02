import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'

interface Props {
  comprobante_url: string
  open:            boolean
  onClose:         () => void
}

const ComprobanteViewer = ({ comprobante_url, open, onClose }: Props) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!open || !comprobante_url) return
    setLoading(true)
    setError(null)

    supabase.storage
      .from('comprobantes')
      .createSignedUrl(comprobante_url, 120)  // 2 minutos de vida
      .then(({ data, error: err }) => {
        if (err || !data?.signedUrl) {
          setError('No se pudo cargar el comprobante')
        } else {
          setSignedUrl(data.signedUrl)
        }
        setLoading(false)
      })

    return () => setSignedUrl(null)
  }, [open, comprobante_url])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Comprobante</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          {loading && <Skeleton className="w-full h-64 rounded-lg" />}
          {error && (
            <p className="text-center text-destructive text-sm py-8">{error}</p>
          )}
          {!loading && !error && signedUrl && (
            <img
              src={signedUrl}
              alt="Comprobante de pago"
              className="w-full rounded-lg object-contain max-h-[60vh]"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ComprobanteViewer
