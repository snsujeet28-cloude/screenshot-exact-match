REVOKE EXECUTE ON FUNCTION public.create_profile() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.place_order(jsonb,jsonb,text) FROM PUBLIC,anon;
REVOKE EXECUTE ON FUNCTION public.rider_update(uuid,text,text,jsonb) FROM PUBLIC,anon;
REVOKE EXECUTE ON FUNCTION public.customer_rider(uuid) FROM PUBLIC,anon;
CREATE INDEX vendor_ledger_vendor ON public.vendor_ledger(vendor_id);