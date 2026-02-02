-- ============================================
-- FIX RLS POLICIES FOR SUPABASE
-- Run this SQL in Supabase SQL Editor
-- Created: 2026-02-02
-- ============================================

-- ===== 1. ลบ policies เดิมทั้งหมด =====

-- allowed_users
DROP POLICY IF EXISTS "Users can manage allowed_users" ON public.allowed_users;
DROP POLICY IF EXISTS "Admins can manage allowed users" ON public.allowed_users;
DROP POLICY IF EXISTS "Users can view allowed_users" ON public.allowed_users;
DROP POLICY IF EXISTS "Admins can view all allowed users" ON public.allowed_users;
DROP POLICY IF EXISTS "Admins can insert allowed users" ON public.allowed_users;
DROP POLICY IF EXISTS "Admins can update allowed users" ON public.allowed_users;
DROP POLICY IF EXISTS "Admins can delete allowed users" ON public.allowed_users;
DROP POLICY IF EXISTS "Anyone can view allowed_users" ON public.allowed_users;

-- machine_costcenter
DROP POLICY IF EXISTS "Users can manage machine_costcenter" ON public.machine_costcenter;
DROP POLICY IF EXISTS "Admins can manage machine costcenter" ON public.machine_costcenter;
DROP POLICY IF EXISTS "Anyone can view machine costcenter" ON public.machine_costcenter;
DROP POLICY IF EXISTS "Admins can insert machine costcenter" ON public.machine_costcenter;
DROP POLICY IF EXISTS "Admins can update machine costcenter" ON public.machine_costcenter;
DROP POLICY IF EXISTS "Admins can delete machine costcenter" ON public.machine_costcenter;

-- jobs
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs or admin" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs or admin" ON public.jobs;
DROP POLICY IF EXISTS "Allow all authenticated users to read all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow users to insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can update all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated users can delete all jobs" ON public.jobs;

-- time_records
DROP POLICY IF EXISTS "Users can view own time records" ON public.time_records;
DROP POLICY IF EXISTS "Users can insert own time records" ON public.time_records;
DROP POLICY IF EXISTS "Users can update own time records" ON public.time_records;
DROP POLICY IF EXISTS "Users can delete own time records" ON public.time_records;
DROP POLICY IF EXISTS "Users can update own time_records or admin" ON public.time_records;
DROP POLICY IF EXISTS "Users can delete own time_records or admin" ON public.time_records;
DROP POLICY IF EXISTS "Allow all authenticated users to read all time_records" ON public.time_records;
DROP POLICY IF EXISTS "Allow users to insert own time_records" ON public.time_records;
DROP POLICY IF EXISTS "Authenticated users can view all time_records" ON public.time_records;
DROP POLICY IF EXISTS "Authenticated users can update all time_records" ON public.time_records;
DROP POLICY IF EXISTS "Authenticated users can delete all time_records" ON public.time_records;

-- ===== 2. เปิด RLS ทุก table =====
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machine_costcenter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;

-- ===== 3. แก้ไข Function ให้มี search_path =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ===== 4. สร้าง policies ใหม่ =====

-- ==========================================
-- allowed_users: ทุกคนดูได้, admin แก้ไขได้
-- ==========================================
CREATE POLICY "Anyone can view allowed_users" ON public.allowed_users 
FOR SELECT USING (true);

CREATE POLICY "Admins can insert allowed_users" ON public.allowed_users 
FOR INSERT WITH CHECK ((select auth.jwt()) ->> 'email' = 'aooolykung@gmail.com');

CREATE POLICY "Admins can update allowed_users" ON public.allowed_users 
FOR UPDATE USING ((select auth.jwt()) ->> 'email' = 'aooolykung@gmail.com');

CREATE POLICY "Admins can delete allowed_users" ON public.allowed_users 
FOR DELETE USING ((select auth.jwt()) ->> 'email' = 'aooolykung@gmail.com');

-- ==========================================
-- machine_costcenter: ทุกคนดูได้, admin แก้ไขได้
-- ==========================================
CREATE POLICY "Anyone can view machine_costcenter" ON public.machine_costcenter 
FOR SELECT USING (true);

CREATE POLICY "Admins can insert machine_costcenter" ON public.machine_costcenter 
FOR INSERT WITH CHECK ((select auth.jwt()) ->> 'email' = 'aooolykung@gmail.com');

CREATE POLICY "Admins can update machine_costcenter" ON public.machine_costcenter 
FOR UPDATE USING ((select auth.jwt()) ->> 'email' = 'aooolykung@gmail.com');

CREATE POLICY "Admins can delete machine_costcenter" ON public.machine_costcenter 
FOR DELETE USING ((select auth.jwt()) ->> 'email' = 'aooolykung@gmail.com');

-- ==========================================
-- jobs: ทุกคนดู/แก้ไข/ลบได้, insert เฉพาะตัวเอง
-- ==========================================
CREATE POLICY "Authenticated users can view all jobs" ON public.jobs 
FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Users can insert own jobs" ON public.jobs 
FOR INSERT WITH CHECK ((select auth.jwt()) ->> 'email' = user_email);

CREATE POLICY "Authenticated users can update all jobs" ON public.jobs 
FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can delete all jobs" ON public.jobs 
FOR DELETE USING ((select auth.role()) = 'authenticated');

-- ==========================================
-- time_records: ทุกคนดู/แก้ไข/ลบได้, insert เฉพาะตัวเอง
-- ==========================================
CREATE POLICY "Authenticated users can view all time_records" ON public.time_records 
FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Users can insert own time_records" ON public.time_records 
FOR INSERT WITH CHECK ((select auth.jwt()) ->> 'email' = user_email);

CREATE POLICY "Authenticated users can update all time_records" ON public.time_records 
FOR UPDATE USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Authenticated users can delete all time_records" ON public.time_records 
FOR DELETE USING ((select auth.role()) = 'authenticated');

-- ============================================
-- DONE! Refresh the Supabase Linter to verify.
-- ============================================
