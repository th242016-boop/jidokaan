-- Owner-approved overseas base price, 2026-11-12: USD 230 -> USD 250.
-- The deploy migrator runs this file once in a transaction. The old-price
-- predicate also protects a later administrator price if SQL is replayed.
-- Keep the two original product rows for a targeted rollback; never reprice
-- orders, in-progress PayPal drafts, accessories, or domestic KRW amounts.
insert into site_settings (key, value)
select
  'overseas_shoe_prices_backup_20261112_v1',
  jsonb_agg(
    jsonb_build_object('id', id, 'data', data, 'sort', sort, 'updated_at', updated_at)
    order by id
  )::text
from catalog_products
where id in ('drone-custom', 'drone-mid')
  and data -> 'priceUsd' = '23000'::jsonb
having count(*) > 0
on conflict (key) do nothing;

update catalog_products
set data = jsonb_set(data, '{priceUsd}', '25000'::jsonb)
  || case
    when jsonb_typeof(data -> 'description') = 'object' then
      jsonb_build_object('description', coalesce((
        select jsonb_object_agg(key, case
          when jsonb_typeof(value) = 'string' then
            to_jsonb(regexp_replace(value #>> '{}', '\mUSD 230\M', 'USD 250', 'g'))
          else value
        end)
        from jsonb_each(data -> 'description')
      ), '{}'::jsonb))
    else '{}'::jsonb
  end,
  updated_at = now()
where id in ('drone-custom', 'drone-mid')
  and data -> 'priceUsd' = '23000'::jsonb;
