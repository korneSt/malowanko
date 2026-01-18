-- ============================================================================
-- Migration: Initial Schema for Malowanko
-- ============================================================================
-- Purpose: Creates the complete database schema for Malowanko - a coloring book
--          generation application for children.
--
-- Tables created:
--   - profiles: User profiles extending Supabase Auth
--   - colorings: Generated coloring pages
--   - user_library: User's personal library (junction table)
--   - favorites: Global favorites/likes for coloring pages
--
-- Features:
--   - Row Level Security (RLS) enabled on all tables
--   - Automatic profile creation on user registration
--   - Daily generation limits with automatic reset
--   - Denormalized favorites count with trigger-based updates
--   - Storage bucket for coloring images
--
-- Author: AI Migration Generator
-- Date: 2026-01-03
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: profiles
-- Purpose: Extends Supabase Auth with application-specific user data
-- ----------------------------------------------------------------------------
create table profiles (
    -- Primary key linked to Supabase Auth user
    id uuid primary key references auth.users(id) on delete cascade,
    
    -- User's email address (denormalized from auth.users for convenience)
    email text not null,
    
    -- Registration timestamp
    created_at timestamptz not null default now(),
    
    -- Daily generation limit tracking
    -- Resets automatically when last_generation_date is in the past
    generations_today integer not null default 0,
    
    -- Date of last generation (used for daily limit reset logic)
    last_generation_date date
);

-- Add descriptive comment to the table
comment on table profiles is 'User profiles extending Supabase Auth with application-specific data';
comment on column profiles.generations_today is 'Number of colorings generated today (resets daily)';
comment on column profiles.last_generation_date is 'Date of last generation, used for automatic daily limit reset';

-- Enable Row Level Security
alter table profiles enable row level security;

-- ----------------------------------------------------------------------------
-- Table: colorings
-- Purpose: Stores all generated coloring pages with metadata
-- ----------------------------------------------------------------------------
create table colorings (
    -- Unique identifier for each coloring page
    id uuid primary key default gen_random_uuid(),
    
    -- Owner/creator of the coloring page
    user_id uuid not null references profiles(id) on delete cascade,
    
    -- URL to the image in Supabase Storage
    image_url text not null,
    
    -- The prompt used to generate the coloring page
    prompt text not null,
    
    -- Array of 3-5 tags for categorization and search
    tags text[] not null default '{}',
    
    -- Target age group for the coloring page
    age_group text not null,
    
    -- Visual style/complexity of the coloring page
    style text not null,
    
    -- Creation timestamp
    created_at timestamptz not null default now(),
    
    -- Denormalized count of favorites for efficient sorting
    -- Updated automatically by trigger on favorites table
    favorites_count integer not null default 0,
    
    -- Constraints for data validation
    constraint valid_age_group check (age_group in ('0-3', '4-8', '9-12')),
    constraint valid_style check (style in ('prosty', 'klasyczny', 'szczegolowy', 'mandala')),
    constraint valid_prompt_length check (char_length(prompt) <= 500)
);

-- Add descriptive comments
comment on table colorings is 'All generated coloring pages with metadata';
comment on column colorings.tags is 'Array of 3-5 tags for categorization';
comment on column colorings.age_group is 'Target age group: 0-3, 4-8, or 9-12';
comment on column colorings.style is 'Visual style: prosty, klasyczny, szczegolowy, or mandala';
comment on column colorings.favorites_count is 'Denormalized count updated by trigger for efficient sorting';

-- Enable Row Level Security
alter table colorings enable row level security;

-- ----------------------------------------------------------------------------
-- Table: user_library
-- Purpose: Junction table for user's personal coloring page library
-- ----------------------------------------------------------------------------
create table user_library (
    -- User who owns this library entry
    user_id uuid not null references profiles(id) on delete cascade,
    
    -- Coloring page in the library
    coloring_id uuid not null references colorings(id) on delete cascade,
    
    -- When the coloring was added to the library
    added_at timestamptz not null default now(),
    
    -- Quick favorite marking within personal library
    -- (separate from global favorites which affect favorites_count)
    is_favorite boolean not null default false,
    
    -- Composite primary key prevents duplicates
    primary key (user_id, coloring_id)
);

-- Add descriptive comments
comment on table user_library is 'User personal library - junction table linking users to their saved colorings';
comment on column user_library.is_favorite is 'Personal favorite marking (separate from global favorites)';

-- Enable Row Level Security
alter table user_library enable row level security;

