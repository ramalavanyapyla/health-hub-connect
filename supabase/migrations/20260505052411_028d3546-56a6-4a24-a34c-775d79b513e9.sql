do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'doctor_patient_access_doctor_id_fkey'
      and conrelid = 'public.doctor_patient_access'::regclass
  ) then
    alter table public.doctor_patient_access
      add constraint doctor_patient_access_doctor_id_fkey
      foreign key (doctor_id) references public.doctor_profiles(id) on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'doctor_patient_access_patient_id_fkey'
      and conrelid = 'public.doctor_patient_access'::regclass
  ) then
    alter table public.doctor_patient_access
      add constraint doctor_patient_access_patient_id_fkey
      foreign key (patient_id) references public.patients(id) on delete cascade;
  end if;
end $$;

create or replace function public.has_approved_access(_doctor_user_id uuid, _patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.doctor_patient_access dpa
    join public.doctor_profiles dp on dp.id = dpa.doctor_id
    where dp.user_id = _doctor_user_id
      and dpa.patient_id = _patient_id
      and dpa.status = 'approved'
  );
$$;

create or replace function public.can_chat_between_users(_user_a uuid, _user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.doctor_patient_access dpa
    join public.doctor_profiles dp on dp.id = dpa.doctor_id
    join public.patients p on p.id = dpa.patient_id
    where dpa.status = 'approved'
      and (
        (dp.user_id = _user_a and p.user_id = _user_b)
        or
        (dp.user_id = _user_b and p.user_id = _user_a)
      )
  );
$$;

create or replace function public.search_patient_lookup(_patient_uid text)
returns table (
  patient_id uuid,
  user_id uuid,
  patient_uid text,
  full_name text,
  blood_group text,
  allergies text,
  medical_conditions text,
  emergency_contact_name text,
  emergency_contact_phone text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as patient_id,
    p.user_id,
    p.patient_uid,
    pep.full_name,
    pep.blood_group,
    pep.allergies,
    pep.medical_conditions,
    pep.emergency_contact_name,
    pep.emergency_contact_phone
  from public.patients p
  left join public.public_emergency_profiles pep on pep.patient_id = p.id
  where lower(p.patient_uid) = lower(trim(_patient_uid))
    and (
      public.has_role(auth.uid(), 'doctor')
      or public.has_role(auth.uid(), 'admin')
    )
  limit 1;
$$;

create or replace function public.get_patient_profile_for_doctor(_patient_id uuid)
returns table (
  patient_id uuid,
  user_id uuid,
  patient_uid text,
  full_name text,
  blood_group text,
  allergies text,
  medical_conditions text,
  gender text,
  date_of_birth date,
  phone text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as patient_id,
    p.user_id,
    p.patient_uid,
    pr.full_name,
    pr.blood_group,
    pr.allergies,
    pr.medical_conditions,
    pr.gender,
    pr.date_of_birth,
    pr.phone,
    pr.address,
    pr.emergency_contact_name,
    pr.emergency_contact_phone,
    pr.avatar_url
  from public.patients p
  join public.profiles pr on pr.user_id = p.user_id
  where p.id = _patient_id
    and (
      auth.uid() = p.user_id
      or public.has_role(auth.uid(), 'admin')
      or public.has_approved_access(auth.uid(), p.id)
    )
  limit 1;
$$;

create or replace function public.get_doctor_directory_entries(_doctor_ids uuid[] default null)
returns table (
  doctor_id uuid,
  user_id uuid,
  full_name text,
  specialization text,
  department text,
  license_number text,
  phone text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    dp.id as doctor_id,
    dp.user_id,
    pr.full_name,
    dp.specialization,
    dp.department,
    dp.license_number,
    dp.phone
  from public.doctor_profiles dp
  left join public.profiles pr on pr.user_id = dp.user_id
  where _doctor_ids is null or dp.id = any(_doctor_ids);
$$;

drop policy if exists "Doctors can insert medical records" on public.medical_records;
drop policy if exists "Doctors can update medical records" on public.medical_records;
drop policy if exists "Doctors can view their patients records" on public.medical_records;
drop policy if exists "Doctors can insert approved patient medical records" on public.medical_records;
drop policy if exists "Doctors can update approved patient medical records" on public.medical_records;
drop policy if exists "Doctors can view approved patient medical records" on public.medical_records;

create policy "Doctors can insert approved patient medical records"
on public.medical_records
for insert
to authenticated
with check (
  public.has_role(auth.uid(), 'admin')
  or exists (
    select 1
    from public.doctor_profiles dp
    where dp.id = medical_records.doctor_id
      and dp.user_id = auth.uid()
      and public.has_approved_access(auth.uid(), medical_records.patient_id)
  )
);

create policy "Doctors can update approved patient medical records"
on public.medical_records
for update
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or exists (
    select 1
    from public.doctor_profiles dp
    where dp.id = medical_records.doctor_id
      and dp.user_id = auth.uid()
      and public.has_approved_access(auth.uid(), medical_records.patient_id)
  )
);

create policy "Doctors can view approved patient medical records"
on public.medical_records
for select
to authenticated
using (
  public.has_role(auth.uid(), 'admin')
  or public.has_approved_access(auth.uid(), medical_records.patient_id)
);

drop policy if exists "Users can send messages" on public.chat_messages;
drop policy if exists "Users can view own messages" on public.chat_messages;
drop policy if exists "Users can mark messages as read" on public.chat_messages;
drop policy if exists "Approved doctor-patient pairs can send messages" on public.chat_messages;
drop policy if exists "Approved doctor-patient pairs can view messages" on public.chat_messages;
drop policy if exists "Approved doctor-patient pairs can update received messages" on public.chat_messages;

create policy "Approved doctor-patient pairs can send messages"
on public.chat_messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and public.can_chat_between_users(sender_id, receiver_id)
);

create policy "Approved doctor-patient pairs can view messages"
on public.chat_messages
for select
to authenticated
using (
  (auth.uid() = sender_id or auth.uid() = receiver_id)
  and public.can_chat_between_users(sender_id, receiver_id)
);

create policy "Approved doctor-patient pairs can update received messages"
on public.chat_messages
for update
to authenticated
using (
  auth.uid() = receiver_id
  and public.can_chat_between_users(sender_id, receiver_id)
);

alter table public.doctor_patient_access replica identity full;
alter table public.chat_messages replica identity full;