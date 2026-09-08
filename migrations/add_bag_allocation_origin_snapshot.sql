ALTER TABLE bag_allocations
  ADD COLUMN IF NOT EXISTS source_flupsy_name_snapshot text,
  ADD COLUMN IF NOT EXISTS source_basket_physical_number_snapshot integer;