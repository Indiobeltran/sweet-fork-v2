import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

// @ts-expect-error Node's strip-types test runner needs the .ts extension.
import { defaultPricingProfile } from "./default-profile.ts";

const root = process.cwd();
const migrationsDirectory = join(root, "supabase", "migrations");

function readQuoteMigration() {
  const migrationFile = readdirSync(migrationsDirectory)
    .sort()
    .find((file) => {
      const sql = readFileSync(join(migrationsDirectory, file), "utf8");
      return /create table public\.inquiry_quotes\s*\(/i.test(sql);
    });

  assert.ok(migrationFile, "Expected a migration that creates public.inquiry_quotes.");
  return {
    file: migrationFile,
    sql: readFileSync(join(migrationsDirectory, migrationFile), "utf8"),
  };
}

function assertSql(sql: string, pattern: RegExp, message: string) {
  assert.match(sql, pattern, message);
}

describe("inquiry quote schema contract", () => {
  it("creates the constrained revision table and supporting indexes", () => {
    const { file, sql } = readQuoteMigration();

    assert.ok(
      file > "20260711172939_copy_1_public_copy_phase_b.sql",
      "The quote migration must be timestamped after the latest existing migration.",
    );
    assertSql(sql, /id uuid primary key default gen_random_uuid\(\)/i, "Quote IDs must be UUID primary keys.");
    assertSql(sql, /inquiry_id uuid not null references public\.inquiries \(id\) on delete cascade/i, "Quotes must cascade with their inquiry.");
    assertSql(sql, /created_by uuid references public\.profiles \(id\) on delete set null/i, "Creator deletion must preserve quote history.");
    assertSql(sql, /version integer not null[\s\S]*check \(version > 0\)/i, "Quote versions must be positive integers.");
    assertSql(sql, /status text not null default 'draft'[\s\S]*check \(status in \('draft', 'finalized'\)\)/i, "Quote status must be draft or finalized.");
    assertSql(
      sql,
      /check\s*\(\s*\(status = 'finalized'\) = \(finalized_at is not null\)\s*\)/i,
      "Finalized status and timestamp must stay consistent.",
    );
    assertSql(sql, /final_price numeric\(12,2\) not null[\s\S]*check \(final_price >= 0\)/i, "Final price must be nonnegative.");
    assertSql(sql, /deposit_amount numeric\(12,2\) not null[\s\S]*check \(deposit_amount >= 0\)/i, "Deposit must be nonnegative.");
    assertSql(sql, /check \(deposit_amount <= final_price\)/i, "Deposit must not exceed the customer total.");
    assertSql(sql, /calculation_snapshot jsonb not null[\s\S]*jsonb_typeof\(calculation_snapshot\) = 'object'/i, "Calculation snapshots must be JSON objects.");
    assertSql(sql, /unique \(inquiry_id, version\)/i, "Inquiry quote versions must be unique.");
    assertSql(sql, /create unique index[\s\S]*on public\.inquiry_quotes \(inquiry_id\)[\s\S]*where is_current/i, "Only one quote may be current per inquiry.");
    assertSql(sql, /create index[\s\S]*on public\.inquiry_quotes \(inquiry_id, status/i, "Inquiry/status lookups need an index.");
  });

  it("enables admin-only RLS access with explicit Data API grants", () => {
    const { sql } = readQuoteMigration();

    assertSql(sql, /alter table public\.inquiry_quotes enable row level security/i, "RLS must be enabled.");
    assertSql(sql, /grant select, insert, update on public\.inquiry_quotes to authenticated/i, "Authenticated admins need explicit read/write grants without delete.");
    assertSql(sql, /grant select, insert, update, delete on public\.inquiry_quotes to service_role/i, "Service actions need explicit cleanup access.");
    assert.doesNotMatch(sql, /grant[^;]*delete[^;]*on public\.inquiry_quotes to authenticated/i, "Authenticated callers must not delete quote history.");
    assert.doesNotMatch(sql, /grant[\s\S]*on public\.inquiry_quotes to anon/i, "Anonymous callers must not receive a grant.");

    for (const operation of ["select", "insert", "update"] as const) {
      assertSql(
        sql,
        new RegExp(`create policy ["']?inquiry_quotes_admin_${operation}["']?[\\s\\S]*for ${operation}[\\s\\S]*to authenticated[\\s\\S]*public\\.is_admin\\(\\)`, "i"),
        `Missing admin ${operation} policy.`,
      );
    }

    assertSql(sql, /for update[\s\S]*using \(\(select public\.is_admin\(\)\)\)[\s\S]*with check \(\(select public\.is_admin\(\)\)\)/i, "Admin updates need USING and WITH CHECK guards.");
    assert.doesNotMatch(sql, /create policy inquiry_quotes_admin_delete/i, "Authenticated admins must not receive a delete policy.");
  });

  it("keeps finalized content immutable while allowing current-revision switches", () => {
    const { sql } = readQuoteMigration();

    assertSql(sql, /old\.status = 'finalized'/i, "The guard must apply to finalized quotes.");
    assertSql(sql, /to_jsonb\(new\) - array\['is_current', 'updated_at'\]/i, "Only current state and update time may change after finalization.");
    assertSql(sql, /raise exception 'Finalized quote content cannot be changed\.'/i, "Blocked finalized edits need an explicit database error.");
    assertSql(sql, /create trigger protect_inquiry_quotes_finalized_content[\s\S]*before update on public\.inquiry_quotes[\s\S]*execute function public\.protect_inquiry_quotes_finalized_content\(\)/i, "The finalized-content trigger must be installed.");
    assertSql(sql, /create trigger set_inquiry_quotes_updated_at[\s\S]*execute function public\.set_updated_at\(\)/i, "The shared updated_at trigger must be reused.");
  });

  it("requires quote-backed orders to reference the current finalized version at insert time", () => {
    const { sql } = readQuoteMigration();

    assertSql(sql, /new\.metadata ->> 'inquiryQuoteId'/i, "The order guard must read the server-authored quote reference.");
    assertSql(sql, /inquiry_id = new\.inquiry_id[\s\S]*status = 'finalized'[\s\S]*is_current = true/i, "The referenced quote must be current, finalized, and belong to the order inquiry.");
    assertSql(sql, /create trigger validate_order_quote_reference[\s\S]*before insert on public\.orders/i, "Quote freshness must be checked atomically with the order insert.");
  });

  it("seeds the private editable pricing profile exactly", () => {
    const { sql } = readQuoteMigration();
    const seed = sql.match(/\$pricing_profile\$([\s\S]*?)\$pricing_profile\$::jsonb/i);

    assert.ok(seed, "Expected a dollar-quoted pricing-profile JSON seed.");
    assert.deepEqual(JSON.parse(seed[1]), defaultPricingProfile);
    assertSql(sql, /'quote\.pricing-profile'[\s\S]*'quote'[\s\S]*false/i, "The profile must be private and categorized as quote.");
  });

  it("commits the generated TypeScript surface for inquiry_quotes", () => {
    const generated = readFileSync(join(root, "src", "types", "supabase.generated.ts"), "utf8");

    assertSql(generated, /inquiry_quotes: \{[\s\S]*Row: \{[\s\S]*calculation_snapshot: Json[\s\S]*Insert: \{[\s\S]*Update: \{[\s\S]*Relationships: \[/i, "Generated types must include the quote table surface.");
    assertSql(generated, /foreignKeyName: "inquiry_quotes_inquiry_id_fkey"[\s\S]*referencedRelation: "inquiries"/i, "Generated types must include the inquiry relationship.");
    assertSql(generated, /foreignKeyName: "inquiry_quotes_created_by_fkey"[\s\S]*referencedRelation: "profiles"/i, "Generated types must include the creator relationship.");
  });
});
