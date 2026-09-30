-- Migration: 013_seed_locations.sql
-- Seed 6 commune-level administrative locations used by the current reporting MVP.

INSERT INTO public.locations (code, name, parent_id, is_active, level)
VALUES
  ('PHU_THIEN', 'Phú Thiện', NULL, true, 'commune'),
  ('CHU_A_THAI', 'Chư A Thai', NULL, true, 'commune'),
  ('IA_HIAO', 'Ia Hiao', NULL, true, 'commune'),
  ('PO_TO', 'Pờ Tó', NULL, true, 'commune'),
  ('IA_PA', 'Ia Pa', NULL, true, 'commune'),
  ('IA_TUL', 'Ia Tul', NULL, true, 'commune')
ON CONFLICT DO NOTHING;