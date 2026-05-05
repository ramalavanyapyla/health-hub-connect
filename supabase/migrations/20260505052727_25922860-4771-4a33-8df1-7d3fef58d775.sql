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
    coalesce(pep.full_name, pr.full_name) as full_name,
    coalesce(pep.blood_group, pr.blood_group) as blood_group,
    coalesce(pep.allergies, pr.allergies) as allergies,
    coalesce(pep.medical_conditions, pr.medical_conditions) as medical_conditions,
    coalesce(pep.emergency_contact_name, pr.emergency_contact_name) as emergency_contact_name,
    coalesce(pep.emergency_contact_phone, pr.emergency_contact_phone) as emergency_contact_phone
  from public.patients p
  left join public.public_emergency_profiles pep on pep.patient_id = p.id
  left join public.profiles pr on pr.user_id = p.user_id
  where lower(p.patient_uid) = lower(trim(_patient_uid))
    and (
      public.has_role(auth.uid(), 'doctor')
      or public.has_role(auth.uid(), 'admin')
    )
  limit 1;
$$;