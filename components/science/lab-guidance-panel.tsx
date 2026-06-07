'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getLabGoals,
  SCIENCE_LAB_GOAL_STORAGE_KEY,
  type LabGoalId,
  type LabGoalOption,
} from '@/lib/onboarding/science-lab-copy';
import { ChevronRight, Sparkles } from 'lucide-react';

interface LabGuidancePanelProps {
  simpleMode: boolean;
  onChooseGoal: (goal: LabGoalOption) => void;
  selectedGoalId?: LabGoalId | null;
}

export function LabGuidancePanel({
  simpleMode,
  onChooseGoal,
  selectedGoalId,
}: LabGuidancePanelProps) {
  const goals = getLabGoals(simpleMode);
  const [picked, setPicked] = useState<LabGoalId | null>(selectedGoalId ?? null);

  useEffect(() => {
    if (selectedGoalId) setPicked(selectedGoalId);
  }, [selectedGoalId]);

  function select(goal: LabGoalOption) {
    setPicked(goal.id);
    localStorage.setItem(SCIENCE_LAB_GOAL_STORAGE_KEY, goal.id);
    onChooseGoal(goal);
  }

  return (
    <Card className="glass-card border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {simpleMode ? '¿Qué querés revisar hoy?' : '¿Por dónde empezamos?'}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {simpleMode
            ? 'Elegí una opción. No hace falta saber de satélites — te llevamos al gráfico correcto.'
            : 'Respondé en una frase; armamos la hipótesis y el siguiente paso por vos.'}
        </p>
      </CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {goals.map((goal) => {
          const active = picked === goal.id;
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => select(goal)}
              className={`text-left rounded-xl border p-3 transition-colors hover:bg-muted/50 ${
                active ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg" aria-hidden>
                  {goal.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm leading-snug">{goal.question}</p>
                  <p className="text-xs text-muted-foreground mt-1">{goal.hint}</p>
                </div>
                <ChevronRight
                  className={`h-4 w-4 shrink-0 mt-0.5 ${active ? 'text-primary' : 'text-muted-foreground'}`}
                />
              </div>
            </button>
          );
        })}
      </CardContent>
      {picked && (
        <CardContent className="pt-0">
          <Badge variant="secondary" className="text-xs font-normal">
            Listo — seguí abajo con el historial y tu nota de seguimiento
          </Badge>
        </CardContent>
      )}
    </Card>
  );
}
