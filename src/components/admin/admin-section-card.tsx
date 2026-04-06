type AdminSectionCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function AdminSectionCard({
  title,
  description,
  children,
}: Readonly<AdminSectionCardProps>) {
  return (
    <section className="rounded-[2rem] border border-charcoal/10 bg-white/88 p-5 shadow-soft sm:p-6">
      <div className="space-y-2">
        <h2 className="font-serif text-3xl tracking-[-0.04em] text-charcoal">{title}</h2>
        {description ? (
          <p className="max-w-3xl text-sm leading-7 text-charcoal/64">{description}</p>
        ) : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