-- ----------------------------------------------------------------------------
-- Table: favorites
-- Purpose: Global favorites/likes that affect the public favorites_count
-- ----------------------------------------------------------------------------
create table favorites (
    -- User who favorited the coloring
    user_id uuid not null references profiles(id) on delete cascade,
    
    -- The favorited coloring page
    coloring_id uuid not null references colorings(id) on delete cascade,
    
    -- When the favorite was created
    created_at timestamptz not null default now(),
    
    -- Composite primary key prevents duplicate favorites
    primary key (user_id, coloring_id)
);

-- Add descriptive comments
comment on table favorites is 'Global favorites affecting public popularity count';
comment on column favorites.created_at is 'Timestamp of when user favorited the coloring';

-- Enable Row Level Security
alter table favorites enable row level security;

-- ============================================================================
-- SECTION 2: INDEXES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Indexes for colorings table
-- ----------------------------------------------------------------------------

-- Index for sorting by creation date (newest first)
create index idx_colorings_created_at on colorings(created_at desc);
comment on index idx_colorings_created_at is 'Optimizes sorting by newest colorings';

-- Index for sorting by popularity (most favorites first)
create index idx_colorings_favorites_count on colorings(favorites_count desc);
comment on index idx_colorings_favorites_count is 'Optimizes sorting by most popular colorings';

-- Index for filtering by age group
create index idx_colorings_age_group on colorings(age_group);
comment on index idx_colorings_age_group is 'Optimizes filtering by target age group';

-- GIN index for efficient array search on tags
create index idx_colorings_tags on colorings using gin(tags);
comment on index idx_colorings_tags is 'GIN index for efficient tag-based search';

-- Composite index for typical gallery queries (filter + sort)
create index idx_colorings_age_group_created_at on colorings(age_group, created_at desc);
comment on index idx_colorings_age_group_created_at is 'Composite index for filtered gallery queries with date sorting';

-- Index for fetching user colorings
create index idx_colorings_user_id on colorings(user_id);
comment on index idx_colorings_user_id is 'Optimizes fetching colorings by user';

-- ----------------------------------------------------------------------------
-- Indexes for user_library table
-- ----------------------------------------------------------------------------

-- Index for fetching user library
create index idx_user_library_user_id on user_library(user_id);
comment on index idx_user_library_user_id is 'Optimizes fetching user library entries';

-- Index for sorting library by date added
create index idx_user_library_added_at on user_library(user_id, added_at desc);
comment on index idx_user_library_added_at is 'Optimizes sorting library by date added';

-- Partial index for filtering favorites in library
create index idx_user_library_favorites on user_library(user_id) where is_favorite = true;
comment on index idx_user_library_favorites is 'Partial index for fetching only favorited items in library';

-- ----------------------------------------------------------------------------
-- Indexes for favorites table
-- ----------------------------------------------------------------------------

-- Index for fetching user favorites
create index idx_favorites_user_id on favorites(user_id);
comment on index idx_favorites_user_id is 'Optimizes fetching user favorites';

-- Index for sorting favorites by date
create index idx_favorites_created_at on favorites(user_id, created_at desc);
comment on index idx_favorites_created_at is 'Optimizes sorting favorites by date';

-- ============================================================================
-- SECTION 3: FUNCTIONS AND TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: update_favorites_count
-- Purpose: Maintains denormalized favorites_count on colorings table
-- Triggered by: INSERT or DELETE on favorites table
-- ----------------------------------------------------------------------------
create or replace function update_favorites_count()
returns trigger as $$
begin
    if tg_op = 'INSERT' then
        -- Increment favorites count when a new favorite is added
        update colorings
        set favorites_count = favorites_count + 1
        where id = new.coloring_id;
        return new;
    elsif tg_op = 'DELETE' then
        -- Decrement favorites count when a favorite is removed
        update colorings
        set favorites_count = favorites_count - 1
        where id = old.coloring_id;
        return old;
    end if;
    return null;
end;
$$ language plpgsql security definer;

comment on function update_favorites_count() is 'Trigger function to maintain denormalized favorites_count on colorings table';

-- Trigger to call update_favorites_count on favorites changes
create trigger trigger_update_favorites_count
after insert or delete on favorites
for each row
execute function update_favorites_count();

-- ----------------------------------------------------------------------------
-- Function: add_coloring_to_library
-- Purpose: Automatically adds newly created colorings to creator library
-- Triggered by: INSERT on colorings table
-- ----------------------------------------------------------------------------
create or replace function add_coloring_to_library()
returns trigger as $$
begin
    -- Automatically add newly created coloring to the creator's library
    insert into user_library (user_id, coloring_id, added_at)
    values (new.user_id, new.id, now());
    return new;
end;
$$ language plpgsql security definer;

comment on function add_coloring_to_library() is 'Trigger function to auto-add new colorings to creator library';

-- Trigger to call add_coloring_to_library on new colorings
create trigger trigger_add_to_library
after insert on colorings
for each row
execute function add_coloring_to_library();

