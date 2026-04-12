
-- QR Access Tokens table
CREATE TABLE public.qr_access_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  access_level text NOT NULL DEFAULT 'emergency' CHECK (access_level IN ('emergency', 'full')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  use_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL
);

ALTER TABLE public.qr_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can create own tokens"
  ON public.qr_access_tokens FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Patients can view own tokens"
  ON public.qr_access_tokens FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Patients can update own tokens"
  ON public.qr_access_tokens FOR UPDATE
  USING (created_by = auth.uid());

CREATE INDEX idx_qr_tokens_token ON public.qr_access_tokens(token);
CREATE INDEX idx_qr_tokens_patient ON public.qr_access_tokens(patient_id);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'alert')),
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);
