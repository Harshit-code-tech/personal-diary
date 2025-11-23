-- Reminders System
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  frequency VARCHAR(20) DEFAULT 'once', -- once, daily, weekly, monthly
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  entry_id UUID REFERENCES entries(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_reminders_user_date ON reminders(user_id, reminder_date);
CREATE INDEX idx_reminders_completed ON reminders(user_id, is_completed);

-- RLS Policies
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
  ON reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Life Events Timeline
CREATE TABLE IF NOT EXISTS life_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL, -- milestone, achievement, relationship, travel, work, education, health, other
  icon TEXT DEFAULT '⭐',
  color VARCHAR(7) DEFAULT '#FFD700',
  is_major BOOLEAN DEFAULT false,
  related_entries INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link life events to entries
CREATE TABLE IF NOT EXISTS entry_life_events (
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  event_id UUID REFERENCES life_events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (entry_id, event_id)
);

-- Indexes
CREATE INDEX idx_life_events_user_date ON life_events(user_id, event_date);
CREATE INDEX idx_life_events_category ON life_events(user_id, category);
CREATE INDEX idx_entry_life_events_entry ON entry_life_events(entry_id);
CREATE INDEX idx_entry_life_events_event ON entry_life_events(event_id);

-- RLS Policies for life_events
ALTER TABLE life_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own life events"
  ON life_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own life events"
  ON life_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own life events"
  ON life_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own life events"
  ON life_events FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for entry_life_events
ALTER TABLE entry_life_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entry-event links"
  ON entry_life_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_life_events.entry_id
      AND entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own entry-event links"
  ON entry_life_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_life_events.entry_id
      AND entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own entry-event links"
  ON entry_life_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_life_events.entry_id
      AND entries.user_id = auth.uid()
    )
  );

-- Goals & Milestones
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL, -- personal, career, health, relationships, financial, education, creative, other
  target_date DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  icon TEXT DEFAULT '🎯',
  color VARCHAR(7) DEFAULT '#4CAF50',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Goal milestones (sub-goals)
CREATE TABLE IF NOT EXISTS goal_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link goals to entries
CREATE TABLE IF NOT EXISTS entry_goals (
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (entry_id, goal_id)
);

-- Indexes
CREATE INDEX idx_goals_user ON goals(user_id, is_completed);
CREATE INDEX idx_goals_target_date ON goals(user_id, target_date);
CREATE INDEX idx_goal_milestones_goal ON goal_milestones(goal_id);
CREATE INDEX idx_entry_goals_entry ON entry_goals(entry_id);
CREATE INDEX idx_entry_goals_goal ON entry_goals(goal_id);

-- RLS Policies for goals
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own goals"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for goal_milestones
ALTER TABLE goal_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones of their goals"
  ON goal_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_milestones.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create milestones for their goals"
  ON goal_milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_milestones.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update milestones of their goals"
  ON goal_milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_milestones.goal_id
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete milestones of their goals"
  ON goal_milestones FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM goals
      WHERE goals.id = goal_milestones.goal_id
      AND goals.user_id = auth.uid()
    )
  );

-- RLS Policies for entry_goals
ALTER TABLE entry_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entry-goal links"
  ON entry_goals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_goals.entry_id
      AND entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own entry-goal links"
  ON entry_goals FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_goals.entry_id
      AND entries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own entry-goal links"
  ON entry_goals FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM entries
      WHERE entries.id = entry_goals.entry_id
      AND entries.user_id = auth.uid()
    )
  );

-- Function to update goal progress based on milestones
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_milestones INTEGER;
  completed_milestones INTEGER;
  new_progress INTEGER;
BEGIN
  -- Count total and completed milestones for the goal
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_completed = true)
  INTO total_milestones, completed_milestones
  FROM goal_milestones
  WHERE goal_id = COALESCE(NEW.goal_id, OLD.goal_id);
  
  -- Calculate progress percentage
  IF total_milestones > 0 THEN
    new_progress := ROUND((completed_milestones::DECIMAL / total_milestones) * 100);
  ELSE
    new_progress := 0;
  END IF;
  
  -- Update the goal's progress
  UPDATE goals
  SET progress = new_progress,
      updated_at = NOW()
  WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update goal progress
CREATE TRIGGER update_goal_progress_trigger
AFTER INSERT OR UPDATE OR DELETE ON goal_milestones
FOR EACH ROW
EXECUTE FUNCTION update_goal_progress();

-- Function to get upcoming reminders
CREATE OR REPLACE FUNCTION get_upcoming_reminders(p_user_id UUID, p_days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  title VARCHAR(255),
  description TEXT,
  reminder_date TIMESTAMP WITH TIME ZONE,
  frequency VARCHAR(20),
  is_completed BOOLEAN,
  days_until INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.title,
    r.description,
    r.reminder_date,
    r.frequency,
    r.is_completed,
    EXTRACT(DAY FROM (r.reminder_date - NOW()))::INTEGER as days_until
  FROM reminders r
  WHERE r.user_id = p_user_id
    AND r.is_completed = false
    AND r.reminder_date <= NOW() + (p_days_ahead || ' days')::INTERVAL
    AND r.reminder_date >= NOW()
  ORDER BY r.reminder_date ASC;
END;
$$ LANGUAGE plpgsql;