-- ----------------------------------------------------------------------------
-- Function: handle_new_user
-- Purpose: Creates a profile record when a new user registers via Supabase Auth
-- Triggered by: INSERT on auth.users table
-- Note: Uses security definer with empty search_path as per Supabase best practices
--       See: https://supabase.com/docs/guides/auth/managing-user-data
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
set search_path = ''
as $$
begin
    -- Create a profile for the newly registered user
    insert into public.profiles (id, email, created_at)
    values (new.id, new.email, now());
    return new;
end;
$$ language plpgsql security definer;

comment on function public.handle_new_user() is 'Trigger function to auto-create profile on user registration';

-- Trigger to call handle_new_user on auth.users insert
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RLS Policies for profiles table
-- ----------------------------------------------------------------------------

-- Policy: Authenticated users can view their own profile
-- Rationale: User data is private and should only be accessible by the owner
create policy "profiles_select_own_authenticated"
on profiles for select
to authenticated
using (auth.uid() = id);

comment on policy "profiles_select_own_authenticated" on profiles is 
    'Authenticated users can only view their own profile';

-- Policy: Authenticated users can update their own profile
-- Rationale: Users should be able to modify their own profile data
create policy "profiles_update_own_authenticated"
on profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

comment on policy "profiles_update_own_authenticated" on profiles is 
    'Authenticated users can only update their own profile';

-- ----------------------------------------------------------------------------
-- RLS Policies for colorings table
-- ----------------------------------------------------------------------------

-- Policy: Anonymous users can view all colorings (public gallery)
-- Rationale: The gallery is public and accessible without authentication
create policy "colorings_select_anon"
on colorings for select
to anon
using (true);

comment on policy "colorings_select_anon" on colorings is 
    'Anonymous users can view all colorings in the public gallery';

-- Policy: Authenticated users can view all colorings (public gallery)
-- Rationale: The gallery is public and accessible to all authenticated users
create policy "colorings_select_authenticated"
on colorings for select
to authenticated
using (true);

comment on policy "colorings_select_authenticated" on colorings is 
    'Authenticated users can view all colorings in the public gallery';

-- Policy: Authenticated users can create colorings (only for themselves)
-- Rationale: Users can only create colorings attributed to their own account
create policy "colorings_insert_authenticated"
on colorings for insert
to authenticated
with check (auth.uid() = user_id);

comment on policy "colorings_insert_authenticated" on colorings is 
    'Authenticated users can create colorings only for themselves';

-- Policy: Authenticated users can delete their own colorings
-- Rationale: Users can manage (delete) only their own generated content
create policy "colorings_delete_own_authenticated"
on colorings for delete
to authenticated
using (auth.uid() = user_id);

comment on policy "colorings_delete_own_authenticated" on colorings is 
    'Authenticated users can delete only their own colorings';

-- ----------------------------------------------------------------------------
-- RLS Policies for user_library table
-- ----------------------------------------------------------------------------

-- Policy: Authenticated users can view their own library
-- Rationale: Library is private and should only be visible to the owner
create policy "user_library_select_authenticated"
on user_library for select
to authenticated
using (auth.uid() = user_id);

comment on policy "user_library_select_authenticated" on user_library is 
    'Authenticated users can only view their own library';

-- Policy: Authenticated users can add items to their own library
-- Rationale: Users can only add colorings to their own library
create policy "user_library_insert_authenticated"
on user_library for insert
to authenticated
with check (auth.uid() = user_id);

comment on policy "user_library_insert_authenticated" on user_library is 
    'Authenticated users can add items only to their own library';

-- Policy: Authenticated users can update their own library entries
-- Rationale: Users can modify (e.g., toggle is_favorite) only their own library items
create policy "user_library_update_authenticated"
on user_library for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

comment on policy "user_library_update_authenticated" on user_library is 
    'Authenticated users can update only their own library entries';

-- Policy: Authenticated users can delete from their own library
-- Rationale: Users can remove colorings only from their own library
create policy "user_library_delete_authenticated"
on user_library for delete
to authenticated
using (auth.uid() = user_id);

comment on policy "user_library_delete_authenticated" on user_library is 
    'Authenticated users can delete only from their own library';

-- ----------------------------------------------------------------------------
-- RLS Policies for favorites table
-- ----------------------------------------------------------------------------

-- Policy: Authenticated users can view their own favorites
-- Rationale: Favorites list is private to each user
create policy "favorites_select_authenticated"
on favorites for select
to authenticated
using (auth.uid() = user_id);

comment on policy "favorites_select_authenticated" on favorites is 
    'Authenticated users can only view their own favorites';

