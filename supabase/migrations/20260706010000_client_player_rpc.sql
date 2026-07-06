-- GLAMOUR: allow static-site players without Supabase Auth
-- Client holds a random UUID in localStorage; RPC runs as SECURITY DEFINER.

ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_id_fkey;

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
  p_last_energy_at timestamptz
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
      last_energy_at = p_last_energy_at
  WHERE id = p_id
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_player(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_player_row(uuid, integer, integer, integer, integer, integer, integer, timestamptz) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_or_create_player(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_player_row(uuid, integer, integer, integer, integer, integer, integer, timestamptz) TO anon, authenticated;
