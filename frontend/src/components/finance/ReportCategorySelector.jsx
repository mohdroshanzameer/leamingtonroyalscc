import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, TrendingDown, Users, Receipt, ChevronRight 
} from 'lucide-react';
import { getFinanceTheme } from '../ClubConfig';

const colors = getFinanceTheme();

const categories = [
  { 
    id: 'income', 
    label: 'Income', 
    description: 'All club income & sponsorships',
    icon: TrendingUp, 
    color: '#10b981',
    bgColor: '#10b98120'
  },
  { 
    id: 'expense', 
    label: 'Expenses', 
    description: 'Club payments & running costs',
    icon: TrendingDown, 
    color: '#ef4444',
    bgColor: '#ef444420'
  },
  { 
    id: 'matchFee', 
    label: 'Match Fees', 
    description: 'Player match fee payments',
    icon: Receipt, 
    color: '#3b82f6',
    bgColor: '#3b82f620'
  },
  { 
    id: 'registrationFee', 
    label: 'Registration Fees', 
    description: 'Membership & registration payments',
    icon: Users, 
    color: '#8b5cf6',
    bgColor: '#8b5cf620'
  },
];

export default function ReportCategorySelector({ onSelectCategory }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {categories.map((cat) => {
        const Icon = cat.icon;
        return (
          <Card 
            key={cat.id}
            className="cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ 
              backgroundColor: colors.surface, 
              border: `1px solid ${colors.border}`,
            }}
            onClick={() => onSelectCategory(cat.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: cat.bgColor }}
                >
                  <Icon className="w-6 h-6" style={{ color: cat.color }} />
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: colors.textMuted }} />
              </div>
              <h3 className="font-semibold text-base mb-1" style={{ color: colors.textPrimary }}>
                {cat.label}
              </h3>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                {cat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}