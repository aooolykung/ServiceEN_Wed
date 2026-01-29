-- Supabase Database Schema for Job Management System

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create allowed_users table for authentication allowlist
CREATE TABLE allowed_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  user_name VARCHAR(255),
  position VARCHAR(255), -- เพิ่มฟิลด์ตำแหน่งที่รับผิดชอบ
  is_electrical_responsible BOOLEAN DEFAULT FALSE, -- เพิ่มฟิลด์ระบุว่าเป็นผู้รับผิดชอบระบบไฟฟ้าหรือไม่
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create jobs table
CREATE TABLE jobs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  machine_name VARCHAR(255) NOT NULL,
  job_name VARCHAR(255) NOT NULL,
  open_date DATE NOT NULL,
  close_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  open_images JSONB DEFAULT '[]',
  close_images JSONB DEFAULT '[]',
  drive_file_id VARCHAR(255),
  drive_file_link TEXT,
  close_drive_file_id VARCHAR(255),
  close_drive_file_link TEXT,
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  electrical_responsible VARCHAR(255), -- เพิ่มฟิลด์ผู้รับผิดชอบระบบไฟฟ้า
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_records table
CREATE TABLE time_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date DATE NOT NULL,
  machine_id VARCHAR(255) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  regular_minutes INTEGER NOT NULL DEFAULT 0,
  ot_minutes INTEGER NOT NULL DEFAULT 0,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  work_minutes INTEGER NOT NULL DEFAULT 0,
  duration VARCHAR(50),
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_allowed_users_updated_at BEFORE UPDATE ON allowed_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_records ENABLE ROW LEVEL SECURITY;

-- Policies for allowed_users table (only admin can manage)
CREATE POLICY "Admins can view all allowed users" ON allowed_users FOR SELECT USING (
  auth.jwt() ->> 'email' = 'aooolykung@gmail.com'
);

CREATE POLICY "Admins can insert allowed users" ON allowed_users FOR INSERT WITH CHECK (
  auth.jwt() ->> 'email' = 'aooolykung@gmail.com'
);

CREATE POLICY "Admins can update allowed users" ON allowed_users FOR UPDATE USING (
  auth.jwt() ->> 'email' = 'aooolykung@gmail.com'
);

CREATE POLICY "Admins can delete allowed users" ON allowed_users FOR DELETE USING (
  auth.jwt() ->> 'email' = 'aooolykung@gmail.com'
);

-- Policies for jobs table
CREATE POLICY "Users can view own jobs" ON jobs FOR SELECT USING (
  auth.jwt() ->> 'email' = user_email OR
  auth.jwt() ->> 'email' = 'aooolykung@gmail.com'
);

CREATE POLICY "Users can insert own jobs" ON jobs FOR INSERT WITH CHECK (
  auth.jwt() ->> 'email' = user_email
);

CREATE POLICY "Users can update own jobs" ON jobs FOR UPDATE USING (
  auth.jwt() ->> 'email' = user_email OR
  auth.jwt() ->> 'email' = 'aooolykung@gmail.com'
);

CREATE POLICY "Users can delete own jobs" ON jobs FOR DELETE USING (
  auth.jwt() ->> 'email' = user_email OR
  auth.jwt() ->> 'email' = 'aooolykung@gmail.com'
);

-- Policies for time_records table
CREATE POLICY "Users can view own time records" ON time_records FOR SELECT USING (
  auth.jwt() ->> 'email' = user_email OR
  auth.jwt() ->> 'email' = 'aooolykung@gmail.com'
);

CREATE POLICY "Users can insert own time records" ON time_records FOR INSERT WITH CHECK (
  auth.jwt() ->> 'email' = user_email
);

CREATE POLICY "Users can update own time records" ON time_records FOR UPDATE USING (
  auth.jwt() ->> 'email' = user_email OR
  auth.jwt() ->> 'email' = 'aooolykung@gmail.com'
);

CREATE POLICY "Users can delete own time records" ON time_records FOR DELETE USING (
  auth.jwt() ->> 'email' = user_email OR
  auth.jwt() ->> 'email' = 'aooolykung@gmail.com'
);

-- Indexes for better performance
CREATE INDEX idx_jobs_user_email ON jobs(user_email);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_time_records_user_email ON time_records(user_email);
CREATE INDEX idx_time_records_date ON time_records(date);
CREATE INDEX idx_time_records_created_at ON time_records(created_at);
CREATE INDEX idx_allowed_users_email ON allowed_users(email);

