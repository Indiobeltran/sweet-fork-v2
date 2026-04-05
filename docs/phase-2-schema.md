# Phase 2 Schema Notes

## What This Phase Covers

This phase establishes the real Supabase/Postgres data model for Sweet Fork v2:

- staff identity and roles
- inquiry intake with multiple items and inspiration assets
- customer, order, payment, and notes workflow
- structured content and settings storage
- pricing foundations for future automation
- centralized media library with reusable assignments
- gallery, calendar, blackout, and notification support tables

## Core Relationship Map

- `profiles` stores the staff profile tied to `auth.users`.
- `user_roles` stores the current role for each staff user. Current roles are `owner` and `manager`.
- `inquiries` stores the event-level inquiry record.
- `inquiry_items` stores one or more requested products under a single inquiry.
- `inquiry_assets` stores inspiration uploads, links, or text references at the inquiry or item level.
- `customers` stores the reusable customer record once a lead is worth tracking beyond a raw inquiry.
- `orders` can originate from a single `inquiry` and belong to one `customer`.
- `order_items` stores the production and pricing snapshot for each ordered product.
- `payments` stores deposit, balance, full-payment, and refund records for an order.
- `media_assets` stores uploaded or external media once, and `media_assignments` lets the same asset appear in multiple places.
- `content_blocks`, `site_settings`, `faq_items`, and `testimonials` support structured editing instead of an unbounded CMS.
- `products`, `product_prices`, and `pricing_rules` separate the catalog from pricing logic so pricing can move from manual ranges to rules over time.

## Production-Ready Foundations

- The table layout, foreign keys, enum constraints, and indexes are ready for app wiring.
- Inquiry-to-order lineage is explicit through `orders.inquiry_id`.
- Multi-product inquiry intake is supported through `inquiry_items`.
- Media reuse is supported through the central `media_assets` and `media_assignments` model.
- Pricing data can start simple with seeded `product_prices` and grow into rule-driven automation with `pricing_rules`.
- Structured content editing can start with `content_blocks` and `site_settings` without introducing a full CMS.

## Placeholder or Future-Facing Areas

- `pricing_rules` is ready for future automation, but no calculation engine is implemented yet.
- `notification_events` and `notification_logs` define the event/log model, but no delivery integration is wired yet.
- `calendar_entries` and `blackout_dates` support scheduling rules, but no scheduling UX or conflict logic exists yet.
- `media_assignments` uses a practical polymorphic pattern (`assignment_type` + `target_id` or page/section keys). This is flexible and production-usable, but target-specific validation belongs in the app layer.
- Fine-grained RLS policy design and admin provisioning flow still need to be layered on top of this schema before a full production rollout.

## Seed Data Included

- `products`
- `product_prices`
- `gallery_categories`
- `site_settings`
- starter `faq_items`

The seed data is intentionally reference-oriented. It gives the next phase a realistic baseline without pretending that all business content is finalized.
