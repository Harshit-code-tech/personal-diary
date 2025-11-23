import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmptyState, { NoEntriesState } from '@/components/ui/EmptyState'

describe('EmptyState Component', () => {
  it('renders with title and description', () => {
    render(
      <EmptyState
        title="No data"
        description="There's nothing here yet"
      />
    )

    expect(screen.getByText('No data')).toBeInTheDocument()
    expect(screen.getByText("There's nothing here yet")).toBeInTheDocument()
  })

  it('renders action button when provided', () => {
    const handleClick = () => {}
    
    render(
      <EmptyState
        title="No entries"
        description="Start writing"
        action={{
          label: 'Create Entry',
          onClick: handleClick,
        }}
      />
    )

    expect(screen.getByRole('button', { name: 'Create Entry' })).toBeInTheDocument()
  })

  it('does not render button without action prop', () => {
    render(
      <EmptyState
        title="No data"
        description="Empty state"
      />
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('NoEntriesState Component', () => {
  it('renders with correct text', () => {
    const onCreateEntry = () => {}
    
    render(<NoEntriesState onCreateEntry={onCreateEntry} />)

    expect(screen.getByText('No entries yet')).toBeInTheDocument()
    expect(screen.getByText(/Start documenting your thoughts/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Write your first entry' })).toBeInTheDocument()
  })
})
