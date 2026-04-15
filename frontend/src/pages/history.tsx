import { useGetAnalysisHistory } from "@/lib/api";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ImageIcon } from "lucide-react";

export default function History() {
  const { data: history, isLoading } = useGetAnalysisHistory({ limit: 50 });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Analysis Vault</h1>
        <p className="text-muted-foreground text-lg">
          Browse and review past image insights and contextual breakdowns.
        </p>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden border-border/50 bg-card/50">
              <Skeleton className="h-48 w-full rounded-none" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : history?.length === 0 ? (
        <div className="text-center py-24 px-4 border-2 border-dashed border-border rounded-xl bg-card/30">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No history yet</h3>
          <p className="text-muted-foreground">Scan your first image to populate the vault.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {history?.map((record) => (
            <Card key={record.id} className="overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-colors group cursor-pointer flex flex-col">
              <div className="relative aspect-video overflow-hidden bg-black/40">
                <img 
                  src={record.imageUrl} 
                  alt="Analyzed" 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100 mix-blend-luminosity group-hover:mix-blend-normal" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                  <div className="flex flex-wrap gap-1.5">
                    {record.modelsUsed.split(',').map((model) => (
                      <Badge key={model} variant="secondary" className="bg-background/80 backdrop-blur text-xs capitalize">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <CardContent className="p-5 flex-1">
                <p className="text-sm text-foreground line-clamp-3 leading-relaxed">
                  {record.combinedSummary}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {record.tags.slice(0, 4).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] border-border/50 text-muted-foreground">
                      {tag}
                    </Badge>
                  ))}
                  {record.tags.length > 4 && (
                    <Badge variant="outline" className="text-[10px] border-border/50 text-muted-foreground">
                      +{record.tags.length - 4}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="p-5 pt-0 text-xs text-muted-foreground border-t border-border/50 bg-secondary/10 mt-auto flex justify-between items-center">
                <span>ID: {record.id}</span>
                <span>{format(new Date(record.createdAt), "MMM d, yyyy h:mm a")}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
