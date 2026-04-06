type NoticeCopy = {
  className: string;
  text: string;
};

type AdminNoticeBannerProps = {
  notice: string | undefined;
  notices: Record<string, NoticeCopy>;
};

export function AdminNoticeBanner({
  notice,
  notices,
}: Readonly<AdminNoticeBannerProps>) {
  if (!notice) {
    return null;
  }

  const copy = notices[notice];

  if (!copy) {
    return null;
  }

  return (
    <div className={`rounded-[1.6rem] border px-4 py-3 text-sm font-medium ${copy.className}`}>
      {copy.text}
    </div>
  );
}
