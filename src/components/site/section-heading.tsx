import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl space-y-5", align === "center" && "mx-auto text-center")}>
      <Badge>{eyebrow}</Badge>
      <div className="space-y-4">
        <h2 className="text-balance font-serif text-4xl leading-[0.92] tracking-[-0.04em] text-charcoal sm:text-5xl">
          {title}
        </h2>
        {description ? <p className="text-base leading-8 text-charcoal/76">{description}</p> : null}
      </div>
    </div>
  );
}
