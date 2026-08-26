insert into site_settings (key, value)
values (
  'notice_json',
  '{"enabled":true,"text":"임시사이트로 현재 주문 불가합니다. 시뮬레이터는 이용 가능합니다"}'
)
on conflict (key) do update set value = excluded.value;
