DROP POLICY order_read ON public.orders;
CREATE POLICY order_read ON public.orders FOR SELECT TO authenticated USING(customer_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY own_roles ON public.user_roles;
CREATE POLICY own_roles ON public.user_roles FOR SELECT TO authenticated USING(user_id=auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE FUNCTION public.validate_settings() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NEW.free_delivery<0 OR NEW.delivery_fee<0 OR NEW.coupon_discount<0 OR NEW.coupon_minimum<0 THEN RAISE EXCEPTION 'Amounts cannot be negative'; END IF; RETURN NEW; END $$;
CREATE TRIGGER validate_store_settings BEFORE INSERT OR UPDATE ON public.settings FOR EACH ROW EXECUTE FUNCTION public.validate_settings();