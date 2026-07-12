create table public.inquiry_quotes (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  version integer not null,
  status text not null default 'draft',
  is_current boolean not null default false,
  final_price numeric(12,2) not null default 0,
  deposit_amount numeric(12,2) not null default 0,
  valid_through date,
  customer_scope text,
  customer_message text,
  calculation_snapshot jsonb not null default '{}'::jsonb,
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inquiry_quotes_version_positive check (version > 0),
  constraint inquiry_quotes_status_valid check (status in ('draft', 'finalized')),
  constraint inquiry_quotes_finalized_state_consistent check (
    (status = 'finalized') = (finalized_at is not null)
  ),
  constraint inquiry_quotes_final_price_nonnegative check (final_price >= 0),
  constraint inquiry_quotes_deposit_amount_nonnegative check (deposit_amount >= 0),
  constraint inquiry_quotes_deposit_within_total check (deposit_amount <= final_price),
  constraint inquiry_quotes_calculation_snapshot_object check (
    jsonb_typeof(calculation_snapshot) = 'object'
  ),
  constraint inquiry_quotes_inquiry_version_unique unique (inquiry_id, version)
);

create unique index inquiry_quotes_one_current_per_inquiry_idx
  on public.inquiry_quotes (inquiry_id)
  where is_current;

create index inquiry_quotes_inquiry_status_idx
  on public.inquiry_quotes (inquiry_id, status, created_at desc);

create index inquiry_quotes_created_by_idx
  on public.inquiry_quotes (created_by);

create or replace function public.protect_inquiry_quotes_finalized_content()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'finalized'
    and (
      to_jsonb(new) - array['is_current', 'updated_at']::text[]
      is distinct from
      to_jsonb(old) - array['is_current', 'updated_at']::text[]
    )
  then
    raise exception 'Finalized quote content cannot be changed.'
      using errcode = '55000';
  end if;

  return new;
end;
$$;

revoke execute on function public.protect_inquiry_quotes_finalized_content() from public, anon, authenticated;

create trigger protect_inquiry_quotes_finalized_content
  before update on public.inquiry_quotes
  for each row
  execute function public.protect_inquiry_quotes_finalized_content();

create trigger set_inquiry_quotes_updated_at
  before update on public.inquiry_quotes
  for each row
  execute function public.set_updated_at();

alter table public.inquiry_quotes enable row level security;

revoke all on public.inquiry_quotes from anon;
grant select, insert, update on public.inquiry_quotes to authenticated;
grant select, insert, update, delete on public.inquiry_quotes to service_role;

create policy inquiry_quotes_admin_select
  on public.inquiry_quotes
  for select
  to authenticated
  using ((select public.is_admin()));

create policy inquiry_quotes_admin_insert
  on public.inquiry_quotes
  for insert
  to authenticated
  with check ((select public.is_admin()));

