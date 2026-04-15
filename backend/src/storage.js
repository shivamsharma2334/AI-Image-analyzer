// In-memory storage for analyses
let analyses = [];
let nextId = 1;

export const storage = {
  // Add a new analysis
  create: (data) => {
    const id = nextId++;
    const record = {
      id,
      imageUrl: data.imageUrl,
      imageDataBase64: data.imageDataBase64,
      imageMimeType: data.imageMimeType,
      results: data.results,
      combinedSummary: data.combinedSummary,
      tags: data.tags,
      modelsUsed: data.modelsUsed,
      createdAt: new Date().toISOString(),
    };
    analyses.push(record);
    return record;
  },

  // Get all analyses (sorted by date, with limit)
  getAll: (limit = 50) => {
    return analyses
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  },

  // Get a single analysis by ID
  getById: (id) => {
    return analyses.find((a) => a.id === id);
  },

  // Get stats
  getStats: () => {
    const total = analyses.length;
    const modelBreakdown = { gemini: 0, openai: 0, deepseek: 0 };
    const dateCounts = {};

    analyses.forEach((record) => {
      // Count models
      record.modelsUsed.split(",").forEach((model) => {
        const key = model.trim();
        if (key in modelBreakdown) modelBreakdown[key]++;
      });

      // Count by date
      const date = new Date(record.createdAt).toISOString().split("T")[0];
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    // Get last 7 days of activity
    const recentActivity = Object.entries(dateCounts)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 7)
      .map(([date, count]) => ({ date, count }));

    return {
      totalAnalyses: total,
      modelBreakdown,
      recentActivity,
    };
  },
};
