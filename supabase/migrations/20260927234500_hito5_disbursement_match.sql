-- El disparador diferido solo revisa el desembolso de esta transacción
-- y exige que su gasto coincida en cuenta, monto y fecha.

create or replace function private.assert_disbursements_have_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  disbursement_id uuid;
begin
  if tg_table_name = 'movements' then
    disbursement_id := old.goal_disbursement_id;
    if disbursement_id is null then
      return null;
    end if;
    if not exists (
      select 1
      from public.goal_disbursements
      where goal_disbursements.id = disbursement_id
    ) then
      return null;
    end if;
  else
    disbursement_id := new.id;
  end if;

  if not exists (
    select 1
    from public.goal_disbursements
    join public.movements
      on movements.goal_disbursement_id = goal_disbursements.id
     and movements.user_id = goal_disbursements.user_id
     and movements.account_id = goal_disbursements.account_id
     and movements.amount_cents = goal_disbursements.amount_cents
     and movements.occurred_on = goal_disbursements.occurred_on
     and movements.kind = 'gasto'
     and movements.status = 'confirmado'
    where goal_disbursements.id = disbursement_id
  ) then
    raise exception 'El desembolso y su único gasto deben guardarse en la misma transacción.';
  end if;

  return null;
end;
$$;
