-- Add bio column to users table if not exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;
NOTIFY pgrst, 'reload schema';
