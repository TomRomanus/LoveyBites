import { describe, it, expect } from 'vitest'
import { formatCookTime } from './formatCookTime'

describe('formatCookTime', () => {
  it('formats 0 seconds as 0:00', () => {
    expect(formatCookTime(0)).toBe('0:00')
  })

  it('formats seconds under a minute', () => {
    expect(formatCookTime(45)).toBe('0:45')
  })

  it('pads single-digit seconds with a leading zero', () => {
    expect(formatCookTime(65)).toBe('1:05')
  })

  it('formats an exact number of minutes', () => {
    expect(formatCookTime(600)).toBe('10:00')
  })

  it('formats the maximum minute-only value (59:59)', () => {
    expect(formatCookTime(3599)).toBe('59:59')
  })

  it('switches to h:mm:ss format at exactly one hour', () => {
    expect(formatCookTime(3600)).toBe('1:00:00')
  })

  it('pads minutes and seconds in h:mm:ss format', () => {
    expect(formatCookTime(3661)).toBe('1:01:01')
  })

  it('handles multiple hours', () => {
    expect(formatCookTime(7322)).toBe('2:02:02')
  })
})
