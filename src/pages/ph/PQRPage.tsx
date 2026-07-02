import { useState } from "react"
import { usePQR, useUpdatePQR, type PQR } from "@/hooks/usePQR"
import { getErrorMessage } from "@/lib/utils"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

export default function PQRPage() {
  const { data: pqrs = [], isLoading } = usePQR()
  const updatePQR = useUpdatePQR()
  const { toast } = useToast()

  const [filtroEstado, setFiltroEstado] = useState<string>("todos")
  const [filtroTipo, setFiltroTipo] = useState<string>("todos")
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedPQR, setSelectedPQR] = useState<PQR | null>(null)
  
  const [estadoEdit, setEstadoEdit] = useState<"abierto" | "en_gestion" | "cerrado">("abierto")
  const [respuestaEdit, setRespuestaEdit] = useState("")

  const filteredPQRs = pqrs.filter((p) =>
    (filtroEstado === "todos" || p.estado === filtroEstado) &&
    (filtroTipo === "todos" || p.tipo === filtroTipo)
  )

  const abiertos = pqrs.filter((p) => p.estado === "abierto").length;
  const enGestion = pqrs.filter((p) => p.estado === "en_gestion").length;
  const cerrados = pqrs.filter((p) => p.estado === "cerrado").length;

  const handleOpenEdit = (pqr: PQR) => {
    setSelectedPQR(pqr)
    setEstadoEdit(pqr.estado)
    setRespuestaEdit(pqr.respuesta || "")
    setOpenDialog(true)
  }

  const handleUpdate = async () => {
    if (!selectedPQR) return
    try {
      await updatePQR.mutateAsync({
        id: selectedPQR.id,
        estado: estadoEdit,
        respuesta: respuestaEdit,
      })
      toast({ title: "PQR actualizado exitosamente" })
      setOpenDialog(false)
    } catch (e: unknown) {
      toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de PQR</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {abiertos} abiertos · {enGestion} en gestión · {cerrados} cerrados
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="peticion">Petición</SelectItem>
              <SelectItem value="queja">Queja</SelectItem>
              <SelectItem value="reclamo">Reclamo</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="abierto">Abiertos</SelectItem>
              <SelectItem value="en_gestion">En gestión</SelectItem>
              <SelectItem value="cerrado">Cerrados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPQRs.map(pqr => (
          <Card key={pqr.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => handleOpenEdit(pqr)}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{pqr.asunto}</CardTitle>
                <Badge variant={pqr.tipo === 'peticion' ? 'default' : pqr.tipo === 'queja' ? 'destructive' : 'secondary'}>
                  {pqr.tipo}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm text-muted-foreground line-clamp-2">
                {pqr.descripcion}
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm font-medium">Unidad: {pqr.unidades?.numero}</div>
                <Badge variant={pqr.estado === 'cerrado' ? 'outline' : pqr.estado === 'en_gestion' ? 'secondary' : 'default'}>
                  {pqr.estado.replace('_', ' ')}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                {new Date(pqr.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredPQRs.length === 0 && !isLoading && (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            No hay PQR que coincidan con los filtros.
          </div>
        )}
      </div>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detalle PQR</DialogTitle>
          </DialogHeader>
          {selectedPQR && (
            <div className="space-y-4 py-4">
              <div className="rounded-md bg-muted p-4 space-y-2 text-sm">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-base">{selectedPQR.asunto}</span>
                  <Badge variant="outline" className="capitalize">{selectedPQR.tipo}</Badge>
                </div>
                <p className="text-muted-foreground whitespace-pre-wrap">{selectedPQR.descripcion}</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
                  <span>Unidad: {selectedPQR.unidades?.numero}</span>
                  <span>{new Date(selectedPQR.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {selectedPQR.estado !== "cerrado" ? (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Estado de gestión</Label>
                    <Select value={estadoEdit} onValueChange={(v) => setEstadoEdit(v as "abierto" | "en_gestion" | "cerrado")}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="abierto">Abierto</SelectItem>
                        <SelectItem value="en_gestion">En gestión</SelectItem>
                        <SelectItem value="cerrado">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Respuesta</Label>
                    <Input 
                      value={respuestaEdit} 
                      onChange={(e) => setRespuestaEdit(e.target.value)} 
                      placeholder="Añadir una respuesta..."
                    />
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button onClick={handleUpdate} disabled={updatePQR.isPending} className="w-full">
                      Guardar cambios
                    </Button>
                    {(selectedPQR.estado === "abierto" || selectedPQR.estado === "en_gestion") && (
                      <Button 
                        variant="destructive"
                        onClick={async () => {
                          setEstadoEdit("cerrado");
                          // Let the component update state, then call handleUpdate in effect or do it directly
                          try {
                            await updatePQR.mutateAsync({
                              id: selectedPQR.id,
                              estado: "cerrado",
                              respuesta: respuestaEdit || "Cerrado por el administrador",
                            });
                            toast({ title: "PQR cerrado exitosamente" })
                            setOpenDialog(false)
                          } catch (e: unknown) {
                            toast({ title: "Error", description: getErrorMessage(e), variant: "destructive" })
                          }
                        }} 
                        disabled={updatePQR.isPending} 
                        className="w-full"
                      >
                        Cerrar PQR
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-4 border-t">
                  <Label>Respuesta del administrador</Label>
                  <p className="text-sm p-3 bg-primary/5 rounded-md">
                    {selectedPQR.respuesta || "Sin respuesta registrada."}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
