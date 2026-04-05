import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const checks = [
  {
    table: "products",
    select: "slug, name",
  },
  {
    table: "gallery_categories",
    select: "slug, name",
  },
  {
    table: "site_settings",
    select: "setting_key, category_key",
  },
  {
    table: "faq_items",
    select: "category_key, question",
  },
];

for (const check of checks) {
  const { data, error, count } = await supabase
    .from(check.table)
    .select(check.select, { count: "exact" })
    .limit(2);

  if (error) {
    console.error(`Verification failed for ${check.table}: ${error.message}`);
    process.exit(1);
  }

  console.log(`${check.table}: count=${count ?? 0}`);
  console.log(JSON.stringify(data ?? [], null, 2));
}
