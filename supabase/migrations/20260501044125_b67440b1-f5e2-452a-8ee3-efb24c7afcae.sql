REVOKE ALL ON FUNCTION public.sync_public_emergency_profile_for_user(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_public_emergency_profile_from_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_public_emergency_profile_from_patient() FROM PUBLIC, anon, authenticated;