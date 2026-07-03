ALTER TABLE products
ADD COLUMN IF NOT EXISTS prep_days integer not null default 0,
ADD COLUMN IF NOT EXISTS min_lead_time_days integer not null default 3;
