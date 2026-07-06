-- Campaign stage progression (League of Angels style)

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS stage integer NOT NULL DEFAULT 1 CHECK (stage >= 1);

CREATE OR REPLACE FUNCTION public.get_or_create_player(p_id uuid)
RETURNS public.players
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.players;
BEGIN
  SELECT * INTO result FROM public.players WHERE id = p_id;
  IF NOT FOUND THEN
    INSERT INTO public.players (id) VALUES (p_id) RETURNING * INTO result;
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_player_row(
  p_id uuid,
  p_glamour integer,
  p_makeup integer,
  p_fashion integer,
  p_luster integer,
  p_energy integer,
  p_fame integer,
  p_last_energy_at timestamptz,
  p_stage integer
)
RETURNS public.players
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.players;
BEGIN
  UPDATE public.players
  SET glamour = p_glamour,
      makeup = p_makeup,
      fashion = p_fashion,
      luster = p_luster,
      energy = p_energy,
      fame = p_fame,
      last_energy_at = p_last_energy_at,
      stage = p_stage
  WHERE id = p_id
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_player_row(uuid, integer, integer, integer, integer, integer, integer, timestamptz, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_player_row(uuid, integer, integer, integer, integer, integer, integer, timestamptz, integer) TO anon, authenticated;
