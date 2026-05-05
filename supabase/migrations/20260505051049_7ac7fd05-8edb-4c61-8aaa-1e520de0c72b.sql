
-- Add foreign keys for relationship hints (PostgREST nested selects) and integrity
ALTER TABLE public.doctor_patient_access
  ADD CONSTRAINT doctor_patient_access_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES public.doctor_profiles(id) ON DELETE CASCADE;

ALTER TABLE public.doctor_patient_access
  ADD CONSTRAINT doctor_patient_access_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- Prevent duplicate requests (used by 23505 check in client)
CREATE UNIQUE INDEX IF NOT EXISTS doctor_patient_access_unique
  ON public.doctor_patient_access (doctor_id, patient_id);

-- Enable realtime for instant request updates on patient dashboard and chat
ALTER TABLE public.doctor_patient_access REPLICA IDENTITY FULL;
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'doctor_patient_access'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.doctor_patient_access';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'chat_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages';
  END IF;
END $$;