-- Policy: Authenticated users can add favorites
-- Rationale: Users can only create favorites attributed to their own account
create policy "favorites_insert_authenticated"
on favorites for insert
to authenticated
with check (auth.uid() = user_id);

comment on policy "favorites_insert_authenticated" on favorites is 
    'Authenticated users can add items to their own favorites';

-- Policy: Authenticated users can remove their own favorites
-- Rationale: Users can only remove favorites from their own list
create policy "favorites_delete_authenticated"
on favorites for delete
to authenticated
using (auth.uid() = user_id);

comment on policy "favorites_delete_authenticated" on favorites is 
    'Authenticated users can delete only their own favorites';

-- ============================================================================
-- SECTION 5: VIEWS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View: public_gallery
-- Purpose: Public view of colorings without exposing user_id
-- Rationale: Gallery should be anonymous - users should not see who created what
-- ----------------------------------------------------------------------------
create view public_gallery as
select
    id,
    image_url,
    prompt,
    tags,
    age_group,
    style,
    created_at,
    favorites_count
from colorings;

comment on view public_gallery is 'Public gallery view that hides user_id for anonymity';

-- ----------------------------------------------------------------------------
-- View: user_library_view
-- Purpose: Combined view of user library with coloring metadata
-- Rationale: Simplifies queries for displaying user library with full details
-- ----------------------------------------------------------------------------
create view user_library_view as
select
    ul.user_id,
    ul.added_at,
    ul.is_favorite as library_favorite,
    c.id as coloring_id,
    c.image_url,
    c.prompt,
    c.tags,
    c.age_group,
    c.style,
    c.created_at,
    c.favorites_count,
    exists(
        select 1 
        from favorites f 
        where f.user_id = ul.user_id 
        and f.coloring_id = c.id
    ) as is_global_favorite
from user_library ul
join colorings c on ul.coloring_id = c.id;

comment on view user_library_view is 'User library with full coloring metadata and favorite status';

-- ============================================================================
-- SECTION 6: HELPER FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: check_and_update_daily_limit
-- Purpose: Atomically checks if user can generate and updates the counter
-- Parameters:
--   - p_user_id: UUID of the user
--   - p_count: Number of generations to add (default 1)
-- Returns: TRUE if generation is allowed, FALSE if limit exceeded
-- ----------------------------------------------------------------------------
create or replace function check_and_update_daily_limit(
    p_user_id uuid,
    p_count integer default 1
)
returns boolean as $$
declare
    v_generations_today integer;
    v_last_date date;
    v_daily_limit constant integer := 10;
begin
    -- Fetch current generation stats for the user
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
    
    -- Update the counter atomically
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
$$ language plpgsql security definer;

comment on function check_and_update_daily_limit(uuid, integer) is 
    'Atomically checks daily generation limit and updates counter. Returns TRUE if allowed.';

-- ----------------------------------------------------------------------------
-- Function: get_remaining_generations
-- Purpose: Returns how many generations the user has left today
-- Parameters:
--   - p_user_id: UUID of the user
-- Returns: Number of remaining generations (0 to daily_limit)
-- ----------------------------------------------------------------------------
create or replace function get_remaining_generations(p_user_id uuid)
returns integer as $$
declare
    v_generations_today integer;
    v_last_date date;
    v_daily_limit constant integer := 10;
begin
    -- Fetch current generation stats
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
$$ language plpgsql security definer;

comment on function get_remaining_generations(uuid) is 
    'Returns the number of remaining generations for today';

-- ============================================================================
-- SECTION 7: STORAGE CONFIGURATION
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Storage bucket: colorings
-- Purpose: Stores all generated coloring page images
-- Access: Public read, authenticated write, owner delete
-- ----------------------------------------------------------------------------

-- Create the storage bucket for coloring images
-- Note: In Supabase, buckets are typically created via Dashboard or CLI,
-- but we can use SQL for consistency
insert into storage.buckets (id, name, public)
values ('colorings', 'colorings', true)
on conflict (id) do nothing;

-- Policy: Anyone (including anonymous) can read/download coloring images
-- Rationale: Gallery images are public and should be viewable without auth
create policy "colorings_storage_select_anon"
on storage.objects for select
to anon
using (bucket_id = 'colorings');

-- Policy: Authenticated users can also read coloring images
create policy "colorings_storage_select_authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'colorings');

-- Policy: Authenticated users can upload coloring images
-- Rationale: Only logged-in users can generate and upload new colorings
create policy "colorings_storage_insert_authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'colorings');

-- Policy: Users can delete their own uploaded files
-- Rationale: File ownership is determined by the folder structure (user_id/filename)
-- The first folder segment should be the user's UUID
create policy "colorings_storage_delete_own_authenticated"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'colorings' 
    and auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

