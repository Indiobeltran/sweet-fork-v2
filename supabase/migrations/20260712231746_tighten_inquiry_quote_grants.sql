-- Hosted projects may apply broad default table privileges before migration
-- grants run. Reset authenticated explicitly, then restore only the access the
-- admin quote workflow requires. RLS remains the row-level authorization layer.
revoke all privileges on table public.inquiry_quotes from authenticated;
grant select, insert, update on table public.inquiry_quotes to authenticated;

revoke all privileges on table public.inquiry_quotes from anon;
