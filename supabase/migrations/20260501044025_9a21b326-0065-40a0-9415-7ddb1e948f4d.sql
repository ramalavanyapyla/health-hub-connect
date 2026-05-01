ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS allergies text,
ADD COLUMN IF NOT EXISTS medical_conditions text;

CREATE TABLE IF NOT EXISTS public.public_emergency_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL UNIQUE,
  full_name text,
  blood_group text,
  allergies text,
  medical_conditions text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.public_emergency_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view emergency profiles" ON public.public_emergency_profiles;
CREATE POLICY "Public can view emergency profiles"
ON public.public_emergency_profiles
FOR SELECT
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION public.sync_public_emergency_profile_for_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  _patient_id uuid;
BEGIN
  SELECT id INTO _patient_id
  FROM public.patients
  WHERE user_id = _user_id
  LIMIT 1;

  IF _patient_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.public_emergency_profiles (
    patient_id,
    full_name,
    blood_group,
    allergies,
    medical_conditions,
    emergency_contact_name,
    emergency_contact_phone,
    updated_at
  )
  SELECT
    _patient_id,
    p.full_name,
    p.blood_group,
    p.allergies,
    p.medical_conditions,
    p.emergency_contact_name,
    p.emergency_contact_phone,
    now()
  FROM public.profiles p
  WHERE p.user_id = _user_id
  ON CONFLICT (patient_id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    blood_group = EXCLUDED.blood_group,
    allergies = EXCLUDED.allergies,
    medical_conditions = EXCLUDED.medical_conditions,
    emergency_contact_name = EXCLUDED.emergency_contact_name,
    emergency_contact_phone = EXCLUDED.emergency_contact_phone,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_public_emergency_profile_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  PERFORM public.sync_public_emergency_profile_for_user(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_public_emergency_profile_from_patient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  PERFORM public.sync_public_emergency_profile_for_user(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_public_emergency_profile_on_profile ON public.profiles;
CREATE TRIGGER sync_public_emergency_profile_on_profile
AFTER INSERT OR UPDATE OF full_name, blood_group, allergies, medical_conditions, emergency_contact_name, emergency_contact_phone
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_public_emergency_profile_from_profile();

DROP TRIGGER IF EXISTS sync_public_emergency_profile_on_patient ON public.patients;
CREATE TRIGGER sync_public_emergency_profile_on_patient
AFTER INSERT
ON public.patients
FOR EACH ROW
EXECUTE FUNCTION public.handle_public_emergency_profile_from_patient();

DROP TRIGGER IF EXISTS update_public_emergency_profiles_updated_at ON public.public_emergency_profiles;
CREATE TRIGGER update_public_emergency_profiles_updated_at
BEFORE UPDATE ON public.public_emergency_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();