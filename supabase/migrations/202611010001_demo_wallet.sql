-- FirzzPay demo wallet schema
-- Run once in Supabase SQL Editor. This is a simulation only; never use as a real-money ledger.

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance bigint not null default 500000 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount bigint not null check (amount > 0),
  type text not null check (type in ('in', 'out')),
  status text not null default 'SIMULASI' check (status = 'SIMULASI'),
  created_at timestamptz not null default now()
);

alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;

drop policy if exists "Users read own wallet" on public.wallets;
create policy "Users read own wallet" on public.wallets
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users read own transactions" on public.wallet_transactions;
create policy "Users read own transactions" on public.wallet_transactions
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.create_demo_wallet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wallets (user_id, balance)
  values (new.id, 500000)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_demo_wallet on auth.users;
create trigger on_auth_user_created_demo_wallet
  after insert on auth.users
  for each row execute procedure public.create_demo_wallet();

-- Create wallets for accounts that registered before this SQL was installed.
insert into public.wallets (user_id, balance)
select id, 500000 from auth.users
on conflict (user_id) do nothing;

create or replace function public.apply_demo_transaction(
  p_type text,
  p_amount bigint,
  p_description text
)
returns table (new_balance bigint, transaction_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_balance bigint;
  v_transaction_id uuid;
  v_title text;
begin
  if v_user_id is null then
    raise exception 'Silakan login terlebih dahulu.';
  end if;
  if p_type not in ('in', 'out') then
    raise exception 'Jenis transaksi tidak valid.';
  end if;
  if p_amount is null or p_amount < 1000 or p_amount > 1000000 then
    raise exception 'Nominal demo harus Rp1.000 sampai Rp1.000.000.';
  end if;

  insert into public.wallets (user_id, balance)
  values (v_user_id, 500000)
  on conflict (user_id) do nothing;

  select w.balance into v_balance
  from public.wallets w
  where w.user_id = v_user_id
  for update;

  if p_type = 'out' and v_balance < p_amount then
    raise exception 'Saldo demo tidak mencukupi.';
  end if;

  if p_type = 'in' then
    v_balance := v_balance + p_amount;
    v_title := coalesce(nullif(left(trim(p_description), 60), ''), 'Top Up Demo');
  else
    v_balance := v_balance - p_amount;
    v_title := coalesce(nullif(left(trim(p_description), 60), ''), 'Transfer Demo');
  end if;

  update public.wallets
  set balance = v_balance, updated_at = now()
  where user_id = v_user_id;

  insert into public.wallet_transactions (user_id, title, amount, type)
  values (v_user_id, v_title, p_amount, p_type)
  returning id into v_transaction_id;

  return query select v_balance, v_transaction_id;
end;
$$;

revoke all on function public.apply_demo_transaction(text, bigint, text) from public;
grant execute on function public.apply_demo_transaction(text, bigint, text) to authenticated;

grant select on public.wallets to authenticated;
grant select on public.wallet_transactions to authenticated;
