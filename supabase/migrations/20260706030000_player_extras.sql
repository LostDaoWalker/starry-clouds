-- PBBG meta: gear, crew, arena dailies, stage stars (json blob)

ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS extras jsonb NOT NULL DEFAULT '{
    "gear": {"wig": 0, "shoes": 0, "bag": 0},
    "crew": null,
    "arenaFightsLeft": 5,
    "dailyReset": "",
    "stageStars": {},
    "dailies": {"arena": false, "stage": false, "energy": false},
    "dailyProgress": {"arenaWins": 0, "stagesCleared": 0, "energySpent": 0}
  }'::jsonb;

CREATE OR REPLACE FUNCTION public.save_player_row(
  p_id uuid,
  p_glamour integer,
  p_makeup integer,
  p_fashion integer,
  p_luster integer,
  p_energy integer,
  p_fame integer,
  p_last_energy_at timestamptz,
  p_stage integer,
  p_extras jsonb
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
      stage = p_stage,
      extras = p_extras
  WHERE id = p_id
  RETURNING * INTO result;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player not found';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_player_row(uuid, integer, integer, integer, integer, integer, integer, timestamptz, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_player_row(uuid, integer, integer, integer, integer, integer, integer, timestamptz, integer, jsonb) TO anon, authenticated;
