CREATE TABLE public.destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_hi text,
  name_te text,
  location_en text NOT NULL,
  location_hi text,
  location_te text,
  description_en text,
  description_hi text,
  description_te text,
  category text NOT NULL DEFAULT 'Nature',
  tags text[] NOT NULL DEFAULT '{}'::text[],
  latitude double precision,
  longitude double precision,
  trending boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.experiences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_en text NOT NULL,
  title_hi text,
  title_te text,
  description_en text,
  description_hi text,
  description_te text,
  icon text NOT NULL DEFAULT 'Sparkles',
  duration_en text,
  duration_hi text,
  duration_te text,
  difficulty_en text,
  difficulty_hi text,
  difficulty_te text,
  gradient text NOT NULL DEFAULT 'from-primary to-travel-ocean',
  category text NOT NULL DEFAULT 'Adventure',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value_en text NOT NULL,
  value_hi text,
  value_te text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.destination_places (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id uuid NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
  name text NOT NULL,
  note text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  stop_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_destination_places_destination ON public.destination_places(destination_id, stop_order);

GRANT SELECT ON public.destinations TO anon, authenticated;
GRANT SELECT ON public.experiences TO anon, authenticated;
GRANT SELECT ON public.site_content TO anon, authenticated;
GRANT SELECT ON public.destination_places TO anon, authenticated;
GRANT ALL ON public.destinations TO service_role;
GRANT ALL ON public.experiences TO service_role;
GRANT ALL ON public.site_content TO service_role;
GRANT ALL ON public.destination_places TO service_role;

ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.destination_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Destinations are publicly readable" ON public.destinations FOR SELECT USING (true);
CREATE POLICY "Experiences are publicly readable" ON public.experiences FOR SELECT USING (true);
CREATE POLICY "Site content is publicly readable" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Destination places are publicly readable" ON public.destination_places FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_destinations_updated_at BEFORE UPDATE ON public.destinations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_experiences_updated_at BEFORE UPDATE ON public.experiences FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_destination_places_updated_at BEFORE UPDATE ON public.destination_places FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();