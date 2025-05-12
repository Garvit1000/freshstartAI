-- Create profiles table first
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  onboarding_completed boolean default false,
  resume_url text
);

-- Drop existing trigger
drop trigger if exists on_auth_user_created on auth.users;

-- Drop existing policies
drop policy if exists "Authenticated users can upload resumes" on storage.objects;
drop policy if exists "Users can read their own resumes" on storage.objects;
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using (true);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Set up storage
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Enable RLS on storage
alter table storage.objects enable row level security;

-- Create storage policies
create policy "Authenticated users can upload resumes"
on storage.objects for insert
with check (
  bucket_id = 'resumes' and
  auth.role() = 'authenticated'
);

create policy "Users can read their own resumes"
on storage.objects for select
using (
  bucket_id = 'resumes' and
  owner = auth.uid()
);

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
