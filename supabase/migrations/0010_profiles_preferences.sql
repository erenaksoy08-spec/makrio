-- Streak-unlocked customization choices (theme, water animation, ring color, badge visibility)
-- live as a single JSON blob on profiles so new rewards don't need new columns later.
alter table profiles add column if not exists preferences jsonb not null default '{}'::jsonb;
