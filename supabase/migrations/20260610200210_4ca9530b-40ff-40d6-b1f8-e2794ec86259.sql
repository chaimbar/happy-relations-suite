
CREATE OR REPLACE FUNCTION public.get_employee_checkin_info(emp_id uuid)
RETURNS TABLE(employee_name text, employee_status text, site_name text, site_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT e.full_name, e.status::text, s.name, s.id
  FROM public.employees e
  LEFT JOIN public.assignments a ON a.employee_id = e.id AND a.date = CURRENT_DATE
  LEFT JOIN public.sites s ON s.id = a.site_id
  WHERE e.id = emp_id
  LIMIT 1;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.get_employee_checkin_info(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_employee_checkin_info(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_checkin(emp_id uuid, lat numeric, long numeric)
RETURNS TABLE(employee_name text, site_name text, checked_in_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_name   text;
  v_site_id uuid;
  v_site_name text;
  v_at timestamptz := now();
BEGIN
  SELECT e.full_name, e.status::text INTO v_name, v_status FROM public.employees e WHERE e.id = emp_id;
  IF v_name IS NULL THEN RAISE EXCEPTION 'employee_not_found'; END IF;
  IF v_status <> 'active' THEN RAISE EXCEPTION 'employee_inactive'; END IF;

  SELECT s.id, s.name INTO v_site_id, v_site_name
  FROM public.assignments a
  JOIN public.sites s ON s.id = a.site_id
  WHERE a.employee_id = emp_id AND a.date = CURRENT_DATE
  LIMIT 1;

  INSERT INTO public.check_ins(employee_id, site_id, checked_in_at, latitude, longitude)
  VALUES (emp_id, v_site_id, v_at, lat, long);

  RETURN QUERY SELECT v_name, v_site_name, v_at;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.submit_checkin(uuid, numeric, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_checkin(uuid, numeric, numeric) TO anon, authenticated;
