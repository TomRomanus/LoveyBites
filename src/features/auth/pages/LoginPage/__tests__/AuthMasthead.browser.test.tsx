import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AuthMasthead from '../AuthMasthead'

const NL_DAYS = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag']
const NL_MONTHS = [
  'januari',
  'februari',
  'maart',
  'april',
  'mei',
  'juni',
  'juli',
  'augustus',
  'september',
  'oktober',
  'november',
  'december',
]

describe('AuthMasthead', () => {
  it('renders the LoveyBites brand name', () => {
    render(<AuthMasthead />)
    expect(screen.getByText('Lovey')).toBeInTheDocument()
    expect(screen.getByText('Bites')).toBeInTheDocument()
  })

  it('renders the SINDS 2026 eyebrow', () => {
    render(<AuthMasthead />)
    expect(screen.getByText('SINDS 2026')).toBeInTheDocument()
  })

  it('renders the Smakelijk subheading', () => {
    render(<AuthMasthead />)
    expect(screen.getByText('Smakelijk')).toBeInTheDocument()
  })

  it("renders today's date in Dutch", () => {
    render(<AuthMasthead />)
    const d = new Date()
    const expected = `${NL_DAYS[d.getDay()]} ${d.getDate()} ${NL_MONTHS[d.getMonth()]} ${d.getFullYear()}`
    expect(screen.getByText(expected)).toBeInTheDocument()
  })
})
