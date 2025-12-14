import React, { useState } from 'react';
import { api } from '@/components/api/apiClient';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, Lightbulb } from 'lucide-react';
import { CLUB_CONFIG, getFinanceTheme } from '@/components/ClubConfig';

const colors = getFinanceTheme();

export default function AIPricingSuggestions({ memberships = [] }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);

    const currentPricing = CLUB_CONFIG.membershipFees;
    const membershipStats = {};
    memberships.forEach(m => {
      membershipStats[m.membership_type] = (membershipStats[m.membership_type] || 0) + 1;
    });

    const revenueData = memberships
      .filter(m => m.payment_status === 'Paid')
      .reduce((sum, m) => sum + (m.fee_amount || 0), 0);

    const prompt = `As a sports club financial advisor, analyze and suggest optimal membership pricing for ${CLUB_CONFIG.name} cricket club.

Current pricing:
${JSON.stringify(currentPricing, null, 2)}

Current membership distribution:
${JSON.stringify(membershipStats, null, 2)}

Total revenue collected: £${revenueData}
Total members: ${memberships.length}

Consider:
1. Market rates for amateur cricket clubs in the UK
2. Value proposition for each tier
3. Family-friendly pricing
4. Retention vs acquisition balance
5. Inflation and operating costs

Provide suggested prices with reasoning for each tier, potential revenue impact, and recommended promotional strategies.`;

    const result = await api.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tier: { type: "string" },
                current_price: { type: "number" },
                suggested_price: { type: "number" },
                change_percent: { type: "number" },
                reasoning: { type: "string" }
              }
            }
          },
          overall_analysis: { type: "string" },
          revenue_impact: { type: "string" },
          promotional_ideas: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    setSuggestions(result);
    setIsAnalyzing(false);
  };

  return (
    <Card className="border-0 overflow-hidden mt-6" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.chart3} 0%, ${colors.info} 100%)` }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: colors.textPrimary }}>AI Pricing Insights</h3>
            <p className="text-xs" style={{ color: colors.textMuted }}>Get AI-powered pricing recommendations</p>
          </div>
        </div>
        {!suggestions && (
          <Button 
            onClick={handleAnalyze} 
            disabled={isAnalyzing}
            size="sm"
            style={{ background: `linear-gradient(135deg, ${colors.chart3} 0%, ${colors.info} 100%)` }}
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Analyze
          </Button>
        )}
      </div>

      <CardContent className="p-6">
        {!suggestions && !isAnalyzing && (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Click "Analyze" to get AI-powered suggestions for optimal membership pricing based on your club's data.
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" style={{ color: colors.chart3 }} />
            <p className="text-sm" style={{ color: colors.textSecondary }}>Analyzing your club data...</p>
          </div>
        )}

        {suggestions && (
          <div className="space-y-6">
            {/* Overall Analysis */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: `${colors.chart3}10`, border: `1px solid ${colors.chart3}30` }}>
              <p className="text-sm" style={{ color: colors.textSecondary }}>{suggestions.overall_analysis}</p>
            </div>

            {/* Pricing Recommendations */}
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                <TrendingUp className="w-4 h-4" style={{ color: colors.accent }} /> Pricing Recommendations
              </h4>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {suggestions.suggestions?.map((s, idx) => (
                  <div key={idx} className="p-4 rounded-xl" style={{ backgroundColor: colors.surfaceHover, border: `1px solid ${colors.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm" style={{ color: colors.textPrimary }}>{s.tier}</span>
                      <Badge style={{ 
                        backgroundColor: s.change_percent >= 0 ? colors.profitLight : colors.lossLight,
                        color: s.change_percent >= 0 ? colors.profit : colors.loss
                      }}>
                        {s.change_percent >= 0 ? '+' : ''}{s.change_percent}%
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="line-through text-sm" style={{ color: colors.textMuted }}>£{s.current_price}</span>
                      <span className="text-lg font-bold" style={{ color: colors.textProfit }}>£{s.suggested_price}</span>
                    </div>
                    <p className="text-xs" style={{ color: colors.textMuted }}>{s.reasoning}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Impact */}
            <div className="p-4 rounded-xl" style={{ backgroundColor: colors.infoLight, border: `1px solid ${colors.info}30` }}>
              <h4 className="text-sm font-semibold mb-1" style={{ color: colors.info }}>Revenue Impact</h4>
              <p className="text-sm" style={{ color: colors.textSecondary }}>{suggestions.revenue_impact}</p>
            </div>

            {/* Promotional Ideas */}
            {suggestions.promotional_ideas?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: colors.textPrimary }}>
                  <Lightbulb className="w-4 h-4" style={{ color: colors.pending }} /> Promotional Ideas
                </h4>
                <ul className="space-y-2">
                  {suggestions.promotional_ideas.map((idea, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: colors.textSecondary }}>
                      <span style={{ color: colors.pending }}>•</span>
                      {idea}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={() => setSuggestions(null)} 
              className="w-full"
              style={{ borderColor: colors.border, color: colors.textSecondary }}
            >
              Run New Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}