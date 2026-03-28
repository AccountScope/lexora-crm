'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface CaseInsightsProps {
  caseId: string;
}

export function CaseInsights({ caseId }: CaseInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });

      const data = await res.json();
      setInsights(data);
    } catch (error) {
      console.error('Insights generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'default';
      default: return 'secondary';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Case Insights</h2>
        <Button onClick={generateInsights} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {insights ? 'Refresh Insights' : 'Generate Insights'}
        </Button>
      </div>

      {insights && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Case Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{insights.summary}</p>
            </CardContent>
          </Card>

          {/* Risk Assessment */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Risk Assessment</CardTitle>
                <Badge variant={getRiskColor(insights.riskLevel)}>
                  {getRiskIcon(insights.riskLevel)}
                  <span className="ml-1">{insights.riskLevel?.toUpperCase()}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {insights.riskFactors && Array.isArray(insights.riskFactors) && (
                <ul className="space-y-2">
                  {insights.riskFactors.map((risk: any, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500 mt-1" />
                      <div>
                        <p className="font-medium">{risk.factor}</p>
                        <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          {insights.recommendations && insights.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-1">
                  {insights.recommendations.map((rec: string, i: number) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Similar Cases */}
          {insights.similarCases && insights.similarCases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Similar Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.similarCases.map((similar: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{similar.title}</p>
                        <p className="text-sm text-muted-foreground">{similar.matterNumber}</p>
                      </div>
                      <Badge variant="outline">{Math.round(similar.similarity * 100)}% match</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
