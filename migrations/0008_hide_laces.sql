-- 관리자가 진열안함으로 둔 끈 2종만 숨김. 설명글은 건드리지 않음.
update catalog_products
set data = jsonb_set(data, '{visible}', 'false'::jsonb),
    updated_at = now()
where id in ('lace-a1', 'lace-a2')
  and coalesce(data->>'visible', 'true') <> 'false';
