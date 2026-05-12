-- ✅ Supabase SQL Editor에 이 전체 내용을 붙여넣고 실행하세요

-- 1. 참가자 테이블
create table if not exists members (
  id text primary key,
  name text not null,
  division text not null check (division in ('male','female')),
  color text not null,
  created_at timestamptz default now()
);

-- 2. 주간 기록 테이블
create table if not exists week_records (
  id bigserial primary key,
  member_id text references members(id) on delete cascade,
  week_idx integer not null check (week_idx >= 0 and week_idx < 8),
  visits integer[] default '{}',   -- 출석 요일 인덱스 배열 (0=월 ~ 6=일)
  clears jsonb default '{}',        -- { "plank": "75", "squat": "25", ... }
  updated_at timestamptz default now(),
  unique(member_id, week_idx)
);

-- 3. 종목 설정 테이블 (챌린지 전체가 하나의 row로 저장)
create table if not exists settings (
  id integer primary key default 1,  -- 항상 1번 row만 사용
  challenges jsonb not null,
  updated_at timestamptz default now()
);

-- 4. RLS(Row Level Security) 비활성화 - 인증 없이 누구나 읽기/쓰기 가능하게
alter table members enable row level security;
alter table week_records enable row level security;
alter table settings enable row level security;

create policy "public read members" on members for select using (true);
create policy "public insert members" on members for insert with check (true);
create policy "public delete members" on members for delete using (true);

create policy "public read records" on week_records for select using (true);
create policy "public upsert records" on week_records for insert with check (true);
create policy "public update records" on week_records for update using (true);

create policy "public read settings" on settings for select using (true);
create policy "public upsert settings" on settings for insert with check (true);
create policy "public update settings" on settings for update using (true);
