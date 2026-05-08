import { NL_DAYS_SHORT } from '../../shared/constants/locale'

export const formatEntryDate = (iso: string): string => {
  const d = new Date(iso + 'T00:00:00')
  const day = NL_DAYS_SHORT[d.getDay()].toUpperCase()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${day} ${dd}-${mm}`
}
