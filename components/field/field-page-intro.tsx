interface FieldPageIntroProps {
  title: string;
  description?: string;
}

export function FieldPageIntro({ title, description }: FieldPageIntroProps) {
  return (
    <div className="space-y-1 pt-3 sm:pt-4">
      <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">{title}</h2>
      {description && (
        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">{description}</p>
      )}
    </div>
  );
}
