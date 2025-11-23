-- Remove duplicate Blank Canvas template
-- Migration 010 originally created this, but we want the inline version in the UI instead

-- Delete the specific template by ID
DELETE FROM entry_templates 
WHERE id = '550e8400-e29b-41d4-a716-446655440007'
  AND name = 'Blank Canvas'
  AND is_system_template = true;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✨ Removed duplicate Blank Canvas template!';
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  Deleted template: 550e8400-e29b-41d4-a716-446655440007';
  RAISE NOTICE '✅ The inline Blank template in TemplateModal.tsx remains';
  RAISE NOTICE '📝 Users can still start with a blank entry';
END $$;
