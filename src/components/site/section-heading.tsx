import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "default" | "inverse";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "default",
}: SectionHeadingProps) {
  const isInverse = tone === "inverse";

  return (
    <div className={cn("max-w-2xl space-y-5", align === "center" && "mx-auto text-center")}>
      <Badge
        className={
          isInverse
            ? "border-white/14 bg-white/8 text-ivory/78"
            : undefined
        }
      >
        {eyebrow}
      </Badge>
      <div className="space-y-4">
        <h2
          className={cn(
            "text-balance font-serif text-4xl leading-[0.92] tracking-[-0.04em] sm:text-5xl",
            isInverse ? "text-ivory" : "text-charcoal",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className={cn("text-base leading-8", isInverse ? "text-ivory/74" : "text-charcoal/76")}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
