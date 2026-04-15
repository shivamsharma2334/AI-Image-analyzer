import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetAnalysisHistoryQueryKey, getGetAnalysisStatsQueryKey } from "@/lib/api";
import { UploadCloud, Image as ImageIcon, Loader2, Sparkles, AlertCircle, Clock, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { AnalysisResult } from "@/lib/api";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [models, setModels] = useState({
    gemini: true,
    openai: true,
    deepseek: true,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null); // Clear previous results
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const selected = e.dataTransfer.files?.[0];
    if (selected && selected.type.startsWith("image/")) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    const selectedModels = Object.entries(models)
      .filter(([_, isSelected]) => isSelected)
      .map(([key]) => key)
      .join(",");

    if (!selectedModels) {
      toast({
        title: "No models selected",
        description: "Please select at least one AI model to analyze the image.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);
    if (prompt) formData.append("prompt", prompt);
    formData.append("models", selectedModels);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
      
      // Invalidate queries to update history and stats
      queryClient.invalidateQueries({ queryKey: getGetAnalysisHistoryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
      
      toast({
        title: "Analysis complete",
        description: "The image has been successfully analyzed.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Analysis failed",
        description: "An error occurred while analyzing the image.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Vision Scanner</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Upload an image and run it through multiple AI models simultaneously to extract deep contextual insights, emotional atmosphere, and visual data.
        </p>
      </header>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-6">
          <div 
            className={`border-2 border-dashed rounded-xl p-8 transition-all text-center cursor-pointer ${
              preview ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/30"
            }`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {preview ? (
              <div className="relative w-full aspect-video max-h-[400px] rounded-lg overflow-hidden flex items-center justify-center bg-black/20">
                <img src={preview} alt="Preview" className="object-contain w-full h-full" />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 text-primary">
                    <div className="relative">
                      <Loader2 className="w-12 h-12 animate-spin" />
                      <div className="absolute inset-0 border-t-2 border-accent rounded-full animate-[spin_2s_linear_infinite]" />
                    </div>
                    <p className="font-mono text-sm tracking-widest animate-pulse uppercase">Scanning Multi-Layer Context...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 flex flex-col items-center gap-4 text-muted-foreground">
                <div className="p-4 rounded-full bg-secondary">
                  <UploadCloud className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                  <p className="text-sm">SVG, PNG, JPG or GIF</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-4">
            <Label htmlFor="prompt" className="text-base">Custom Prompt (Optional)</Label>
            <Input 
              id="prompt" 
              placeholder="E.g., Focus on the architectural style and lighting..." 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="bg-card border-border/50 text-base py-6"
            />
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Analysis Engine
              </CardTitle>
              <CardDescription>Select the models to run concurrently</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="gemini" 
                    checked={models.gemini} 
                    onCheckedChange={(c) => setModels(m => ({ ...m, gemini: !!c }))}
                  />
                  <Label htmlFor="gemini" className="font-medium">Google Gemini Pro Vision</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="openai" 
                    checked={models.openai} 
                    onCheckedChange={(c) => setModels(m => ({ ...m, openai: !!c }))}
                  />
                  <Label htmlFor="openai" className="font-medium">OpenAI GPT-4 Vision</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="deepseek" 
                    checked={models.deepseek} 
                    onCheckedChange={(c) => setModels(m => ({ ...m, deepseek: !!c }))}
                  />
                  <Label htmlFor="deepseek" className="font-medium">DeepSeek Vision</Label>
                </div>
              </div>

              <Button 
                className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all"
                disabled={!file || isAnalyzing}
                onClick={handleAnalyze}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ScanSearch className="w-5 h-5" />
                    Initialize Analysis
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {result && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 pt-8 border-t border-border/50">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-accent" />
              Synthesis
            </h2>
            <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 prose prose-invert max-w-none">
              <p className="text-lg leading-relaxed">{result.combinedSummary}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.tags.map((tag, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1 bg-secondary text-secondary-foreground border-border/50 hover:bg-secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {result.results.map((r, i) => (
              <Card key={i} className="bg-card border-border/50 overflow-hidden flex flex-col">
                <CardHeader className="bg-secondary/30 pb-4 border-b border-border/50">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg capitalize">{r.provider}</CardTitle>
                      <CardDescription>{r.model}</CardDescription>
                    </div>
                    {r.durationMs && (
                      <Badge variant="outline" className="text-xs font-mono flex gap-1 items-center">
                        <Clock className="w-3 h-3" />
                        {r.durationMs}ms
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex-1">
                  {r.error ? (
                    <div className="flex items-start gap-2 text-destructive">
                      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm">{r.error}</p>
                    </div>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                      {r.analysis}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
