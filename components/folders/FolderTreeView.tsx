'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronDown, Folder, Pin } from 'lucide-react'
import { FolderNode } from '@/lib/hooks/useFolderTree'

interface FolderTreeNodeProps {
  node: FolderNode
  selectedId?: string
  onSelect?: (folderId: string) => void
  onToggleExpanded?: (folderId: string) => void
}

export function FolderTreeNode({
  node,
  selectedId,
  onSelect,
  onToggleExpanded
}: FolderTreeNodeProps) {
  const isSelected = selectedId === node.id
  const hasChildren = node.children.length > 0
  const [localExpanded, setLocalExpanded] = useState(node.is_expanded)

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLocalExpanded(!localExpanded)
    onToggleExpanded?.(node.id)
  }

  const handleSelect = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault()
      onSelect(node.id)
    }
  }

  return (
    <div className="folder-tree-node">
      <Link
        href={`/app/folder/${node.id}`}
        onClick={handleSelect}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm
          transition-colors group relative
          ${isSelected
            ? 'bg-primary/10 text-primary dark:bg-primary/20'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
          }
        `}
        style={{ paddingLeft: `${node.level * 16 + 12}px` }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren && (
          <button
            onClick={handleToggle}
            className="flex-shrink-0 hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-0.5 transition-colors"
          >
            {localExpanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* Spacer for folders without children */}
        {!hasChildren && <span className="w-4" />}

        {/* Folder Icon */}
        <span 
          className="flex-shrink-0 text-lg" 
          style={{ color: node.color }}
        >
          {node.icon}
        </span>

        {/* Folder Name */}
        <span className="flex-1 truncate font-medium">
          {node.name}
        </span>

        {/* Pin Indicator */}
        {node.is_pinned && (
          <Pin className="w-3 h-3 flex-shrink-0 text-yellow-500" />
        )}

        {/* Entry Count */}
        {node.entry_count > 0 && (
          <span className={`
            flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full
            ${isSelected
              ? 'bg-primary/20 text-primary-dark'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }
          `}>
            {node.entry_count}
          </span>
        )}
      </Link>

      {/* Children */}
      {hasChildren && localExpanded && (
        <div className="folder-children">
          {node.children.map(child => (
            <FolderTreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface FolderTreeViewProps {
  folders: FolderNode[]
  selectedId?: string
  onSelect?: (folderId: string) => void
  onToggleExpanded?: (folderId: string) => void
  className?: string
}

export default function FolderTreeView({
  folders,
  selectedId,
  onSelect,
  onToggleExpanded,
  className = ''
}: FolderTreeViewProps) {
  if (folders.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <Folder className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No folders yet</p>
        <p className="text-xs mt-1">Create your first folder to organize entries</p>
      </div>
    )
  }

  return (
    <div className={`folder-tree-view ${className}`}>
      {folders.map(node => (
        <FolderTreeNode
          key={node.id}
          node={node}
          selectedId={selectedId}
          onSelect={onSelect}
          onToggleExpanded={onToggleExpanded}
        />
      ))}
    </div>
  )
}
