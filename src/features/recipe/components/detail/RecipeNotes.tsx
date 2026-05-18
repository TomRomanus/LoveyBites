import type { RecipeNote } from '@/features/recipe/types/recipe'
import SectionHeader from '@/shared/components/SectionHeader'

type RecipeNotesProps = {
  notes: RecipeNote[]
  deel: string
}

const RecipeNotes = ({ notes, deel }: RecipeNotesProps) => (
  <div className="px-[22px] pt-7">
    <SectionHeader eyebrow={`DEEL ${deel}`} title="Notities" />
    <div className="flex flex-col gap-[10px]">
      {notes.map((note, i) => (
        <div key={i} className="flex gap-[9px] items-stretch">
          <div
            data-note-bar
            className="w-[2px] rounded-[2px] shrink-0"
            style={{ background: 'var(--bordeaux)', opacity: 0.35 }}
          />
          <div>
            <div className="font-mono text-[9px] font-medium tracking-[0.14em] uppercase text-bordeaux mb-[2px]">
              {note.label}
            </div>
            <div className="text-[13.5px] leading-[1.55] text-ink-2 whitespace-pre-wrap">{note.text}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
)

export default RecipeNotes
