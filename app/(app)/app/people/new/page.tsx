'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Upload, Save, X } from 'lucide-react'

const relationships = [
  'Family',
  'Friend',
  'Partner',
  'Colleague',
  'Mentor',
  'Acquaintance',
  'Other',
]

export default function NewPersonPage() {
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('Friend')
  const [birthday, setBirthday] = useState('')
  const [notes, setNotes] = useState('')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatar(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatar || !user) return null

    const fileExt = avatar.name.split('.').pop()
    const fileName = `${user.id}/avatars/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('diary-images')
      .upload(fileName, avatar)

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return null
    }

    const { data } = supabase.storage.from('diary-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)
    try {
      let avatarUrl = null
      if (avatar) {
        avatarUrl = await uploadAvatar()
      }

      const { error } = await supabase
        .from('people')
        .insert({
          name: name.trim(),
          relationship,
          birthday: birthday || null,
          notes: notes.trim() || null,
          avatar_url: avatarUrl,
          user_id: user?.id,
        })

      if (error) throw error

      router.push('/app/people')
    } catch (error) {
      console.error('Error creating person:', error)
      alert('Failed to add person')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF5E6]/80 dark:bg-midnight/80 border-b border-charcoal/10 dark:border-white/10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/app/people"
              className="flex items-center gap-2 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to People</span>
            </Link>
            <div className="h-6 w-px bg-charcoal/20 dark:bg-white/20" />
            <h1 className="text-2xl font-serif font-bold text-charcoal dark:text-teal">
              Add Person
            </h1>
          </div>

          <div className="flex gap-3">
            <Link
              href="/app/people"
              className="flex items-center gap-2 px-6 py-3 border border-charcoal/20 dark:border-white/20 rounded-lg hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Person'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-graphite rounded-lg shadow-lg p-8 space-y-6">
          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">
              Avatar (Optional)
            </label>
            <div className="flex items-center gap-6">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-24 h-24 rounded-full object-cover border-4 border-gold/20 dark:border-teal/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-charcoal/5 dark:bg-white/5 flex items-center justify-center border-4 border-charcoal/10 dark:border-white/10">
                    <User className="w-12 h-12 text-charcoal/30 dark:text-white/30" />
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  id="avatar"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <label
                  htmlFor="avatar"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-charcoal/20 dark:border-white/20 rounded-lg cursor-pointer hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors text-charcoal dark:text-white"
                >
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </label>
                <p className="text-sm text-charcoal/60 dark:text-white/60 mt-2">
                  JPG, PNG or GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
              className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-gold dark:focus:border-teal transition-colors text-charcoal dark:text-white"
            />
          </div>

          {/* Relationship */}
          <div>
            <label htmlFor="relationship" className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Relationship <span className="text-red-500">*</span>
            </label>
            <select
              id="relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              required
              className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-gold dark:focus:border-teal transition-colors text-charcoal dark:text-white"
            >
              {relationships.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
          </div>

          {/* Birthday */}
          <div>
            <label htmlFor="birthday" className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Birthday (Optional)
            </label>
            <input
              id="birthday"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-gold dark:focus:border-teal transition-colors text-charcoal dark:text-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional information about this person..."
              rows={4}
              className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/10 dark:border-white/10 rounded-lg focus:outline-none focus:border-gold dark:focus:border-teal transition-colors text-charcoal dark:text-white resize-none"
            />
          </div>
        </form>
      </main>
    </div>
  )
}
