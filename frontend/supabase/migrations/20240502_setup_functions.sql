-- Function to set up storage policies
create or replace function setup_storage_policies(bucket_id text)
returns void
language plpgsql
security definer
as $$
begin
  -- Allow authenticated users to upload files
  execute format(
    'create policy "Authenticated users can upload files"
    on storage.objects for insert
    with check (
      bucket_id = %L and
      auth.role() = ''authenticated''
    )', bucket_id
  );

  -- Allow users to read their own files
  execute format(
    'create policy "Users can read their own files"
    on storage.objects for select
    using (
      bucket_id = %L and
      owner = auth.uid()
    )', bucket_id
  );

  -- Allow users to update their own files
  execute format(
    'create policy "Users can update their own files"
    on storage.objects for update
    using (
      bucket_id = %L and
      owner = auth.uid()
    )', bucket_id
  );

  -- Allow users to delete their own files
  execute format(
    'create policy "Users can delete their own files"
    on storage.objects for delete
    using (
      bucket_id = %L and
      owner = auth.uid()
    )', bucket_id
  );
end;
$$;

-- Function to set up profiles table
create or replace function setup_profiles_table()
returns void
language plpgsql
security definer
as $$
begin
  -- Create profiles table
  create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    updated_at timestamp with time zone,
    onboarding_completed boolean default false,
    resume_url text
  );

  -- Enable RLS
  alter table public.profiles enable row level security;

  -- Create policies
  create policy "Public profiles are viewable by everyone"
    on profiles for select
    using (true);

  create policy "Users can insert their own profile"
    on profiles for insert
    with check (auth.uid() = id);

  create policy "Users can update their own profile"
    on profiles for update
    using (auth.uid() = id);

  -- Create trigger for new users
  create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  as $$
  begin
    insert into public.profiles (id)
    values (new.id);
    return new;
  end;
  $$;

  -- Create trigger
  drop trigger if exists on_auth_user_created on auth.users;
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
end;
$$;
