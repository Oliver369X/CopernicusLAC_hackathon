import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { priorityLabelEs } from '@/lib/design/tokens';
import { cn } from '@/lib/utils';

interface RecommendationCardProps {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  icon: LucideIcon;
}

export function RecommendationCard({
  title,
  description,
  priority,
  icon: Icon,
}: RecommendationCardProps) {
  const isHigh = priority === 'high';

  return (
    <Card
      className={cn(
        'border-l-4 glass-card',
        isHigh
          ? 'border-l-health-critical bg-health-critical/5'
          : 'border-l-health-warning bg-health-warning/5'
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex gap-3 sm:gap-4">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1',
              isHigh
                ? 'bg-health-critical/15 text-health-critical ring-health-critical/25'
                : 'bg-health-warning/15 text-health-warning ring-health-warning/25'
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
              <h3 className="font-semibold leading-snug text-foreground">{title}</h3>
              <Badge
                variant={isHigh ? 'destructive' : 'warning'}
                className="w-fit shrink-0"
              >
                {priorityLabelEs[priority]}
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