create policy inquiry_quotes_admin_update
  on public.inquiry_quotes
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create or replace function public.create_inquiry_quote_revision(
  p_inquiry_id uuid,
  p_current_quote_id uuid,
  p_created_by uuid,
  p_version integer,
  p_final_price numeric,
  p_deposit_amount numeric,
  p_valid_through date,
  p_customer_scope text,
  p_customer_message text,
  p_calculation_snapshot jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  affected_rows integer;
  revision_id uuid;
begin
  update public.inquiry_quotes
  set is_current = false
  where id = p_current_quote_id
    and inquiry_id = p_inquiry_id
    and status = 'finalized'
    and is_current = true;

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'The current finalized quote could not be switched.'
      using errcode = 'P0001';
  end if;

  insert into public.inquiry_quotes (
    inquiry_id,
    created_by,
    version,
    status,
    is_current,
    final_price,
    deposit_amount,
    valid_through,
    customer_scope,
    customer_message,
    calculation_snapshot
  )
  values (
    p_inquiry_id,
    p_created_by,
    p_version,
    'draft',
    true,
    p_final_price,
    p_deposit_amount,
    p_valid_through,
    p_customer_scope,
    p_customer_message,
    p_calculation_snapshot
  )
  returning id into revision_id;

  return revision_id;
end;
$$;

revoke all on function public.create_inquiry_quote_revision(
  uuid, uuid, uuid, integer, numeric, numeric, date, text, text, jsonb
)
  from public, anon;
grant execute on function public.create_inquiry_quote_revision(
  uuid, uuid, uuid, integer, numeric, numeric, date, text, text, jsonb
)
  to authenticated, service_role;

create or replace function public.validate_order_quote_reference()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  quote_id_text text;
  quote_version_text text;
  quote_id uuid;
  quote_version integer;
begin
  quote_id_text := new.metadata ->> 'inquiryQuoteId';
  if quote_id_text is null then
    return new;
  end if;

  quote_version_text := new.metadata ->> 'inquiryQuoteVersion';
  if new.inquiry_id is null or quote_version_text is null then
    raise exception 'Quote-backed orders require an inquiry and quote version.'
      using errcode = '23514';
  end if;

  begin
    quote_id := quote_id_text::uuid;
    quote_version := quote_version_text::integer;
  exception when invalid_text_representation then
    raise exception 'Quote-backed order metadata is invalid.'
      using errcode = '23514';
  end;

  if not exists (
    select 1
    from public.inquiry_quotes
    where id = quote_id
      and inquiry_id = new.inquiry_id
      and version = quote_version
      and status = 'finalized'
      and is_current = true
  ) then
    raise exception 'Quote-backed orders require the current finalized quote.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke execute on function public.validate_order_quote_reference() from public, anon, authenticated;

create trigger validate_order_quote_reference
  before insert on public.orders
  for each row
  execute function public.validate_order_quote_reference();

insert into public.site_settings (
  setting_key,
  category_key,
  label,
  description,
  value_json,
  is_public
)
values (
  'quote.pricing-profile',
  'quote',
  'Quote pricing profile',
  'Editable labor, cost, margin, delivery, and product assumptions used by the inquiry quote builder.',
  $pricing_profile$
  {
    "currency": "USD",
    "defaultDepositRate": 0.5,
    "defaultQuoteValidityDays": 14,
    "defaultTaxRate": 0,
    "delivery": {
      "mileageRate": 0.725,
      "minimumCharge": 15
    },
    "fixedOverheadPerOrder": 15,
    "minimumMargin": 0.15,
    "ownerHourlyRate": 35,
    "productPresets": {
      "custom-cake": {
        "complexities": {
          "simple": {
            "materialAllowance": 25,
            "packagingAllowance": 8,
            "stageHours": {
              "baking": 1.5,
              "decorating": 1.5,
              "deliverySetup": 0,
              "packagingCleanup": 0.75,
              "planning": 0.5,
              "shoppingPrep": 0.75
            }
          },
          "standard": {
            "materialAllowance": 40,
            "packagingAllowance": 10,
            "stageHours": {
              "baking": 2,
              "decorating": 3,
              "deliverySetup": 0,
              "packagingCleanup": 1,
              "planning": 0.75,
              "shoppingPrep": 1
            }
          },
          "intricate": {
            "materialAllowance": 75,
            "packagingAllowance": 15,
            "stageHours": {
              "baking": 3,
              "decorating": 6,
              "deliverySetup": 0,
              "packagingCleanup": 1.5,
              "planning": 1.5,
              "shoppingPrep": 1.5
            }
          }
        },
        "label": "Custom cake",
        "publicStartingPrice": 80
      },
      "wedding-cake": {
        "complexities": {
          "simple": {
            "materialAllowance": 100,
            "packagingAllowance": 25,
            "stageHours": {
              "baking": 4,
              "decorating": 6,
              "deliverySetup": 0,
              "packagingCleanup": 2,
              "planning": 2,
              "shoppingPrep": 2
            }
          },
          "standard": {
            "materialAllowance": 175,
            "packagingAllowance": 40,
            "stageHours": {
              "baking": 6,
              "decorating": 10,
              "deliverySetup": 0,
              "packagingCleanup": 3,
              "planning": 3,
              "shoppingPrep": 3
            }
          },
          "intricate": {
            "materialAllowance": 300,
            "packagingAllowance": 60,
            "stageHours": {
              "baking": 8,
              "decorating": 18,
              "deliverySetup": 0,
              "packagingCleanup": 4,
              "planning": 4,
              "shoppingPrep": 4
            }
          }
        },
        "label": "Wedding cake",
        "publicStartingPrice": 300
      },
      "cupcakes": {
        "complexities": {
          "simple": {
            "materialAllowance": 12,
            "packagingAllowance": 4,
            "stageHours": {
              "baking": 1,
              "decorating": 0.75,
              "deliverySetup": 0,
              "packagingCleanup": 0.5,
              "planning": 0.25,
              "shoppingPrep": 0.5
            }
          },
          "standard": {
            "materialAllowance": 18,
            "packagingAllowance": 5,
            "stageHours": {
              "baking": 1.5,
              "decorating": 1.5,
              "deliverySetup": 0,
              "packagingCleanup": 0.75,
              "planning": 0.5,
              "shoppingPrep": 0.75
            }
          },
          "intricate": {
            "materialAllowance": 28,
            "packagingAllowance": 7,
            "stageHours": {
              "baking": 2,
              "decorating": 3,
              "deliverySetup": 0,
              "packagingCleanup": 1,
              "planning": 0.75,
              "shoppingPrep": 1
            }
          }
        },
        "label": "Cupcakes",
        "publicStartingPrice": 36
      },
      "sugar-cookies": {
        "complexities": {
          "simple": {
            "materialAllowance": 14,
            "packagingAllowance": 5,
            "stageHours": {
              "baking": 1.5,
              "decorating": 2,
              "deliverySetup": 0,
              "packagingCleanup": 0.75,
              "planning": 0.5,
              "shoppingPrep": 0.75
            }
          },
          "standard": {
            "materialAllowance": 20,
            "packagingAllowance": 6,
            "stageHours": {
              "baking": 2,
              "decorating": 3.5,
              "deliverySetup": 0,
              "packagingCleanup": 1,
              "planning": 0.75,
              "shoppingPrep": 1
            }
          },
          "intricate": {
            "materialAllowance": 30,
            "packagingAllowance": 8,
            "stageHours": {
              "baking": 2.5,
              "decorating": 6,
              "deliverySetup": 0,
              "packagingCleanup": 1.25,
              "planning": 1,
              "shoppingPrep": 1.25
            }
          }
        },
        "label": "Sugar cookies",
        "publicStartingPrice": 48
      },
      "macarons": {
        "complexities": {
          "simple": {
            "materialAllowance": 12,
            "packagingAllowance": 5,
            "stageHours": {
              "baking": 1.5,
              "decorating": 0.75,
              "deliverySetup": 0,
              "packagingCleanup": 0.75,
              "planning": 0.5,
              "shoppingPrep": 0.75
            }
          },
          "standard": {
            "materialAllowance": 18,
            "packagingAllowance": 6,
            "stageHours": {
              "baking": 2,
              "decorating": 1.5,
              "deliverySetup": 0,
              "packagingCleanup": 1,
              "planning": 0.75,
              "shoppingPrep": 1
            }
          },
          "intricate": {
            "materialAllowance": 28,
            "packagingAllowance": 8,
            "stageHours": {
              "baking": 2.5,
              "decorating": 3,
              "deliverySetup": 0,
              "packagingCleanup": 1.25,
              "planning": 1,
              "shoppingPrep": 1.25
            }
          }
        },
        "label": "Macarons",
        "publicStartingPrice": 30
      },
      "diy-kit": {
        "complexities": {
          "simple": {
            "materialAllowance": 10,
            "packagingAllowance": 4,
            "stageHours": {
              "baking": 1,
              "decorating": 0.5,
              "deliverySetup": 0,
              "packagingCleanup": 0.5,
              "planning": 0.25,
              "shoppingPrep": 0.5
            }
          },
          "standard": {
            "materialAllowance": 15,
            "packagingAllowance": 5,
            "stageHours": {
              "baking": 1.5,
              "decorating": 0.75,
              "deliverySetup": 0,
              "packagingCleanup": 0.75,
              "planning": 0.5,
              "shoppingPrep": 0.75
            }
          },
          "intricate": {
            "materialAllowance": 22,
            "packagingAllowance": 7,
            "stageHours": {
              "baking": 2,
              "decorating": 1.5,
              "deliverySetup": 0,
              "packagingCleanup": 1,
              "planning": 0.75,
              "shoppingPrep": 1
            }
          }
        },
        "label": "DIY kit",
        "publicStartingPrice": 25
      }
    },
    "profileId": "sweet-fork-calibration-seed",
    "targetMargin": 0.3,
    "variableOverheadRate": 0.1,
    "version": 1
  }
  $pricing_profile$::jsonb,
  false
)
on conflict (setting_key) do nothing;
