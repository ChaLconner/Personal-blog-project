-- SQL script to fix RLS issue on categories table for Supabase
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

