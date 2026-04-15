import { useGetAnalysisStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, BarChart, Database, Cpu } from "lucide-react";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function Stats() {
  const { data: stats, isLoading } = useGetAnalysisStats();

  const activityData = stats?.recentActivity.map(item => ({
    name: new Date(item.date).toLocaleDateString(undefined, { weekday: 'short' }),
    count: item.count
  })) || [];

  const modelData = stats?.modelBreakdown 
    ? Object.entries(stats.modelBreakdown).map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        usage: value
      }))
    : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Telemetry</h1>
        <p className="text-muted-foreground text-lg">
          System usage metrics and model utilization statistics.
        </p>
      </header>

      {isLoading ? (
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      ) : stats ? (
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Analyses</CardTitle>
                <Database className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">{stats.totalAnalyses}</div>
                <p className="text-xs text-muted-foreground mt-1">Processed image records</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Top Model</CardTitle>
                <Cpu className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">
                  {modelData.length > 0 ? [...modelData].sort((a,b) => b.usage - a.usage)[0].name : '-'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Most frequently utilized</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
                <Activity className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-foreground">
                  {stats.recentActivity.reduce((acc, curr) => acc + curr.count, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Analyses in last 7 days</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-primary" />
                  Weekly Volume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {activityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">No recent activity</div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-accent" />
                  Model Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  {modelData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={modelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                        <XAxis type="number" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Bar dataKey="usage" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} barSize={32} />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">No model data</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
