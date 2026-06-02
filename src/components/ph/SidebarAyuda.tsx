import { BookOpen, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TemaAyuda, temasAyuda } from "./AyudaData";

interface SidebarAyudaProps {
  searchTerm: string;
  setSearchTerm: (t: string) => void;
  activeTopic: string;
  setActiveTopic: (t: string) => void;
}

export function SidebarAyuda({ searchTerm, setSearchTerm, activeTopic, setActiveTopic }: SidebarAyudaProps) {
  const filteredTemas = temasAyuda.filter((t) => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const adminTemas = filteredTemas.filter(t => t.section === 'Para Admin');
  const resTemas = filteredTemas.filter(t => t.section === 'Para Residente');

  const renderSection = (title: string, temas: TemaAyuda[]) => {
    if (temas.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-2 px-2">
          {title}
        </h3>
        <ul className="space-y-1">
          {temas.map(tema => (
            <li key={tema.id}>
              <button
                onClick={() => setActiveTopic(tema.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                  activeTopic === tema.id
                    ? "bg-blue-100 text-blue-700 font-medium dark:bg-blue-900/40 dark:text-blue-300"
                    : "hover:bg-muted text-foreground/80"
                )}
              >
                <ChevronRight className={cn("h-4 w-4 opacity-50", activeTopic === tema.id && "opacity-100")} />
                {tema.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="w-full md:w-64 flex-shrink-0 flex flex-col h-full border-r bg-card/50">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tema..."
            className="pl-8 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="p-4 flex-1 overflow-y-auto">
        {renderSection("Para Admin", adminTemas)}
        {renderSection("Para Residente", resTemas)}
        
        <div className="mt-4 pt-4 border-t">
          <button
            onClick={() => setActiveTopic('faq')}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold transition-colors text-left",
              activeTopic === 'faq'
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "hover:bg-muted text-foreground/80"
            )}
          >
            <BookOpen className="h-4 w-4" />
            Preguntas Frecuentes
          </button>
        </div>
      </div>
    </div>
  );
}
