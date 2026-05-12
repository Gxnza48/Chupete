-- ============================================================
-- ChupeteClicker — Migration 013
-- Fix: case_drop = true para los 160 chupetes oficiales
-- (seed-chupetes.mjs los crea con case_drop = false por default)
-- Sin esto, /api/open-case devuelve "No hay items disponibles
-- para esa rareza" y el botón de Abrir caja no funciona.
-- ============================================================

UPDATE public.items SET case_drop = true;
