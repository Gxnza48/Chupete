-- Migration 012: Extended badge system
-- Adds more click milestones, level milestones, drop milestones, and rarity badges

INSERT INTO public.badges (key, name, description, icon_svg) VALUES
  -- Click milestones
  ('click_50000',          '50K Clickeador',        'Clickeaste 50.000 veces.',                    '🌊'),
  ('click_100000',         'Cien Mil',               'Clickeaste 100.000 veces.',                   '💀'),
  ('click_500000',         'Medio Millón',           'Clickeaste 500.000 veces. Sos un enfermo.',   '👁️'),
  ('click_1000000',        'El Millonario',          'Un millón de clicks. Hay que ir al médico.',  '🌌'),
  -- Level milestones
  ('nivel_50',             'Veterano',               'Llegaste al nivel 50.',                       '🏆'),
  ('nivel_100',            'Centurión',              'Llegaste al nivel 100. El máximo original.',  '👑'),
  ('nivel_200',            'Más Allá',               'Nivel 200. Ya no sos de este mundo.',         '🔮'),
  -- Rarity drop firsts
  ('primer_extraterrestre','Primer Contacto',        'Conseguiste tu primer item Extraterrestre.',  '👽'),
  -- Drop count milestones
  ('drops_10',             'Coleccionista',          'Acumulaste 10 drops totales.',                '🎁'),
  ('drops_100',            'Adicto',                 'Acumulaste 100 drops totales.',               '📦'),
  ('drops_500',            'Enfermo del Juego',      'Acumulaste 500 drops totales.',               '🗃️'),
  -- Rarity collector badges
  ('colector_legendario',  'Leyenda Coleccionada',   'Tenés 5+ items Legendarios.',                 '🟠'),
  ('colector_extraterrestre','Alien Collector',      'Tenés 3+ items Extraterrestres.',             '💚'),
  ('colector_ort',         'En el Ort Total',        'Tenés 2+ items En el Ort.',                   '💎')
ON CONFLICT (key) DO NOTHING;
