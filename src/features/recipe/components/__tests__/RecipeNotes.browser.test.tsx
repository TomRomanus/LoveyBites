import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import RecipeNotes from '../detail/RecipeNotes'

describe('RecipeNotes', () => {
  it('note text element has whitespace-pre-wrap so line breaks are preserved', () => {
    const { container } = render(
      <RecipeNotes
        notes={[{ label: 'Bewaren', text: 'Eerste lijn.\nTweede lijn.' }]}
        deel="I"
      />,
    )
    const textEl = container.querySelector('.whitespace-pre-wrap')
    expect(textEl).not.toBeNull()
    expect(textEl?.textContent).toBe('Eerste lijn.\nTweede lijn.')
  })
})
