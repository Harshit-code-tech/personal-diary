'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, Loader2, Upload, X } from 'lucide-react'

interface Person {
  id: string
  name: string
  relationship: string
  avatar_url: string | null
  birthday: string | null
  notes: string | null
}

const relationships = ['Family', 'Friend', 'Partner', 'Colleague', 'Mentor', 'Acquaintance', 'Other']

export default function EditPersonPage({ params }: { params: { id: string } }) {
  const [person, setPerson] = useState<Person | null>(null)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [birthday, setBirthday] = useState('')
  const [notes, setNotes] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const fetchPerson = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setPerson(data)
      setName(data.name)
      setRelationship(data.relationship)
      setBirthday(data.birthday || '')
      setNotes(data.notes || '')
      setAvatarPreview(data.avatar_url)
    } catch (err) {
      console.error('Error fetching person:', err)
      router.push('/app/people')
    } finally {
      setLoading(false)
    }
  }, [supabase, params.id, router])

  useEffect(() => {
    if (user) {
      fetchPerson()
    }
  }, [user, params.id, fetchPerson])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar image must be less than 5MB')
        return
      }

      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null

    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${user.id}/people/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('diary-images')
        .upload(fileName, avatarFile)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('diary-images').getPublicUrl(fileName)
      return data.publicUrl
    } catch (err) {
      console.error('Error uploading avatar:', err)
      throw err
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (!user) {
      setError('You must be logged in')
      return
    }

    setSaving(true)
    setError('')

    try {
      let avatarUrl = person?.avatar_url

      // Upload new avatar if changed
      if (avatarFile) {
        avatarUrl = await uploadAvatar()
      } else if (!avatarPreview && person?.avatar_url) {
        // Avatar was removed
        avatarUrl = null
      }

      const { error: updateError } = await supabase
        .from('people')
        .update({
          name: name.trim(),
          relationship,
          avatar_url: avatarUrl,
          birthday: birthday || null,
          notes: notes.trim() || null,
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      router.push(`/app/people/${params.id}`)
    } catch (err: any) {
      console.error('Error updating person:', err)
      setError(err.message || 'Failed to update person')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight flex items-center justify-center">
        <div className="text-charcoal dark:text-white">Loading...</div>
      </div>
    )
  }

  if (!person) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF5E6]/80 dark:bg-midnight/80 border-b border-charcoal/10 dark:border-white/10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link
            href={`/app/people/${params.id}`}
            className="flex items-center gap-2 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Cancel</span>
          </Link>

          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-gold dark:bg-teal text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-8">
          <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-teal mb-8">
            Edit Person
          </h1>

          {/* Avatar Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">
              Avatar
            </label>
            <div className="flex items-center gap-6">
              {avatarPreview ? (
                <div className="relative">
                  <Image
                    src={avatarPreview}
                    alt="Avatar preview"
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gold/20 dark:border-teal/20"
                  />
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-charcoal/10 dark:bg-white/10 flex items-center justify-center border-2 border-dashed border-charcoal/30 dark:border-white/30">
                  <Upload className="w-8 h-8 text-charcoal/40 dark:text-white/40" />
                </div>
              )}
              <div>
                <label className="cursor-pointer inline-block px-4 py-2 bg-charcoal/10 dark:bg-white/10 text-charcoal dark:text-white rounded-lg font-medium hover:bg-charcoal/20 dark:hover:bg-white/20 transition-colors">
                  {avatarPreview ? 'Change Avatar' : 'Upload Avatar'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-charcoal/60 dark:text-white/60 mt-2">
                  Maximum file size: 5MB
                </p>
              </div>
            </div>
          </div>

          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
              required
            />
          </div>

          {/* Relationship Dropdown */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Relationship
            </label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
            >
              {relationships.map((rel) => (
                <option key={rel} value={rel}>
                  {rel}
                </option>
              ))}
            </select>
          </div>

          {/* Birthday Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Birthday
            </label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
            />
          </div>

          {/* Notes Textarea */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this person..."
              rows={4}
              className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal resize-none"
            />
          </div>
        </div>
      </main>
    </div>
  )
}
