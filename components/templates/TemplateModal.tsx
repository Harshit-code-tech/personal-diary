'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/database.types'

type Template = Database['public']['Tables']['entry_templates']['Row']

interface TemplateModalProps {
  onClose: () => void
  onSelect: (template: any) => void
}

export default function TemplateModal({ onClose, onSelect }: TemplateModalProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('entry_templates')
        .select('*')
        .order('is_system_template', { ascending: false })
        .order('name')

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-graphite rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="border-b border-charcoal/10 dark:border-white/10 p-6 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-charcoal dark:text-teal">
              Choose a Template
            </h2>
            <p className="text-sm text-charcoal/70 dark:text-white/70 mt-1">
              Start with a pre-built template or create your own
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-charcoal/70 dark:text-white/70 hover:text-charcoal dark:hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => {
                    onSelect(template)
                    onClose()
                  }}
                />
              ))}

              {/* Blank Template */}
              <button
                onClick={() => {
                  onSelect({
                    id: 'blank',
                    name: 'Blank',
                    description: 'Start from scratch',
                    content_template: '# \n\n',
                    icon: '📄',
                    is_system_template: true,
                    user_id: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  onClose()
                }}
                className="border-2 border-dashed border-charcoal/20 dark:border-white/20 rounded-lg p-6 hover:border-gold dark:hover:border-teal hover:bg-gold/5 dark:hover:bg-teal/5 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">📄</div>
                  <div className="flex-1">
                    <h3 className="font-serif text-lg font-semibold text-charcoal dark:text-teal mb-1">
                      Blank Canvas
                    </h3>
                    <p className="text-sm text-charcoal/70 dark:text-white/70">
                      Start from scratch with a completely empty entry
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TemplateCard({ template, onClick }: { template: Template; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="border border-charcoal/10 dark:border-white/10 rounded-lg p-6 hover:border-gold dark:hover:border-teal hover:shadow-md transition-all text-left"
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{template.icon || '📝'}</div>
        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold text-charcoal dark:text-teal mb-1">
            {template.name}
          </h3>
          <p className="text-sm text-charcoal/70 dark:text-white/70 mb-3">
            {template.description}
          </p>
          {template.is_system_template && (
            <span className="inline-block px-2 py-1 text-xs bg-gold/10 text-gold dark:bg-teal/10 dark:text-teal rounded">
              System Template
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
