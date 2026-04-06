import type { PublicBookingNotice } from "@/lib/site/marketing";

type PublicBookingNoticeProps = {
  notice: PublicBookingNotice;
};

function getToneClasses(tone: PublicBookingNotice["tone"]) {
  switch (tone) {
    case "closed":
      return "border-rose/24 bg-rose/10 text-charcoal";
    case "limited":
      return "border-gold/24 bg-gold/12 text-charcoal";
    default:
      return "border-charcoal/10 bg-white text-charcoal/78";
  }
}

export function PublicBookingNoticeBanner({
  notice,
}: Readonly<PublicBookingNoticeProps>) {
  return (
    <section
      aria-label="Booking notice"
      className="border-b border-charcoal/8 bg-white/85 backdrop-blur"
    >
      <div className="section-shell py-4">
        <div className={`rounded-[1.6rem] border px-5 py-4 shadow-soft ${getToneClasses(notice.tone)}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em]">
            Booking update
          </p>
          <h2 className="mt-2 font-serif text-2xl tracking-[-0.03em] text-balance">
            {notice.title}
          </h2>
          <p className="mt-2 max-w-4xl text-sm leading-7">{notice.message}</p>
        </div>
      </div>
    </section>
  );
}
