revoke all on function public.has_approved_access(uuid, uuid) from public, anon, authenticated;
revoke all on function public.can_chat_between_users(uuid, uuid) from public, anon, authenticated;
revoke all on function public.search_patient_lookup(text) from public, anon;
revoke all on function public.get_patient_profile_for_doctor(uuid) from public, anon;
revoke all on function public.get_doctor_directory_entries(uuid[]) from public, anon;

grant execute on function public.search_patient_lookup(text) to authenticated;
grant execute on function public.get_patient_profile_for_doctor(uuid) to authenticated;
grant execute on function public.get_doctor_directory_entries(uuid[]) to authenticated;