-- Create machine_costcenter table
CREATE TABLE IF NOT EXISTS machine_costcenter (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  machine_id VARCHAR(20) NOT NULL UNIQUE,
  costcenter VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add wage_rate and ot_rate to allowed_users table
ALTER TABLE allowed_users 
ADD COLUMN IF NOT EXISTS wage_rate DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS ot_rate DECIMAL(10, 2) DEFAULT 0.00;

-- Insert machine costcenter data
INSERT INTO machine_costcenter (machine_id, costcenter) VALUES
('GID01A', '501103'), ('GID02A', '501103'), ('GID03A', '501202'),
('VAC01A', '501105'), ('VAC02A', '501105'), ('VAC03A', '501105'), ('VAC04A', '501105'), ('VAC06A', '501204'),
('COK01A', '501204'), ('COK02A', '501105'), ('COK03A', '501105'), ('COK04A', '501105'), ('COK05A', '501204'), ('COK06A', '501204'), ('COK07A', '501204'), ('COK10A', '501204'), ('COK11A', '501204'), ('COK12A', '501204'), ('COK13A', '501204'), ('COK14A', '501105'), ('COK15A', '501204'), ('COK16A', '501204'),
('BLO01A', '501205'), ('BLO02A', '505101'),
('MTV01A', '501202'), ('MTV02A', '501202'), ('MTV03A', '501103'),
('MIX01A', '501103'), ('MIX02A', '501106'), ('MIX03A', '501103'),
('SLI01A', '501102'), ('SLI02A', '501102'), ('SLI03A', '501102'),
('FRY03A', '501106'), ('FRY04A', '501106'), ('FRY05A', '501106'), ('FRY06A', '501106'), ('FRY07A', '501106'), ('FRY08A', '501106'),
('INF01A', '501106'), ('INF02A', '501106'), ('INF03A', '501106'), ('INF04A', '501106'), ('INF05A', '501106'), ('INF07A', '501106'), ('INF08A', '501106'),
('PUN01A', '501106'), ('SRD02A', '501106'), ('SRD03A', '501106'),
('MBM01A', '501106'), ('MBM02A', '501106'), ('MBM03A', '501106'), ('MBM04A', '501106'), ('MBM05A', '501106'), ('MBM06A', '501106'),
('FKA01A', '501106'), ('PDM01A', '501106'), ('DCT01A', '501106'), ('SBM01A', '501106'), ('BTS01A', '501106'), ('BDM01A', '501106'),
('GYZ01A', '501106'), ('DSH01A', '501106'), ('GYZ02A', '501106'), ('DSH02A', '501106'),
('GSM01A', '501106'), ('GSM02A', '501106'), ('SPL07A', '501106'), ('SPL08A', '501106'),
('CBM01A', '501106'), ('CBM02A', '501106'), ('BQF01A', '501106'), ('BQF02A', '501106'), ('BQF03A', '501106'), ('BQF04A', '501106'), ('BTR01A', '501106'),
('HSM03A', '501106'), ('HSM04A', '501106'), ('BUT02A', '501106'),
('PSR01A', '501106'), ('PSR02A', '501106'),
('XRA03A', '501107'), ('XRA04A', '501107'), ('XRA05A', '501107'), ('XRA06A', '501107'), ('XRA07A', '501108'), ('XRA08A', '501108'), ('XRA09A', '501108'), ('XRA10A', '501107'), ('XRA11A', '501107'),
('MTL01A', '501107'), ('MTL02A', '501107'), ('MTL03A', '501107'), ('MTL04A', '501107'), ('MTL06A', '501107'), ('MTL07A', '501107'), ('MTL08A', '501107'), ('MTL09A', '501107'), ('MTL10A', '501108'), ('MTL11A', '501108'),
('RJT01A', '501206'), ('RJT02A', '501107'), ('RJT03A', '501107'), ('RJT04A', '501107'), ('RJT05A', '501107'), ('RJT06A', '501107'), ('RJT07A', '501107'), ('RJT08A', '501107'), ('RJT09A', '501107'), ('RJT10A', '501206'), ('RJT11A', '501206'),
('FFS04A', '501107'), ('FFS05A', '501107'), ('FFS06A', '501206'),
('SEL07A', '501107'), ('SEL08A', '501107'), ('SEL10A', '501107'), ('SEL11A', '501107'), ('SEL12A', '501107'), ('SEL13A', '501107'), ('SEL14A', '501107'), ('SEL15A', '501107'), ('SEL16A', '501106'),
('MBC01A', '501107'), ('MBC02A', '501107'), ('MBC03A', '501107'), ('MBC05A', '501106'),
('IQF01A', '501107'), ('IQF02A', '501107'), ('IQF03A', '501107'), ('ACF01A', '501107'), ('INQ01A', '501107'),
('EQW01A', '501004'),
('PIN01A', '501107'), ('PIN02A', '501107'),
('BCF01A', '501107'), ('BCF02A', '501107'), ('BCF03A', '501107'), ('BCF04A', '501107'), ('BCF05A', '501107'),
('SAT02A', '501107'), ('SAT03A', '501107'), ('SUR01A', '501107'),
('BCV14A', '501106'), ('BCV15A', '501106'), ('BCV17A', '501106'), ('BCV18A', '501106'), ('BCV19A', '501106'), ('BCV20A', '501106'),
('RHE04A', '501106'), ('RHE05A', '501106'), ('MIS03A', '501106'),
('FVS02A', '501106'), ('FVS03A', '501205'), ('FVS04A', '501106'), ('FVS05A', '501107'), ('FVS06A', '501106'), ('FVS07A', '501106'), ('FVS08A', '501106'),
('IHC01A', '501204'), ('IHC02A', '501204'), ('IHC03A', '501204'),
('STM01A', '501106'), ('STM02A', '501106'), ('STM03A', '501106'), ('SCK01A', '501106'), ('SCK02A', '501106'),
('VRS02A', '501104'), ('VRS03A', '501104'), ('VRS04A', '501203'), ('VRS05A', '501104'), ('VRS06A', '501203'), ('VRS07A', '501104'),
('GRC01A', '501106'), ('AUS01A', '501106'), ('NEC01A', '501106'), ('BAF01A', '501106'),
('MIV01A', '501106'), ('MIV02A', '501205'), ('MIV03A', '501106'),
('CPR01A', '501205'), ('CPR02A', '501205'), ('SLC01A', '501205'), ('SLC02A', '501205'),
('ISC01A', '501106'), ('LSE01A', '501107'), ('BCB01A', '501108'),
('STA01A', '501107'), ('STA02A', '501106'), ('COL02A', '501107'), ('COL03A', '501105'), ('TBX01A', '501107'),
('NVT01B', '501204'), ('NVT03B', '501204'), ('NVT04B', '501204'), ('RIC03B', '501204'), ('RIC04B', '501205'), ('EQW02B', '501004'), ('EQW03B', '501004'), ('EQW04B', '501108'),
('VAC01B', '501205'), ('VAC02B', '501205'), ('VAC03B', '501205'), ('VAC04B', '501205'),
('MBC01B', '501205'), ('MBC02B', '501205'), ('MBC04B', '501205'), ('MBC05B', '501205'), ('MBC07B', '501205'), ('MBC14B', '501205'),
('BCV03B', '501205'), ('BCV04B', '501107'), ('BCV05B', '501205'), ('BCV06B', '501205'), ('BCV07B', '501108'), ('BCV08B', '501108'), ('BCV10B', '501206'), ('BCV11B', '501107'),
('MIC01B', '501205'), ('MIC02B', '501205'), ('MIC03B', '501205'), ('MIC04B', '501205'), ('TOP02B', '501205'), ('CRF03B', '501205'), ('CRF04B', '501205'),
('FFS04B', '501206'), ('FFS06B', '501206'), ('FFS07B', '501108'), ('FFS08B', '501107'), ('FFS09B', '501206'), ('FFS10B', '501206'),
('XRA01B', '501206'), ('XRA02B', '501206'), ('XRA04B', '501206'),
('MTL01B', '501206'), ('MTL02B', '501206'), ('MTL05B', '501206'), ('MTL06B', '501206'),
('RJT01B', '501206'), ('RJT02B', '501206'), ('RJT03B', '501206'), ('RJT04B', '501206'), ('RJT05B', '501206'), ('RJT06B', '501206'), ('RJT07B', '501107'), ('RJT08B', '501107'),
('CHW01B', '501206'), ('CHW02B', '501206'), ('CHW03B', '501206'), ('CHW04B', '501107'), ('CHW05B', '501107'), ('CHW06B', '501107'),
('STK08B', '501206'), ('STK10B', '501206'), ('STK12B', '501206'), ('STK13B', '501206'), ('STK14B', '501206'), ('STK15B', '501206'),
('SEL03B', '501108'), ('SEL04B', '501206'), ('SEL05B', '501206'), ('SEL06B', '501206'), ('SEL07B', '501206'), ('SEL08B', '501205'), ('SEL09B', '501206'),
('BDL01B', '501206'), ('BDL02B', '501206'), ('BDL03B', '501206'), ('BDL04B', '501206'), ('BDL05B', '501206'),
('SAC05B', '501107'), ('BNJ01B', '501108'), ('DPR01B', '501108'), ('FDC01B', '501206'), ('MAT01B', '501206'), ('TBX01B', '501206'), ('TBX03B', '501206'), ('TBX04B', '501107'), ('TBX05B', '501107'), ('TBX06B', '501107'),
('SPL01B', '501205'), ('SPL02B', '501205'), ('SPL03B', '501205'), ('WCV02B', '501102'), ('KGP01B', '501102'), ('KGP02B', '501201'), ('GID01B', '501201'), ('SLI04B', '501201'), ('SLI05B', '501201'), ('SLI06B', '501205'), ('EMU02B', '501102'), ('EMU03B', '501102'), ('SDY04B', '501102'),
('HSM01B', '501205'), ('HSM02B', '501205'), ('KON02B', '501102'), ('AMC01B', '501201'), ('BLO01B', '501102'), ('MTV01B', '501202'), ('MMS01B', '501103'), ('MMS02B', '501103'), ('MMS03B', '501202'), ('FSF01B', '501104'), ('STM01B', '501205'), ('STM02B', '501205'), ('STM03B', '501206'), ('STM04B', '501206'), ('VCC01B', '501204'), ('HSO02B', '501205'), ('BWG01B', '501105'), ('BWG02B', '501205'), ('ARC01B', '501204'), ('ARC02B', '501205'), ('BCM01B', '501205'), ('COV01B', '501205'), ('AFO01B', '501105'), ('STF01B', '501108'), ('STF05B', '501108'), ('STF06B', '501108'), ('ROB01B', '501108'), ('ROB02B', '501108'), ('BCF03B', '501205'), ('BCF04B', '501205'), ('BCF05B', '501206'), ('BCF06B', '501206'), ('ATS03B', '501206'), ('WMG01B', '501205'), ('FEG01B', '501205'), ('FEG02B', '501205'), ('GLC01B', '501205'), ('GLC02B', '501205'), ('GLC03B', '501205'), ('SEP01B', '501105'), ('RET01B', '503107'), ('NOD01B', '501205'), ('RKP01B', '501201')
ON CONFLICT (machine_id) DO NOTHING;

-- Enable RLS for machine_costcenter table
ALTER TABLE machine_costcenter ENABLE ROW LEVEL SECURITY;

-- Create policies for machine_costcenter table
CREATE POLICY "Anyone can view machine costcenter" ON machine_costcenter FOR SELECT USING (true);

CREATE POLICY "Admins can insert machine costcenter" ON machine_costcenter FOR INSERT WITH CHECK (
  auth.jwt() ->> 'email' = 'aooolykung@gmail.com'
);

CREATE POLICY "Admins can update machine costcenter" ON machine_costcenter FOR UPDATE USING (
  auth.jwt() ->> 'email' = 'aooolykung@gmail.com'
);

CREATE POLICY "Admins can delete machine costcenter" ON machine_costcenter FOR DELETE USING (
  auth.jwt() ->> 'email' = 'aooolykung@gmail.com'
);

-- Insert admin email into allowed_users (you can remove this if you want to add it manually)
INSERT INTO allowed_users (email, user_name, position, is_electrical_responsible, wage_rate, ot_rate) VALUES 
('aooolykung@gmail.com', 'วสันต์ นราแก้ว', 'ผู้ดูแลระบบ', FALSE, 350.00, 1.5);

-- Insert sample electrical responsible users
INSERT INTO allowed_users (email, user_name, position, is_electrical_responsible, wage_rate, ot_rate) VALUES 
('electrical1@company.com', 'สมชาย ใจดี', 'ช่างไฟฟ้า', TRUE, 300.00, 1.5),
('electrical2@company.com', 'สมศรี รักงาน', 'วิศวกรไฟฟ้า', TRUE, 300.00, 1.5);
