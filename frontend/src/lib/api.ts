import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? "/api";
const STORAGE_KEY = "ai-image-analyzer-history";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ModelResult {
  model: string;
  provider: string;
  analysis?: string;
  error?: string;
  durationMs: number;
}

export interface AnalysisResult {
  id: number;
  imageUrl: string;
  results: ModelResult[];
  combinedSummary: string;
  tags: string[];
  createdAt: string;
}

export interface AnalysisRecord extends AnalysisResult {
  modelsUsed: string;
}

export interface AnalysisStats {
  totalAnalyses: number;
  modelBreakdown: Record<string, number>;
  recentActivity: Array<{ date: string; count: number }>;
}

// ─── LocalStorage Helpers ───────────────────────────────────────────────────

const localStorageHelpers = {
  saveAnalysis: (analysis: AnalysisRecord) => {
    try {
      const history = localStorageHelpers.getHistory();
      history.push(analysis);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn("Failed to save to localStorage:", e);
    }
  },

  getHistory: (): AnalysisRecord[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("Failed to read from localStorage:", e);
      return [];
    }
  },

  clearHistory: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear localStorage:", e);
    }
  },
};

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const getGetAnalysisHistoryQueryKey = (params?: { limit?: number }) =>
  ["analyze", "history", params] as const;

export const getGetAnalysisStatsQueryKey = () =>
  ["analyze", "stats"] as const;

export const getGetAnalysisQueryKey = (id: number) =>
  ["analyze", id] as const;

// ─── Hooks ──────────────────────────────────────────────────────────────────

export function useGetAnalysisHistory(
  params?: { limit?: number },
  options?: { query?: object }
) {
  const queryKey = getGetAnalysisHistoryQueryKey(params);
  const url = `${BASE}/analyze/history${params?.limit ? `?limit=${params.limit}` : ""}`;
  return useQuery<AnalysisRecord[]>({
    queryKey,
    queryFn: async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch history");
        return res.json();
      } catch (error) {
        // Fall back to localStorage
        const history = localStorageHelpers.getHistory();
        return params?.limit ? history.slice(0, params.limit) : history;
      }
    },
    ...(options?.query ?? {}),
  });
}

export function useGetAnalysisStats(options?: { query?: object }) {
  return useQuery<AnalysisStats>({
    queryKey: getGetAnalysisStatsQueryKey(),
    queryFn: async () => {
      try {
        const res = await fetch(`${BASE}/analyze/stats`);
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      } catch (error) {
        // Calculate stats from localStorage
        const history = localStorageHelpers.getHistory();
        const modelBreakdown = { gemini: 0, openai: 0, deepseek: 0 };
        const dateCounts: Record<string, number> = {};

        history.forEach((record) => {
          record.modelsUsed.split(",").forEach((model) => {
            const key = model.trim();
            if (key in modelBreakdown) modelBreakdown[key]++;
          });

          const date = new Date(record.createdAt).toISOString().split("T")[0];
          dateCounts[date] = (dateCounts[date] || 0) + 1;
        });

        const recentActivity = Object.entries(dateCounts)
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 7)
          .map(([date, count]) => ({ date, count }));

        return {
          totalAnalyses: history.length,
          modelBreakdown,
          recentActivity,
        };
      }
    },
    ...(options?.query ?? {}),
  });
}

export function useGetAnalysis(id: number, options?: { query?: object }) {
  return useQuery<AnalysisRecord>({
    queryKey: getGetAnalysisQueryKey(id),
    queryFn: async () => {
      try {
        const res = await fetch(`${BASE}/analyze/${id}`);
        if (!res.ok) throw new Error("Failed to fetch analysis");
        return res.json();
      } catch (error) {
        // Try to find in localStorage
        const history = localStorageHelpers.getHistory();
        const found = history.find((a) => a.id === id);
        if (found) return found;
        throw error;
      }
    },
    enabled: !!id,
    ...(options?.query ?? {}),
  });
}

// ─── Mutations ──────────────────────────────────────────────────────────────

export function usePostAnalyze(options?: { mutation?: object }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { image: File; prompt?: string; models?: string }) => {
      const formData = new FormData();
      formData.append("image", data.image);
      if (data.prompt) formData.append("prompt", data.prompt);
      if (data.models) formData.append("models", data.models);

      const res = await fetch(`${BASE}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(error.message || "Failed to analyze image");
      }

      const result = (await res.json()) as AnalysisResult;
      
      // Save to localStorage for offline access
      localStorageHelpers.saveAnalysis({
        ...result,
        modelsUsed: data.models || "gemini,openai,deepseek",
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getGetAnalysisHistoryQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetAnalysisStatsQueryKey() });
    },
    ...(options?.mutation ?? {}),
  });
}

// Export localStorage helpers for direct access if needed
export { localStorageHelpers };
