import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TemaAyuda, preguntasFrecuentes } from "./AyudaData";
import { cn } from "@/lib/utils";

interface ContenidoAyudaProps {
  tema?: TemaAyuda;
  isFaq?: boolean;
}

export function ContenidoAyuda({ tema, isFaq }: ContenidoAyudaProps) {
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  if (isFaq) {
    return (
      <motion.div
        key="faq"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-3xl"
      >
        <h2 className="text-2xl font-bold mb-2">Preguntas Frecuentes</h2>
        <p className="text-muted-foreground mb-8">
          Encuentra respuestas rápidas a las dudas más comunes sobre la plataforma.
        </p>

        <div className="space-y-4">
          {preguntasFrecuentes.map((faq) => (
            <div key={faq.id} className="border rounded-lg bg-card overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-muted/50 transition-colors"
              >
                {faq.q}
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    openFaq === faq.id && "rotate-180"
                  )}
                />
              </button>
              <AnimatePresence>
                {openFaq === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 pt-0 text-muted-foreground border-t">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!tema) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Info className="h-12 w-12 mb-4 opacity-20" />
        <p>Selecciona un tema en el menú de la izquierda para ver su contenido.</p>
      </div>
    );
  }

  return (
    <motion.div
      key={tema.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="max-w-3xl"
    >
      <div className="mb-8">
        <Badge variant="outline" className="mb-3 text-blue-600 bg-blue-50 border-blue-200">
          {tema.section}
        </Badge>
        <h2 className="text-3xl font-bold mb-3">{tema.title}</h2>
        <p className="text-lg text-muted-foreground">{tema.desc}</p>
      </div>

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-4 border-b pb-2">Guía paso a paso</h3>
        <ol className="space-y-4">
          {tema.steps.map((paso, index) => (
            <li key={index} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                {index + 1}
              </div>
              <div className="pt-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{paso.titulo}</p>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed" 
                   dangerouslySetInnerHTML={{ __html: paso.detalle }} />
              </div>
            </li>
          ))}
        </ol>
      </div>
      
      {tema.title === 'PQR' && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded p-4 bg-muted/20">
            <Badge variant="outline" className="mb-2">Petición</Badge>
            <p className="text-sm text-muted-foreground">Solicitud de información o servicios al administrador.</p>
          </div>
          <div className="border rounded p-4 bg-muted/20">
            <Badge variant="outline" className="mb-2">Queja</Badge>
            <p className="text-sm text-muted-foreground">Inconformidad con el servicio o convivencia.</p>
          </div>
          <div className="border rounded p-4 bg-muted/20">
            <Badge variant="outline" className="mb-2">Reclamo</Badge>
            <p className="text-sm text-muted-foreground">Incumplimiento de normas o derechos.</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
