-- Migration: Fix daily limit functions to use profiles (not user_limits)
-- Date: 2026-01-05
--
-- Use this SQL to replace the broken functions that reference user_limits.
-- Daily limits are stored in profiles (generations_today, last_generation_date).
-- Copy-paste the blocks below into Supabase SQL Editor or run this migration.

-- Replace check_and_update_daily_limit (uses profiles, limit 100)
create or replace function check_and_update_daily_limit(
    p_user_id uuid,
    p_count integer default 1
)
returns boolean
language plpgsql
security definer
as $$
declare
    v_generations_today integer;
    v_last_date date;
    v_daily_limit constant integer := 100;
begin
    -- Fetch current generation stats for the user (from profiles)
    select generations_today, last_generation_date
    into v_generations_today, v_last_date
    from profiles
    where id = p_user_id;

    -- Reset counter if this is a new day
    if v_last_date is null or v_last_date < current_date then
        v_generations_today := 0;
    end if;

    -- Check if adding p_count would exceed the daily limit
    if v_generations_today + p_count > v_daily_limit then
        return false;
    end if;

    -- Update the counter atomically (in profiles)
    update profiles
    set
        generations_today = case
            when last_generation_date is null or last_generation_date < current_date
            then p_count
            else generations_today + p_count
        end,
        last_generation_date = current_date
    where id = p_user_id;

    return true;
end;
$$;

-- Replace get_remaining_generations (uses profiles, limit 100)
create or replace function get_remaining_generations(p_user_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
    v_generations_today integer;
    v_last_date date;
    v_daily_limit constant integer := 100;
begin
    -- Fetch current generation stats (from profiles)
    select generations_today, last_generation_date
    into v_generations_today, v_last_date
    from profiles
    where id = p_user_id;

    -- If new day or no previous generation, full limit available
    if v_last_date is null or v_last_date < current_date then
        return v_daily_limit;
    end if;

    -- Return remaining generations (minimum 0)
    return greatest(0, v_daily_limit - v_generations_today);
end;
$$;
