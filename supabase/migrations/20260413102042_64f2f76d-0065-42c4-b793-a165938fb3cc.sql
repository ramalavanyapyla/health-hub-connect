
-- Create doctor_patient_access table
CREATE TABLE public.doctor_patient_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE (doctor_id, patient_id)
);

ALTER TABLE public.doctor_patient_access ENABLE ROW LEVEL SECURITY;

-- Doctors can request access (insert)
CREATE POLICY "Doctors can request access"
  ON public.doctor_patient_access FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.doctor_profiles WHERE user_id = auth.uid() AND id = doctor_id)
  );

-- Doctors can view their own requests
CREATE POLICY "Doctors can view own requests"
  ON public.doctor_patient_access FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.doctor_profiles WHERE user_id = auth.uid() AND id = doctor_id)
  );

-- Patients can view requests for them
CREATE POLICY "Patients can view requests for them"
  ON public.doctor_patient_access FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.patients WHERE user_id = auth.uid() AND id = patient_id)
  );

-- Patients can update (approve/reject/revoke) requests for them
CREATE POLICY "Patients can update requests for them"
  ON public.doctor_patient_access FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.patients WHERE user_id = auth.uid() AND id = patient_id)
  );

-- Patients can delete (revoke) access
CREATE POLICY "Patients can delete access"
  ON public.doctor_patient_access FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.patients WHERE user_id = auth.uid() AND id = patient_id)
  );

-- Admins full access
CREATE POLICY "Admins full access to doctor_patient_access"
  ON public.doctor_patient_access FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-generate permanent QR token when patient is created
CREATE OR REPLACE FUNCTION public.auto_create_qr_token()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.qr_access_tokens (patient_id, created_by, access_level, expires_at)
  VALUES (NEW.id, NEW.user_id, 'emergency', now() + interval '100 years');
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_qr_on_patient_insert
  AFTER INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_qr_token();
