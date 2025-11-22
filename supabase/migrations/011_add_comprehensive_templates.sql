-- ============================================
-- ADD COMPREHENSIVE ENTRY TEMPLATES
-- Migration 011 - Add 15 new detailed templates
-- ============================================

INSERT INTO entry_templates (id, name, description, content_template, icon, is_system_template) VALUES
  -- Mental Health Templates
  ('550e8400-e29b-41d4-a716-446655440008', 'Mood Tracker', 'Track and analyze your mood patterns', '# Mood Check-In\n\n**Today''s Date:** {date}\n**Overall Mood:** {mood}\n\n## Morning\n**Energy Level:** ⚡⚡⚡⚡⚡ (rate 1-5)\n**Feelings:** \n\n## Afternoon\n**Energy Level:** ⚡⚡⚡⚡⚡\n**Feelings:** \n\n## Evening\n**Energy Level:** ⚡⚡⚡⚡⚡\n**Feelings:** \n\n## What Influenced My Mood Today\n- \n\n## Self-Care Actions\n- \n', '🎭', true),
  
  ('550e8400-e29b-41d4-a716-446655440009', 'Anxiety Log', 'Track anxiety triggers and coping strategies', '# Anxiety Check-In\n\n**Date:** {date}\n**Anxiety Level:** 🌡️ __/10\n\n## What Triggered It\n\n\n## Physical Symptoms\n- [ ] Racing heart\n- [ ] Shortness of breath\n- [ ] Sweating\n- [ ] Tension\n- [ ] Other: \n\n## What I''m Worried About\n\n\n## Coping Strategies I Used\n1. \n2. \n3. \n\n## What Helped Most\n\n\n## Notes for Next Time\n\n', '😰', true),

  -- Productivity Templates
  ('550e8400-e29b-41d4-a716-44665544000a', 'Daily Planner', 'Plan your day with intention', '# Daily Plan - {date}\n\n## 🎯 Top 3 Priorities\n1. \n2. \n3. \n\n## 📅 Schedule\n**Morning (6-12):**\n- \n\n**Afternoon (12-6):**\n- \n\n**Evening (6-10):**\n- \n\n## 💡 Ideas & Notes\n\n\n## ✅ Completed Tasks\n- [ ] \n- [ ] \n- [ ] \n\n## 🌟 Win of the Day\n\n', '📋', true),

  ('550e8400-e29b-41d4-a716-44665544000b', 'Project Notes', 'Track project progress and ideas', '# Project: [Name]\n\n**Date:** {date}\n**Status:** 🟢 On Track / 🟡 At Risk / 🔴 Blocked\n\n## Today''s Progress\n\n\n## Next Steps\n1. \n2. \n3. \n\n## Blockers & Challenges\n\n\n## Resources Needed\n\n\n## Ideas & Brainstorm\n\n', '📁', true),

  -- Relationship Templates
  ('550e8400-e29b-41d4-a716-44665544000c', 'Relationship Journal', 'Reflect on relationships', '# Relationship Reflection\n\n**Date:** {date}\n**Person:** \n\n## Quality Time Today\n\n\n## What I Appreciated\n\n\n## Challenges or Conflicts\n\n\n## How I Felt\n\n\n## What I Want to Remember\n\n\n## Action Items\n- \n', '💕', true),

  -- Creative Templates
  ('550e8400-e29b-41d4-a716-44665544000d', 'Story Ideas', 'Capture creative story concepts', '# Story Idea\n\n**Date:** {date}\n**Genre:** \n\n## Core Concept\n\n\n## Characters\n- **Name:** | **Role:** | **Trait:** \n- \n\n## Setting\n\n\n## Plot Points\n1. \n2. \n3. \n\n## Themes\n\n\n## Opening Line Ideas\n- "\n- "\n\n## Notes\n\n', '📖', true),

  ('550e8400-e29b-41d4-a716-44665544000e', 'Song Lyrics', 'Write and develop song lyrics', '# Song: [Title]\n\n**Date:** {date}\n**Mood/Genre:** \n**Key/Tempo:** \n\n## Verse 1\n\n\n## Chorus\n\n\n## Verse 2\n\n\n## Bridge\n\n\n## Outro\n\n\n## Notes & Ideas\n- Rhyme scheme: \n- Inspiration: \n- Changes to make: \n', '🎵', true),

  -- Health & Fitness
  ('550e8400-e29b-41d4-a716-44665544000f', 'Workout Log', 'Track fitness and exercise', '# Workout - {date}\n\n**Type:** 💪 Strength / 🏃 Cardio / 🧘 Yoga / 🚴 Other\n**Duration:** \n**Energy Level:** ⚡⚡⚡⚡⚡\n\n## Exercises\n\n| Exercise | Sets | Reps | Weight | Notes |\n|----------|------|------|--------|-------|\n| | | | | |\n| | | | | |\n| | | | | |\n\n## How I Felt\n**Before:** \n**During:** \n**After:** \n\n## Goals for Next Time\n\n', '🏋️', true),

  ('550e8400-e29b-41d4-a716-446655440010', 'Meal Planner', 'Plan and track meals', '# Meal Plan - {date}\n\n## Breakfast\n**What:** \n**Time:** \n**Calories:** \n**Notes:** \n\n## Lunch\n**What:** \n**Time:** \n**Calories:** \n**Notes:** \n\n## Dinner\n**What:** \n**Time:** \n**Calories:** \n**Notes:** \n\n## Snacks\n- \n\n## Water Intake\n💧💧💧💧💧💧💧💧 (8 glasses)\n\n## How I Felt\n**Energy:** \n**Hunger/Fullness:** \n**Mood:** \n\n## Tomorrow''s Plan\n\n', '🍽️', true),

  -- Learning & Growth
  ('550e8400-e29b-41d4-a716-446655440011', 'Book Notes', 'Capture insights from reading', '# Book: [Title]\n\n**Author:** \n**Date Started:** \n**Date Finished:** \n**Rating:** ⭐⭐⭐⭐⭐\n\n## Key Takeaways\n1. \n2. \n3. \n\n## Favorite Quotes\n> "\n\n> "\n\n## My Thoughts\n\n\n## How I''ll Apply This\n\n\n## Would I Recommend?\n**Yes / No** - Because: \n', '📚', true),

  ('550e8400-e29b-41d4-a716-446655440012', 'Learning Log', 'Track what you learn each day', '# Today I Learned\n\n**Date:** {date}\n**Topic:** \n\n## What I Learned\n\n\n## Why It Matters\n\n\n## How I''ll Use This\n\n\n## Questions I Still Have\n1. \n2. \n\n## Resources to Explore\n- \n- \n\n## Practice Plan\n\n', '🎓', true),

  -- Life Events
  ('550e8400-e29b-41d4-a716-446655440013', 'Birthday Reflection', 'Reflect on another year of life', '# Birthday Reflection - Age __\n\n**Date:** {date}\n\n## This Past Year\n\n### Highlights\n- \n\n### Challenges Overcome\n- \n\n### What I Learned\n\n\n### People Who Mattered Most\n\n\n## The Year Ahead\n\n### Goals & Dreams\n1. \n2. \n3. \n\n### Who I Want to Become\n\n\n### What I''m Excited About\n\n\n## Gratitude\n\n', '🎂', true),

  ('550e8400-e29b-41d4-a716-446655440014', 'Year in Review', 'Annual reflection and planning', '# Year in Review - {year}\n\n## 🌟 Biggest Wins\n1. \n2. \n3. \n\n## 📈 Growth Areas\n\n**Personal:**\n**Professional:**\n**Relationships:**\n**Health:**\n\n## 💪 Challenges Faced\n\n\n## 🎓 Lessons Learned\n\n\n## 📊 By the Numbers\n- Books Read: \n- Places Visited: \n- New Skills: \n- Major Changes: \n\n## 💝 Gratitude\n\n\n## 🎯 Next Year''s Vision\n\n### Goals\n1. \n2. \n3. \n\n### Word of the Year: \n\n### Who I Want to Become\n\n', '📅', true),

  -- Financial
  ('550e8400-e29b-41d4-a716-446655440015', 'Expense Tracker', 'Track daily spending', '# Daily Expenses - {date}\n\n## Purchases Today\n\n| Item | Category | Amount | Payment Method | Necessary? |\n|------|----------|--------|----------------|------------|\n| | | $ | | |\n| | | $ | | |\n| | | $ | | |\n\n**Total Spent:** $____\n\n## Budget Check\n- Daily Budget: $____\n- Remaining: $____\n\n## Reflection\n**Was this spending aligned with my goals?**\n\n**What could I have done differently?**\n\n', '💰', true),

  -- Mindfulness
  ('550e8400-e29b-41d4-a716-446655440016', 'Meditation Log', 'Track mindfulness practice', '# Meditation - {date}\n\n**Time:** \n**Duration:** \n**Type:** 🧘 Breathing / 🌊 Body Scan / 💭 Guided / 🎵 Sound\n\n## Before Practice\n**Mental State:** \n**Physical State:** \n**Energy Level:** ⚡⚡⚡⚡⚡\n\n## During Practice\n**Focus Quality:** 🎯🎯🎯🎯🎯\n**Distractions:** \n**Insights:** \n\n## After Practice\n**How I Feel:** \n**Changes Noticed:** \n\n## Notes\n\n', '🧘', true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✨ Added 16 new comprehensive entry templates!';
  RAISE NOTICE '';
  RAISE NOTICE '📝 Mental Health: Mood Tracker, Anxiety Log';
  RAISE NOTICE '⚡ Productivity: Daily Planner, Project Notes';
  RAISE NOTICE '💕 Relationships: Relationship Journal';
  RAISE NOTICE '🎨 Creative: Story Ideas, Song Lyrics';
  RAISE NOTICE '💪 Health: Workout Log, Meal Planner';
  RAISE NOTICE '📚 Learning: Book Notes, Learning Log';
  RAISE NOTICE '🎉 Life Events: Birthday Reflection, Year in Review';
  RAISE NOTICE '💰 Financial: Expense Tracker';
  RAISE NOTICE '🧘 Mindfulness: Meditation Log';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Total templates now: 23 (7 original + 16 new)';
END $$;
