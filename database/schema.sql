-- 旅行计划历史记录表
-- 用于存储用户生成的旅行计划，支持查看和管理历史记录

CREATE TABLE travel_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,                    -- 计划标题
  destination VARCHAR(100) NOT NULL,              -- 目的地
  summary TEXT,                                   -- 计划概述
  days INTEGER NOT NULL DEFAULT 1,               -- 旅行天数
  budget INTEGER NOT NULL DEFAULT 0,             -- 预算（元）
  people INTEGER NOT NULL DEFAULT 1,             -- 人数
  preferences TEXT,                              -- 偏好描述
  start_date DATE,                               -- 出发日期
  plan_data JSONB NOT NULL,                      -- 完整的计划数据（JSON格式）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为查询优化创建索引
CREATE INDEX idx_travel_plans_user_id ON travel_plans(user_id);
CREATE INDEX idx_travel_plans_created_at ON travel_plans(created_at DESC);
CREATE INDEX idx_travel_plans_destination ON travel_plans(destination);

-- 启用行级安全策略（RLS）
ALTER TABLE travel_plans ENABLE ROW LEVEL SECURITY;

-- 用户只能访问自己的旅行计划
CREATE POLICY "Users can view own travel plans" ON travel_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own travel plans" ON travel_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own travel plans" ON travel_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own travel plans" ON travel_plans
  FOR DELETE USING (auth.uid() = user_id);