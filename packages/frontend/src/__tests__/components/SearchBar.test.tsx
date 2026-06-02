import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { SearchBar } from '../../components/SearchBar'

describe('SearchBar', () => {
  it('calls onSearch with trimmed username on submit', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} isLoading={false} />)
    fireEvent.change(screen.getByPlaceholderText('Enter GitHub username...'), { target: { value: '  torvalds  ' } })
    fireEvent.click(screen.getByRole('button', { name: /search/i }))
    expect(onSearch).toHaveBeenCalledWith('torvalds')
  })

  it('disables submit button while loading', () => {
    render(<SearchBar onSearch={vi.fn()} isLoading={true} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('disables submit button when input is empty', () => {
    render(<SearchBar onSearch={vi.fn()} isLoading={false} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('does not call onSearch on empty submit', () => {
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} isLoading={false} />)
    fireEvent.submit(screen.getByRole('form'))
    expect(onSearch).not.toHaveBeenCalled()
  })
})
