-- Add waitlist_position to profiles
alter table profiles add column waitlist_position integer;

-- Function to calculate waitlist position
create or replace function public.calculate_waitlist_position() 
returns trigger as $$
begin
  if (select count(*) from profiles) > 25 then
    -- Calculate position for users after the first 25
    select coalesce(max(waitlist_position), 0) + 1 
    into new.waitlist_position 
    from profiles 
    where waitlist_position is not null;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger to set waitlist position
create trigger set_waitlist_position
  before insert on profiles
  for each row execute procedure public.calculate_waitlist_position();