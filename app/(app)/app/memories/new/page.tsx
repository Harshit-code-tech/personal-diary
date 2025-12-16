'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, ImagePlus, Plus, Upload, X } from 'lucide-react';
import { compressImage, uploadImage } from '@/lib/image-utils';
import Link from 'next/link';

export default function CreateMemoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const personId = searchParams.get('person');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    memory_date: new Date().toISOString().split('T')[0],
    location: '',
    mood: 'happy',
    tags: [] as string[],
    images: [] as string[],
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setUserId(data.user?.id ?? null);
  }, [supabase]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleAddImageUrl = () => {
    const imageUrl = prompt('Enter image URL:');
    if (imageUrl && imageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()],
      }));
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (!userId) {
      setUploadError('You must be logged in to upload images');
      return;
    }

    setUploadError(null);
    setUploading(true);

    const newImages: string[] = [];
    const tempId = crypto.randomUUID();

    try {
      for (const file of Array.from(files)) {
        const compressed = await compressImage(file);
        const { url } = await uploadImage(supabase, userId, `memories/${tempId}`, compressed);
        newImages.push(url);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      await handleFiles(e.clipboardData.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!personId) {
        setError('Person ID is required');
        return;
      }

      if (!formData.title.trim()) {
        setError('Memory title is required');
        return;
      }

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        setError('You must be logged in to create a memory');
        return;
      }

      const { error: insertError } = await supabase.from('memories').insert({
        user_id: user.user.id,
        person_id: personId,
        title: formData.title,
        description: formData.description,
        memory_date: formData.memory_date,
        location: formData.location,
        mood: formData.mood,
        tags: formData.tags,
        images: formData.images,
        is_favorite: false,
      });

      if (insertError) throw insertError;

      router.push(`/app/people/${personId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create memory');
    } finally {
      setIsLoading(false);
    }
  };

  const moods = ['happy', 'sad', 'excited', 'grateful', 'reflective', 'nostalgic', 'bittersweet'];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={personId ? `/app/people/${personId}` : '/app/people'}
          className="inline-flex items-center gap-2 text-teal dark:text-gold hover:opacity-75 transition-opacity mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white">
          Create Memory
        </h1>
        <p className="text-charcoal/60 dark:text-white/60 mt-2">
          Capture a special moment and memory
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-heading font-semibold text-charcoal dark:text-white mb-2">
            Memory Title *
          </label>
          <input
            id="title"
            name="title"
            type="text"
            placeholder="e.g., First time climbing together, Birthday celebration"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-charcoal/20 dark:border-white/10 bg-white dark:bg-graphite text-charcoal dark:text-white placeholder-charcoal/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal dark:focus:ring-gold"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-heading font-semibold text-charcoal dark:text-white mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="Write down the details of this memory..."
            value={formData.description}
            onChange={handleChange}
            rows={6}
            className="w-full px-4 py-3 rounded-lg border border-charcoal/20 dark:border-white/10 bg-white dark:bg-graphite text-charcoal dark:text-white placeholder-charcoal/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal dark:focus:ring-gold resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Memory Date */}
          <div>
            <label htmlFor="memory_date" className="block text-sm font-heading font-semibold text-charcoal dark:text-white mb-2">
              When did this happen? *
            </label>
            <input
              id="memory_date"
              name="memory_date"
              type="date"
              value={formData.memory_date}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-charcoal/20 dark:border-white/10 bg-white dark:bg-graphite text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-teal dark:focus:ring-gold"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-heading font-semibold text-charcoal dark:text-white mb-2">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="e.g., Rocky Mountain Trail, Coffee shop on 5th"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-charcoal/20 dark:border-white/10 bg-white dark:bg-graphite text-charcoal dark:text-white placeholder-charcoal/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal dark:focus:ring-gold"
            />
          </div>
        </div>

        {/* Mood */}
        <div>
          <label htmlFor="mood" className="block text-sm font-heading font-semibold text-charcoal dark:text-white mb-2">
            How did you feel?
          </label>
          <select
            id="mood"
            name="mood"
            value={formData.mood}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-lg border border-charcoal/20 dark:border-white/10 bg-white dark:bg-graphite text-charcoal dark:text-white focus:outline-none focus:ring-2 focus:ring-teal dark:focus:ring-gold"
          >
            {moods.map((mood) => (
              <option key={mood} value={mood} className="capitalize">
                {mood.charAt(0).toUpperCase() + mood.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tag-input" className="block text-sm font-heading font-semibold text-charcoal dark:text-white mb-2">
            Tags (optional)
          </label>
          <div className="flex gap-2 mb-3">
            <input
              id="tag-input"
              type="text"
              placeholder="Add a tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1 px-4 py-3 rounded-lg border border-charcoal/20 dark:border-white/10 bg-white dark:bg-graphite text-charcoal dark:text-white placeholder-charcoal/50 dark:placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-teal dark:focus:ring-gold"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-3 bg-teal dark:bg-gold text-white dark:text-midnight rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-teal/10 dark:bg-gold/10 text-teal dark:text-gold rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:opacity-70"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Images */}
        <div onPaste={handlePaste}>
          <label className="block text-sm font-heading font-semibold text-charcoal dark:text-white mb-2">
            Photos (optional)
          </label>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="mb-3 flex flex-col items-center justify-center gap-3 px-4 py-6 border-2 border-dashed border-charcoal/20 dark:border-white/20 rounded-lg text-charcoal/70 dark:text-white/70 bg-white/40 dark:bg-midnight/40"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <div className="flex items-center gap-2 text-charcoal dark:text-white font-semibold">
              <Upload className="w-5 h-5" />
              Drag & drop images or
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-teal dark:text-gold underline font-bold"
              >
                browse files
              </button>
            </div>
            <p className="text-xs text-charcoal/60 dark:text-white/60 text-center">
              Tip: You can also paste images from clipboard
            </p>
            <div className="flex flex-wrap gap-2 text-xs text-charcoal/50 dark:text-white/50 justify-center">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-charcoal/5 dark:bg-white/5 rounded-full">
                <ImagePlus className="w-4 h-4" /> JPG/PNG up to ~200KB (auto-compressed)
              </span>
            </div>
            {uploading && (
              <div className="text-sm text-teal dark:text-gold font-semibold">Uploading...</div>
            )}
            {uploadError && (
              <div className="text-sm text-red-600 dark:text-red-300">{uploadError}</div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddImageUrl}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 border border-charcoal/20 dark:border-white/20 rounded-lg text-teal dark:text-gold hover:border-teal dark:hover:border-gold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Photo by URL
          </button>

          {formData.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Memory photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-teal to-teal/80 dark:from-gold dark:to-gold/80 text-white dark:text-midnight rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Memory...' : 'Create Memory'}
          </button>
          <Link
            href={personId ? `/app/people/${personId}` : '/app/people'}
            className="px-6 py-3 border-2 border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-lg font-bold hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
