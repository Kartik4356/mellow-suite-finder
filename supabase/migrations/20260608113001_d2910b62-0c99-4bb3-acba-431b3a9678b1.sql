
-- Roles enum
create type public.app_role as enum ('admin', 'employee', 'guest');

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "Profiles viewable by owner" on public.profiles
  for select to authenticated using (auth.uid() = id);
create policy "Users update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "Users insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

-- User roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users see own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage roles" on public.user_roles
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile + guest role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'guest')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rooms
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  price_per_night numeric(10,2) not null check (price_per_night >= 0),
  capacity int not null default 2 check (capacity > 0),
  bed_type text not null default 'Queen',
  size_sqm int,
  image_url text,
  amenities text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.rooms to anon, authenticated;
grant insert, update, delete on public.rooms to authenticated;
grant all on public.rooms to service_role;
alter table public.rooms enable row level security;

create policy "Rooms readable by everyone" on public.rooms
  for select to anon, authenticated using (true);
create policy "Staff manage rooms" on public.rooms
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'employee'))
  with check (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'employee'));

-- Bookings
create type public.booking_status as enum ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete restrict,
  check_in date not null,
  check_out date not null,
  guests int not null default 1 check (guests > 0),
  total_price numeric(10,2) not null check (total_price >= 0),
  status public.booking_status not null default 'pending',
  guest_name text not null,
  guest_email text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (check_out > check_in)
);
grant select, insert, update on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;

create policy "Guests see own bookings" on public.bookings
  for select to authenticated using (
    user_id = auth.uid()
    or public.has_role(auth.uid(), 'employee')
    or public.has_role(auth.uid(), 'admin')
  );
create policy "Anyone authenticated can create booking" on public.bookings
  for insert to authenticated with check (user_id = auth.uid());
create policy "Guests update own pending bookings, staff any" on public.bookings
  for update to authenticated using (
    (user_id = auth.uid() and status in ('pending','confirmed'))
    or public.has_role(auth.uid(), 'employee')
    or public.has_role(auth.uid(), 'admin')
  );
create policy "Admins delete bookings" on public.bookings
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- App settings (singleton row id='global')
create table public.app_settings (
  id text primary key default 'global',
  hotel_name text not null default 'Aurelia Hotel',
  tagline text not null default 'Timeless luxury, modern comfort',
  theme_primary text not null default '#8b6f47',
  theme_accent text not null default '#c9a86a',
  subscription_plan text not null default 'starter',
  currency text not null default 'USD',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);
grant select on public.app_settings to anon, authenticated;
grant insert, update on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;

create policy "Settings readable by everyone" on public.app_settings
  for select to anon, authenticated using (true);
create policy "Only admins edit settings" on public.app_settings
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

insert into public.app_settings (id) values ('global') on conflict do nothing;

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger rooms_touch before update on public.rooms for each row execute function public.touch_updated_at();
create trigger bookings_touch before update on public.bookings for each row execute function public.touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.app_settings for each row execute function public.touch_updated_at();
