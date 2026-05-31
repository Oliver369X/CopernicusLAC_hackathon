interface FieldPageIntroProps {
  title: string;
  description?: string;
}

export function FieldPageIntro({ title, description }: FieldPageIntroProps) {
  return (
    <div className="space-y-1 px-4 pt-4">
      <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h2>
      {description && (
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
