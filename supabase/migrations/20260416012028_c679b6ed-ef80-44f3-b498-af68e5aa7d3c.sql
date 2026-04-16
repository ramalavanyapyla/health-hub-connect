
-- Re-create trigger on auth.users for new user signup (profile + role + patient/doctor creation)
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Re-create trigger on patients for auto QR token generation
CREATE OR REPLACE TRIGGER on_patient_created
  AFTER INSERT ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_qr_token();
