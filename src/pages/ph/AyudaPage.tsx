import { useState } from "react";
import { SidebarAyuda } from "@/components/ph/SidebarAyuda";
import { ContenidoAyuda } from "@/components/ph/ContenidoAyuda";
import { temasAyuda } from "@/components/ph/AyudaData";

export default function AyudaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTopic, setActiveTopic] = useState<string>("admin-dashboard");

  const isFaq = activeTopic === 'faq';
  const activeTema = temasAyuda.find(t => t.id === activeTopic);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)] -mt-4 -mx-4 md:-mx-8 overflow-hidden bg-background">
      <div className="border-b px-6 py-4 flex items-center justify-between shrink-0 bg-card">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manual de Uso</h1>
          <p className="text-sm text-muted-foreground">Guia completa para administradores y residentes</p>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <SidebarAyuda 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeTopic={activeTopic}
          setActiveTopic={setActiveTopic}
        />
        
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/10">
          <ContenidoAyuda 
            tema={activeTema}
            isFaq={isFaq}
          />
        </div>
      </div>
    </div>
  );
}
