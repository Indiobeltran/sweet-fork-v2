import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const sql = readFileSync(join(process.cwd(), "supabase/migrations/20260718174432_admin_integrations_foundation.sql"), "utf8");

describe("admin integration schema contract", () => {
  it("keeps providers disabled and stores no credential columns", () => {
    assert.match(sql, /enabled boolean not null default false/i);
    assert.match(sql, /\('square', false[\s\S]*\('google-calendar', false[\s\S]*\('resend', false[\s\S]*\('google-maps', false/i);
    assert.doesNotMatch(sql, /access_token|refresh_token|private_key|api_key/i);
  });

  it("protects integration state with RLS and service-only mutation", () => {
    for (const table of ["integration_connections", "integration_links", "integration_webhook_events", "integration_sync_conflicts", "delivery_route_snapshots"]) {
      assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
      assert.match(sql, new RegExp(`revoke all on public\\.${table} from anon, authenticated`, "i"));
    }
    assert.match(sql, /integration_connections_owner_update[\s\S]*public\.is_owner\(\)/i);
    assert.doesNotMatch(sql, /grant[^;]*insert[^;]*on public\.integration_webhook_events to authenticated/i);
  });

  it("enforces webhook idempotency and private route snapshots", () => {
    assert.match(sql, /unique \(provider, external_event_id\)/i);
    assert.match(sql, /payments_provider_intent_unique_idx/i);
    assert.match(sql, /provider_response_hash text not null/i);
    assert.doesNotMatch(sql, /origin_address/i);
  });
});
