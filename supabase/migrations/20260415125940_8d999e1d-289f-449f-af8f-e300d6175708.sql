
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _role text;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  -- Get role from metadata
  _role := COALESCE(NEW.raw_user_meta_data->>'role', '');

  IF _role IN ('patient', 'doctor', 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF _role = 'patient' THEN
      INSERT INTO public.patients (user_id) VALUES (NEW.id);
    END IF;

    IF _role = 'doctor' THEN
      INSERT INTO public.doctor_profiles (user_id, specialization, license_number, phone)
      VALUES (
        NEW.id,
        NULLIF(NEW.raw_user_meta_data->>'specialization', ''),
        NULLIF(NEW.raw_user_meta_data->>'license_number', ''),
        NULLIF(NEW.raw_user_meta_data->>'phone', '')
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
