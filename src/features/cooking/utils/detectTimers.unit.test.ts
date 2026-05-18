import { describe, it, expect } from 'vitest'
import { detectTimers } from './detectTimers'

describe('detectTimers', () => {
  describe('Dutch singles', () => {
    it('detects minuten', () => {
      expect(detectTimers('kook 20 minuten')).toEqual([
        { displayTime: '20 min', durationSecs: 1200 },
      ])
    })

    it('detects uur', () => {
      expect(detectTimers('sudder 2 uur')).toEqual([
        { displayTime: '2 uur', durationSecs: 7200 },
      ])
    })

    it('detects seconden', () => {
      expect(detectTimers('roer 30 seconden')).toEqual([
        { displayTime: '30 sec', durationSecs: 30 },
      ])
    })

    it('detects een half uur', () => {
      expect(detectTimers('laat een half uur rusten')).toEqual([
        { displayTime: '30 min', durationSecs: 1800 },
      ])
    })

    it('detects anderhalf uur', () => {
      expect(detectTimers('stoof anderhalf uur')).toEqual([
        { displayTime: '1½ uur', durationSecs: 5400 },
      ])
    })
  })

  describe('Dutch ranges', () => {
    it('detects dash range and averages minuten', () => {
      expect(detectTimers('kook 13-15 minuten')).toEqual([
        { displayTime: '14 min', durationSecs: 840 },
      ])
    })

    it('detects tot range and averages minuten', () => {
      expect(detectTimers('bak 10 tot 14 minuten')).toEqual([
        { displayTime: '12 min', durationSecs: 720 },
      ])
    })

    it('detects spaced dash range (13 - 15 minuten)', () => {
      expect(detectTimers('kook 13 - 15 minuten')).toEqual([
        { displayTime: '14 min', durationSecs: 840 },
      ])
    })

    it('does not produce a second match from the upper bound of a range', () => {
      expect(detectTimers('kook 13-15 minuten')).toHaveLength(1)
    })
  })

  describe('English singles', () => {
    it('detects minutes', () => {
      expect(detectTimers('cook for 20 minutes')).toEqual([
        { displayTime: '20 min', durationSecs: 1200 },
      ])
    })

    it('detects minute (singular)', () => {
      expect(detectTimers('rest for 1 minute')).toEqual([
        { displayTime: '1 min', durationSecs: 60 },
      ])
    })

    it('detects seconds', () => {
      expect(detectTimers('stir for 30 seconds')).toEqual([
        { displayTime: '30 sec', durationSecs: 30 },
      ])
    })

    it('detects hours', () => {
      expect(detectTimers('bake for 2 hours')).toEqual([
        { displayTime: '2 hr', durationSecs: 7200 },
      ])
    })

    it('detects half an hour', () => {
      expect(detectTimers('rest for half an hour')).toEqual([
        { displayTime: '30 min', durationSecs: 1800 },
      ])
    })

    it('detects an hour and a half', () => {
      expect(detectTimers('simmer for an hour and a half')).toEqual([
        { displayTime: '1½ hr', durationSecs: 5400 },
      ])
    })
  })

  describe('English ranges', () => {
    it('detects dash range and averages minutes', () => {
      expect(detectTimers('bake for 13-15 minutes')).toEqual([
        { displayTime: '14 min', durationSecs: 840 },
      ])
    })

    it('detects "to" range and averages minutes', () => {
      expect(detectTimers('cook for 10 to 12 minutes')).toEqual([
        { displayTime: '11 min', durationSecs: 660 },
      ])
    })

    it('detects "to" range for seconds', () => {
      expect(detectTimers('blend for 30 to 45 seconds')).toEqual([
        { displayTime: '38 sec', durationSecs: 38 },
      ])
    })

    it('does not produce a second match from the upper bound of a range', () => {
      expect(detectTimers('bake for 13-15 minutes')).toHaveLength(1)
    })
  })

  describe('mixed text', () => {
    it('detects multiple times in one Dutch text', () => {
      const result = detectTimers('kook 10 minuten, roer daarna 30 seconden')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ displayTime: '10 min', durationSecs: 600 })
      expect(result[1]).toEqual({ displayTime: '30 sec', durationSecs: 30 })
    })

    it('detects multiple times in one English text', () => {
      const result = detectTimers('bake for 20 minutes, then rest for 5 minutes')
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({ displayTime: '20 min', durationSecs: 1200 })
      expect(result[1]).toEqual({ displayTime: '5 min', durationSecs: 300 })
    })

    it('returns empty for text without times', () => {
      expect(detectTimers('voeg zout toe en roer goed door')).toEqual([])
    })
  })
})
