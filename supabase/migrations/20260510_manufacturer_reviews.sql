-- Manufacturer reviews table
-- Stores per-product feasibility decisions and optional notes from the manufacturer

create table if not exists manufacturer_reviews (
  id           uuid primary key default gen_random_uuid(),
  product_id   integer not null,          -- WooCommerce product ID
  product_name text not null,
  feasibility  text not null check (feasibility in ('yes', 'maybe', 'no')),
  notes        text,                       -- optional free-text notes
  reviewed_at  timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Unique per product (upsert on product_id)
create unique index if not exists manufacturer_reviews_product_id_idx
  on manufacturer_reviews (product_id);

-- Auto-update updated_at
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger manufacturer_reviews_updated_at
  before update on manufacturer_reviews
  for each row execute function update_updated_at_column();
