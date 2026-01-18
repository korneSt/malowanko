-- Migration: Increase daily generation limit from 10 to 100
-- Date: 2026-01-04

-- Update check_and_update_daily_limit function
create or replace function check_and_update_daily_limit(
    p_user_id uuid,
    p_count integer default 1
)
returns boolean
language plpgsql
security definer
as $$
declare
    v_current_date date := current_date;
    v_generations_today integer;
    v_daily_limit constant integer := 100;
begin
    -- Get or create user limit record, reset if new day
    insert into user_limits (user_id, generations_today, last_generation_date)
    values (p_user_id, 0, v_current_date)
    on conflict (user_id) do update
    set generations_today = case 
        when user_limits.last_generation_date < v_current_date then 0
        else user_limits.generations_today
    end,
    last_generation_date = v_current_date;

    -- Get current count
    select generations_today into v_generations_today
    from user_limits
    where user_id = p_user_id;

    -- Check if adding count would exceed limit
    if v_generations_today + p_count > v_daily_limit then
        return false;
    end if;

    -- Update count
    update user_limits
    set generations_today = generations_today + p_count,
        last_generation_date = v_current_date
    where user_id = p_user_id;

    return true;
end;
$$;

-- Update get_remaining_generations function
create or replace function get_remaining_generations(p_user_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
    v_current_date date := current_date;
    v_generations_today integer;
    v_daily_limit constant integer := 100;
begin
    select generations_today, last_generation_date
    into v_generations_today
    from user_limits
    where user_id = p_user_id
    and last_generation_date = v_current_date;

    if not found then
        return v_daily_limit;
    end if;

    return greatest(0, v_daily_limit - v_generations_today);
end;
$$;

