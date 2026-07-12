import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const root = process.cwd();
const actionsSource = readFileSync(
  join(root, "src/app/admin/(protected)/inquiries/[id]/quote/actions.ts"),
  "utf8",
);
const migrationSource = readFileSync(
  join(root, "supabase/migrations/20260712213211_inquiry_quote_builder_schema.sql"),
  "utf8",
);

describe("quote server workflow source contract", () => {
  it("recalculates revisions from the current server pricing profile", () => {
    const revisionAction = actionsSource.slice(
      actionsSource.indexOf("export async function createQuoteRevision"),
      actionsSource.indexOf("export async function savePricingProfile"),
    );

    assert.match(revisionAction, /loadProfile\(supabase\)/);
    assert.match(revisionAction, /buildQuoteSnapshot\(profile,/);
  });

  it("finalizes the reviewed snapshot without silently applying later profile changes", () => {
    const finalizeAction = actionsSource.slice(
      actionsSource.indexOf("export async function finalizeQuoteDraft"),
      actionsSource.indexOf("export async function createQuoteRevision"),
    );

    assert.doesNotMatch(finalizeAction, /loadProfile\(supabase\)/);
    assert.match(finalizeAction, /parseQuoteSnapshot\(current\.calculation_snapshot\)/);
  });

  it("generates customer copy from recalculated values instead of trusting browser message text", () => {
    assert.doesNotMatch(actionsSource, /formData\.get\("customerMessage"\)/);
    assert.doesNotMatch(actionsSource, /formData\.get\("customerScope"\)/);
    assert.match(actionsSource, /buildDefaultCustomerMessage\(/);
  });

  it("switches the current revision atomically in PostgreSQL", () => {
    assert.match(actionsSource, /\.rpc\("create_inquiry_quote_revision"/);
    assert.match(migrationSource, /create or replace function public\.create_inquiry_quote_revision/);
    const revisionAction = actionsSource.slice(
      actionsSource.indexOf("export async function createQuoteRevision"),
      actionsSource.indexOf("export async function savePricingProfile"),
    );
    assert.doesNotMatch(revisionAction, /\.from\("inquiry_quotes"\)\s*\.insert\(/);
  });
});
