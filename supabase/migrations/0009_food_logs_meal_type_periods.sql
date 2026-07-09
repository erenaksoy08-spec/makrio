-- Replace the legacy meal_type enum (breakfast/lunch/dinner/snack) with the
-- new 4-period model (morning/noon/evening/night) used by the Günlük page.
-- Existing rows keep their old values for history, but new inserts must use
-- the new set, so the check constraint covers both old and new values.
alter table food_logs drop constraint if exists food_logs_meal_type_check;

alter table food_logs add constraint food_logs_meal_type_check
  check (meal_type in ('morning', 'noon', 'evening', 'night', 'breakfast', 'lunch', 'dinner', 'snack'));
