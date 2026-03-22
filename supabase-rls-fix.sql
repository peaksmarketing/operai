-- Fix: Allow authenticated users to create their own company and user record
-- Run this in Supabase SQL Editor

-- Allow any authenticated user to insert a company (for initial setup)
CREATE POLICY "authenticated users can create company" ON companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow any authenticated user to insert themselves into users
CREATE POLICY "users can insert themselves" ON users
  FOR INSERT WITH CHECK (id = auth.uid());

-- Allow users to read their own record
CREATE POLICY "users can read own record" ON users
  FOR SELECT USING (id = auth.uid());
