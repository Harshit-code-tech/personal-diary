'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Calendar, MapPin, Tag, Image as ImageIcon } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';

interface Memory {
  id: string;
  title: string;
  description: string | null;
  memory_date: string;
  location: string | null;
  mood: string | null;
  tags: string[] | null;
  images: string[] | null;
  person_id: string;
  created_at: string;
  updated_at: string;
}

interface Person {
  id: string;
  name: string;
}

export default function MemoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [memory, setMemory] = useState<Memory | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        setLoading(true);
        const id = params?.id as string;

        const { data: memoryData, error: memoryError } = await supabase
          .from('memories')
          .select('*')
          .eq('id', id)
          .single();

        if (memoryError) throw memoryError;
        setMemory(memoryData as Memory);

        if (memoryData?.person_id) {
          const { data: personData } = await supabase
            .from('people')
            .select('id, name')
            .eq('id', memoryData.person_id)
            .single();
          if (personData) setPerson(personData as Person);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemory();
  }, [params?.id, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12 text-charcoal/60 dark:text-white/60">Loading memory...</div>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12 text-charcoal/60 dark:text-white/60">Memory not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5E6] via-[#FFF9F0] to-[#FFE6CC] dark:from-midnight dark:via-charcoal dark:to-graphite">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-teal dark:text-gold hover:opacity-75 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          {person && (
            <Link
              href={`/app/people/${person.id}`}
              className="text-sm text-charcoal/70 dark:text-white/70 hover:text-teal dark:hover:text-gold"
            >
              View {person.name}
            </Link>
          )}
        </div>

        <div className="bg-white dark:bg-graphite rounded-2xl shadow-lg border border-charcoal/10 dark:border-white/10 p-6 sm:p-8">
          <div className="flex flex-col gap-4 mb-6">
            <div className="text-sm text-charcoal/60 dark:text-white/60 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(memory.memory_date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {memory.location && (
                <span className="flex items-center gap-2">
                  <span className="text-charcoal/30 dark:text-white/30">•</span>
                  <MapPin className="w-4 h-4" />
                  {memory.location}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-charcoal dark:text-white">{memory.title}</h1>
            {memory.mood && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal/10 dark:bg-gold/10 text-teal dark:text-gold rounded-full w-fit text-sm font-semibold">
                Mood: {memory.mood}
              </div>
            )}
          </div>

          {memory.description && (
            <p className="text-base leading-relaxed text-charcoal/80 dark:text-white/80 mb-6 whitespace-pre-wrap">
              {memory.description}
            </p>
          )}

          {memory.tags && memory.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {memory.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-charcoal/5 dark:bg-white/10 text-charcoal dark:text-white rounded-full text-sm"
                >
                  <Tag className="w-4 h-4" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {memory.images && memory.images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-charcoal/60 dark:text-white/60">
                <ImageIcon className="w-4 h-4" /> Photos
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {memory.images.map((image, idx) => (
                  <div key={idx} className="overflow-hidden rounded-lg border border-charcoal/10 dark:border-white/10">
                    <img src={image} alt={`Memory photo ${idx + 1}`} className="w-full h-64 object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="text-xs text-charcoal/60 dark:text-white/60">Saved image links</div>
                <div className="flex flex-col gap-2">
                  {memory.images.map((image, idx) => (
                    <a
                      key={`link-${idx}`}
                      href={image}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate px-3 py-2 rounded-md bg-charcoal/5 dark:bg-white/10 text-sm text-teal dark:text-gold hover:underline"
                    >
                      {image}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
