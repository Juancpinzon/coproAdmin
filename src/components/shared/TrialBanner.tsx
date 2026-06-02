import { useTenant } from "@/hooks/useTenant";
import { motion } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export function TrialBanner() {
  const { data: tenant } = useTenant();
  const [modalOpen, setModalOpen] = useState(false);

  if (!tenant || !tenant.trial_ends_at || tenant.plan !== 'trial') return null;

  const diasRestantes = Math.ceil((new Date(tenant.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (diasRestantes <= 0 || !tenant.suscripcion_activa) return null;

  const isUrgent = diasRestantes <= 7;

  return (
    <>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`w-full py-2 px-4 flex items-center justify-center gap-3 text-sm font-medium ${
          isUrgent ? 'bg-amber-100 text-amber-900 border-b border-amber-200' : 'bg-blue-50 text-blue-900 border-b border-blue-100'
        }`}
      >
        {isUrgent ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
        <span>
          {isUrgent 
            ? `⚠️ Tu periodo de prueba vence en ${diasRestantes} días · ` 
            : `Periodo de prueba: ${diasRestantes} días restantes · `}
        </span>
        <button 
          onClick={() => setModalOpen(true)}
          className="underline font-bold hover:opacity-80 transition-opacity"
        >
          {isUrgent ? '[Activar plan →]' : 'Activar tu plan para continuar'}
        </button>
      </motion.div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activar Plan</DialogTitle>
            <DialogDescription>
              Para activar tu plan, escríbenos por WhatsApp al <strong>3001234567</strong> o envía tu comprobante de pago a <strong>admin@fondoapp.co</strong>
              <br/><br/>
              Planes:
              <br/>- PH Básico $89.000/mes
              <br/>- PH Pro $149.000/mes
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end mt-4">
            <Button onClick={() => setModalOpen(false)}>Cerrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
