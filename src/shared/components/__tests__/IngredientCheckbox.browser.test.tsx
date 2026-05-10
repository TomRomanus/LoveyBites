import { render } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import IngredientCheckbox from '../IngredientCheckbox'

describe('IngredientCheckbox', () => {
  beforeEach(() => vi.clearAllMocks())

  it('renders without crashing when unchecked', () => {
    render(<IngredientCheckbox checked={false} />)
    expect(document.querySelector('span')).toBeInTheDocument()
  })

  it('renders without crashing when checked', () => {
    render(<IngredientCheckbox checked={true} />)
    expect(document.querySelector('span')).toBeInTheDocument()
  })

  it('renders the SVG checkmark', () => {
    render(<IngredientCheckbox checked={false} />)
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('renders without crashing with light theme', () => {
    render(<IngredientCheckbox checked={false} theme="light" />)
    expect(document.querySelector('span')).toBeInTheDocument()
  })

  it('renders without crashing with dark theme', () => {
    render(<IngredientCheckbox checked={true} theme="dark" />)
    expect(document.querySelector('span')).toBeInTheDocument()
  })
})
