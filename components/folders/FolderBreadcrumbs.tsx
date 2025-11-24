'use client'

import Link from 'next/link'
import { Home, ChevronRight } from 'lucide-react'
import { useFolderTree, Folder } from '@/lib/hooks/useFolderTree'

interface FolderBreadcrumbsProps {
  folderId: string
  className?: string
}

export default function FolderBreadcrumbs({
  folderId,
  className = ''
}: FolderBreadcrumbsProps) {
  const { getFolderPath } = useFolderTree()
  const path = getFolderPath(folderId)

  if (path.length === 0) {
    return null
  }

  return (
    <nav className={`flex items-center gap-2 text-sm ${className}`}>
      {/* Home Link */}
      <Link
        href="/app"
        className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Home</span>
      </Link>

      {/* Folder Path */}
      {path.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-600" />
          
          <Link
            href={`/app/folder/${folder.id}`}
            className={`
              flex items-center gap-1.5 transition-colors
              ${index === path.length - 1
                ? 'text-gray-900 dark:text-gray-100 font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary'
              }
            `}
          >
            <span className="text-base" style={{ color: folder.color }}>
              {folder.icon}
            </span>
            <span>{folder.name}</span>
          </Link>
        </div>
      ))}
    </nav>
  )
}
