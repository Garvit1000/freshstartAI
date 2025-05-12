-- Add beta_user column to profiles
alter table profiles add column beta_user boolean default false;
alter table profiles add column waitlist_position integer;

-- Create a function to check and set beta user status
create or replace function public.check_and_set_beta_user() 
returns trigger as $$
declare
  user_count integer;
begin
  -- Get count of existing users
  select count(*) into user_count from profiles;
  
  -- If less than 25 users, set as beta user
  if user_count < 25 then
    new.beta_user := true;
  else
    -- Set waitlist position for non-beta users
    select coalesce(max(waitlist_position), 0) + 1 
    into new.waitlist_position 
    from profiles 
    where waitlist_position is not null;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to automatically set beta user status
create trigger set_beta_user_status
  before insert on profiles
  for each row execute procedure public.check_and_set_beta_user();