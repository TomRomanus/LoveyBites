export interface DetectedTimer {
  displayTime: string
  durationSecs: number
}

type Pattern = {
  regex: RegExp
  toSecs: (m: RegExpMatchArray) => number
  display: (m: RegExpMatchArray) => string
}

type MatchResult = {
  start: number
  end: number
  displayTime: string
  durationSecs: number
}

const avg = (a: number, b: number) => Math.round((a + b) / 2)

const PATTERNS: Pattern[] = [
  // Ranges must come before singles so they consume the full "N-M unit" span first.

  // Dutch ranges
  {
    regex: /(\d+)\s*[-–—]\s*(\d+)\s+uur/gi,
    toSecs: m => avg(parseInt(m[1]), parseInt(m[2])) * 3600,
    display: m => `${avg(parseInt(m[1]), parseInt(m[2]))} uur`,
  },
  {
    regex: /(\d+)\s+tot\s+(\d+)\s+uur/gi,
    toSecs: m => avg(parseInt(m[1]), parseInt(m[2])) * 3600,
    display: m => `${avg(parseInt(m[1]), parseInt(m[2]))} uur`,
  },
  {
    regex: /(\d+)\s*[-–—]\s*(\d+)\s+minuten?/gi,
    toSecs: m => avg(parseInt(m[1]), parseInt(m[2])) * 60,
    display: m => `${avg(parseInt(m[1]), parseInt(m[2]))} min`,
  },
  {
    regex: /(\d+)\s+tot\s+(\d+)\s+minuten?/gi,
    toSecs: m => avg(parseInt(m[1]), parseInt(m[2])) * 60,
    display: m => `${avg(parseInt(m[1]), parseInt(m[2]))} min`,
  },
  {
    regex: /(\d+)\s*[-–—]\s*(\d+)\s+seconden?/gi,
    toSecs: m => avg(parseInt(m[1]), parseInt(m[2])),
    display: m => `${avg(parseInt(m[1]), parseInt(m[2]))} sec`,
  },
  {
    regex: /(\d+)\s+tot\s+(\d+)\s+seconden?/gi,
    toSecs: m => avg(parseInt(m[1]), parseInt(m[2])),
    display: m => `${avg(parseInt(m[1]), parseInt(m[2]))} sec`,
  },

  // English ranges
  {
    regex: /(\d+)\s*[-–—]\s*(\d+)\s+hours?/gi,
    toSecs: m => avg(parseInt(m[1]), parseInt(m[2])) * 3600,
    display: m => `${avg(parseInt(m[1]), parseInt(m[2]))} hr`,
  },
  {
    regex: /(\d+)\s+to\s+(\d+)\s+hours?/gi,
    toSecs: m => avg(parseInt(m[1]), parseInt(m[2])) * 3600,
    display: m => `${avg(parseInt(m[1]), parseInt(m[2]))} hr`,
  },
  {
    regex: /(\d+)\s*[-–—]\s*(\d+)\s+minutes?/gi,
    toSecs: m => avg(parseInt(m[1]), parseInt(m[2])) * 60,
    display: m => `${avg(parseInt(m[1]), parseInt(m[2]))} min`,
  },
  {
    regex: /(\d+)\s+to\s+(\d+)\s+minutes?/gi,
    toSecs: m => avg(parseInt(m[1]), parseInt(m[2])) * 60,
    display: m => `${avg(parseInt(m[1]), parseInt(m[2]))} min`,
  },
  {
    regex: /(\d+)\s*[-–—]\s*(\d+)\s+seconds?/gi,
    toSecs: m => avg(parseInt(m[1]), parseInt(m[2])),
    display: m => `${avg(parseInt(m[1]), parseInt(m[2]))} sec`,
  },
  {
    regex: /(\d+)\s+to\s+(\d+)\s+seconds?/gi,
    toSecs: m => avg(parseInt(m[1]), parseInt(m[2])),
    display: m => `${avg(parseInt(m[1]), parseInt(m[2]))} sec`,
  },

  // Dutch singles
  {
    regex: /een\s+half\s+uur/gi,
    toSecs: () => 1800,
    display: () => '30 min',
  },
  {
    regex: /anderhalf\s+uur/gi,
    toSecs: () => 5400,
    display: () => '1½ uur',
  },
  {
    regex: /(\d+(?:[.,]\d+)?)\s+uur/gi,
    toSecs: m => Math.round(parseFloat(m[1].replace(',', '.')) * 3600),
    display: m => `${m[1]} uur`,
  },
  {
    regex: /(\d+)\s+minuten?/gi,
    toSecs: m => parseInt(m[1]) * 60,
    display: m => `${m[1]} min`,
  },
  {
    regex: /(\d+)\s+seconden?/gi,
    toSecs: m => parseInt(m[1]),
    display: m => `${m[1]} sec`,
  },

  // English singles
  {
    regex: /half\s+an?\s+hour/gi,
    toSecs: () => 1800,
    display: () => '30 min',
  },
  {
    regex: /an?\s+hour\s+and\s+a\s+half/gi,
    toSecs: () => 5400,
    display: () => '1½ hr',
  },
  {
    regex: /(\d+(?:[.,]\d+)?)\s+hours?/gi,
    toSecs: m => Math.round(parseFloat(m[1].replace(',', '.')) * 3600),
    display: m => `${m[1]} hr`,
  },
  {
    regex: /(\d+)\s+minutes?/gi,
    toSecs: m => parseInt(m[1]) * 60,
    display: m => `${m[1]} min`,
  },
  {
    regex: /(\d+)\s+seconds?/gi,
    toSecs: m => parseInt(m[1]),
    display: m => `${m[1]} sec`,
  },
]

export function detectTimers(text: string): DetectedTimer[] {
  const allMatches: MatchResult[] = []
  for (const { regex, toSecs, display } of PATTERNS) {
    const re = new RegExp(regex.source, regex.flags)
    let match: RegExpMatchArray | null
    while ((match = re.exec(text)) !== null) {
      allMatches.push({
        start: match.index!,
        end: match.index! + match[0].length,
        displayTime: display(match),
        durationSecs: toSecs(match),
      })
    }
  }
  // Sort by start position; wider matches win when positions tie.
  allMatches.sort((a, b) => a.start - b.start || b.end - a.end)
  const results: DetectedTimer[] = []
  let consumed = -1
  for (const { start, end, displayTime, durationSecs } of allMatches) {
    if (start >= consumed) {
      results.push({ displayTime, durationSecs })
      consumed = end
    }
  }
  return results
}
