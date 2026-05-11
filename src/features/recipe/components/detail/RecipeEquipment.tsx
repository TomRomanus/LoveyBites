import SectionHeader from '@/shared/components/SectionHeader'

type RecipeEquipmentProps = {
  equipment: string[]
  deel: string
}

const RecipeEquipment = ({ equipment, deel }: RecipeEquipmentProps) => (
  <div className="px-[22px] pt-7">
    <SectionHeader eyebrow={`DEEL ${deel}`} title="Benodigdheden" />
    <div className="flex flex-col gap-[6px]">
      {equipment.map((item, i) => (
        <div key={i} className="flex items-center gap-[10px]">
          <div
            className="w-[3px] h-[3px] rounded-full shrink-0"
            style={{ background: 'var(--bordeaux)' }}
          />
          <div className="text-[15px] text-ink leading-[1.55]">{item}</div>
        </div>
      ))}
    </div>
  </div>
)

export default RecipeEquipment
