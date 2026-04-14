
-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('booked', 'completed', 'cancelled', 'no_show');

-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  specialization TEXT,
  reason TEXT,
  status appointment_status NOT NULL DEFAULT 'booked',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments"
  ON public.appointments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.patients WHERE patients.id = appointments.patient_id AND patients.user_id = auth.uid()
  ));

-- Patients can create appointments
CREATE POLICY "Patients can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.patients WHERE patients.id = appointments.patient_id AND patients.user_id = auth.uid()
  ));

-- Patients can cancel their own appointments (update status only)
CREATE POLICY "Patients can update own appointments"
  ON public.appointments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.patients WHERE patients.id = appointments.patient_id AND patients.user_id = auth.uid()
  ));

-- Doctors can view appointments assigned to them
CREATE POLICY "Doctors can view own appointments"
  ON public.appointments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.doctor_profiles WHERE doctor_profiles.id = appointments.doctor_id AND doctor_profiles.user_id = auth.uid()
  ));

-- Doctors can update their appointments (status, notes)
CREATE POLICY "Doctors can update own appointments"
  ON public.appointments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.doctor_profiles WHERE doctor_profiles.id = appointments.doctor_id AND doctor_profiles.user_id = auth.uid()
  ));

-- Admins full access
CREATE POLICY "Admins full access to appointments"
  ON public.appointments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for appointments
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
