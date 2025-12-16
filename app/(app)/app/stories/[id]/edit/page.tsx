'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Save, Loader2, Upload, X } from 'lucide-react'

const categories = ['Trip', 'Project', 'Life Event', 'Hobby', 'Relationship', 'Career', 'Health', 'Other']
const statuses = ['ongoing', 'completed', 'archived']
const iconOptions = ['📖', '✈️', '💼', '🎯', '❤️', '🌟', '🎨', '🏃', '🏠', '🎓', '🎉', '🌈', '🔥', '💡', '🌱']
const colorOptions = [
  '#D4AF37', '#2DD4BF', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
  '#3B82F6', '#10B981', '#F97316', '#6366F1',
]

export default function EditStoryPage({ params }: { params: { id: string } }) {
  const [story, setStory] = useState<any>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Trip')
  const [status, setStatus] = useState<'ongoing' | 'completed' | 'archived'>('ongoing')
  const [icon, setIcon] = useState('📖')
  const [color, setColor] = useState('#D4AF37')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const fetchStory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error

      setStory(data)
      setTitle(data.title)
      setDescription(data.description || '')
      setCategory(data.category || 'Trip')
      setStatus(data.status)
      setIcon(data.icon)
      setColor(data.color)
      setStartDate(data.start_date || '')
      setEndDate(data.end_date || '')
      setCoverPreview(data.cover_image_url)
    } catch (error) {
      console.error('Error fetching story:', error)
      router.push('/app/stories')
    } finally {
      setLoading(false)
    }
  }, [supabase, params.id, router])

  useEffect(() => {
    if (user) {
      fetchStory()
    }
  }, [user, params.id, fetchStory])

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Cover image must be less than 10MB')
        return
      }

      setCoverImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadCover = async (): Promise<string | null> => {
    if (!coverImage || !user) return null

    try {
      const fileExt = coverImage.name.split('.').pop()
      const fileName = `${user.id}/stories/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('diary-images')
        .upload(fileName, coverImage)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('diary-images').getPublicUrl(fileName)
      return data.publicUrl
    } catch (err) {
      console.error('Error uploading cover:', err)
      throw err
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!user) {
      setError('You must be logged in')
      return
    }

    setSaving(true)
    setError('')

    try {
      let coverUrl = story?.cover_image_url

      if (coverImage) {
        coverUrl = await uploadCover()
      } else if (!coverPreview && story?.cover_image_url) {
        coverUrl = null
      }

      const { error: updateError } = await supabase
        .from('stories')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          cover_image_url: coverUrl,
          icon,
          color,
          start_date: startDate || null,
          end_date: endDate || null,
          status,
          category: category || null,
        })
        .eq('id', params.id)

      if (updateError) throw updateError

      router.push(`/app/stories/${params.id}`)
    } catch (err: any) {
      console.error('Error updating story:', err)
      setError(err.message || 'Failed to update story')
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

  if (!story) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#FFF5E6] dark:bg-midnight">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#FFF5E6]/80 dark:bg-midnight/80 border-b border-charcoal/10 dark:border-white/10 shadow-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link
            href={`/app/stories/${params.id}`}
            className="flex items-center gap-2 text-charcoal dark:text-white hover:text-gold dark:hover:text-teal transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Cancel</span>
          </Link>

          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
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
      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-graphite rounded-lg shadow-lg p-8">
          <h1 className="font-serif text-3xl font-bold text-charcoal dark:text-teal mb-8">
            Edit Story
          </h1>

          {/* Cover Image */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">
              Cover Image (Optional)
            </label>
            {coverPreview ? (
              <div className="relative h-64 rounded-lg overflow-hidden">
                <Image
                  src={coverPreview}
                  alt="Cover preview"
                  width={800}
                  height={256}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    setCoverImage(null)
                    setCoverPreview(null)
                  }}
                  className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-charcoal/30 dark:border-white/30 rounded-lg cursor-pointer hover:border-gold dark:hover:border-teal transition-colors bg-charcoal/5 dark:bg-white/5">
                <Upload className="w-12 h-12 text-charcoal/40 dark:text-white/40 mb-4" />
                <span className="text-charcoal/60 dark:text-white/60">Click to upload cover image</span>
                <span className="text-xs text-charcoal/40 dark:text-white/40 mt-2">Maximum 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Icon and Color */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">
                Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {iconOptions.map(i => (
                  <button
                    key={i}
                    onClick={() => setIcon(i)}
                    className={`p-3 text-2xl rounded-lg transition-all ${
                      icon === i
                        ? 'bg-gold dark:bg-teal shadow-md scale-110'
                        : 'bg-charcoal/10 dark:bg-white/10 hover:bg-charcoal/20 dark:hover:bg-white/20'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">
                Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {colorOptions.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-full h-12 rounded-lg transition-all ${
                      color === c ? 'ring-4 ring-charcoal/30 dark:ring-white/30 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Summer Road Trip 2025"
              className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this story about?"
              rows={4}
              className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal resize-none"
            />
          </div>

          {/* Category and Status */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
              >
                {statuses.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-[#FFF5E6] dark:bg-midnight border border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-gold dark:focus:ring-teal"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
