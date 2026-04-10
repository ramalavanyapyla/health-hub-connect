
-- Drop existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Replace handle_new_user to also handle roles and patient/doctor records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _role text;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Get role from metadata (set during registration)
  _role := COALESCE(NEW.raw_user_meta_data->>'role', '');

  -- Only assign role if provided during signup
  IF _role IN ('patient', 'doctor', 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF _role = 'patient' THEN
      INSERT INTO public.patients (user_id) VALUES (NEW.id);
    END IF;

    IF _role = 'doctor' THEN
      INSERT INTO public.doctor_profiles (user_id) VALUES (NEW.id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function for OAuth users to self-assign role after login
CREATE OR REPLACE FUNCTION public.assign_role_to_user(_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check user doesn't already have a role
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'User already has a role assigned';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _role = 'patient' THEN
    INSERT INTO public.patients (user_id) VALUES (auth.uid())
    ON CONFLICT DO NOTHING;
  END IF;

  IF _role = 'doctor' THEN
    INSERT INTO public.doctor_profiles (user_id) VALUES (auth.uid())
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;
