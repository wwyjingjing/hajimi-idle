-- ============================================================
-- 调试：定位 recalc_score 的 log 报错（固定 uid，绕过 auth）
-- 用法：SQL Editor 执行本文件 → 再执行下方的 SELECT 测试
-- ============================================================

-- 精简版：只复现「池子秒产 + 进化倍率」核心公式
create or replace function public.recalc_score_debug(p_uid uuid)
returns jsonb language plpgsql security definer set search_path = public as $func$
declare
  uid uuid := p_uid;
  pool_prod numeric[] := array[0.1,0.8,4,20,100,500,2500,13000,70000,4e5,2.2e6,1.2e7,
                             7e7,4e8,2.5e9,1.5e10,1e11,6e11,4e12,2.5e13,
                             1.5e14,8e14,4e15,2e16,1e17];
  pool_cost numeric[] := array[10,100,1000,15000,250000,4e6,6e7,1e9,1.5e10,2.5e11,4e12,7e13,
                             1.2e15,2e16,3e17,5e18,8e19,1.5e21,3e22,6e23,
                             1.2e25,2.5e26,5e27,1e29,2e30];
  total_server numeric := 0;
  sec_prod numeric := 0;
  evo_mult numeric := 1;
  i int;
  n int;
  pv numeric;
begin
  -- 模拟：1 个下水道池子，total=0 → 进化 0 级
  for i in 1..1 loop
    pv := 1;
    sec_prod := sec_prod + pv * pool_prod[i];
  end loop;
  -- 进化倍率（循环版）
  declare evo_lvl int := 0; t numeric := total_server;
  begin
    while t >= 10 and evo_lvl < 24 loop
      t := t / 10;
      evo_lvl := evo_lvl + 1;
    end loop;
    evo_mult := power(1.2, evo_lvl);
  end;
  return jsonb_build_object('sec_prod', sec_prod, 'evo_mult', evo_mult, 'total', sec_prod * evo_mult);
exception when others then
  return jsonb_build_object('error', SQLERRM, 'state', SQLSTATE);
end $func$;

-- 测试调用
select public.recalc_score_debug('00000000-0000-0000-0000-000000000001'::uuid);
