import {
  CheckSquare,
  Clock,
  PieChart,
  Users,
  Repeat,
  Zap,
  type LucideIcon,
} from "lucide-react"

function getServiceIcon(serviceId: number): LucideIcon {
  const icons: LucideIcon[] = [Clock, CheckSquare, PieChart, Users, Repeat, Zap]
  return icons[(Math.max(0, serviceId - 1)) % icons.length]
}

export function ServicesCard({ service, openModal }: any) {
  const Icon = getServiceIcon(service.id)

  // ✅ Portada = primera imagen
  const coverImage = service.images?.[0] ?? ""

  const handleOpen = () => {
    // ✅ Pasamos el objeto completo (más limpio y preparado para múltiples imágenes)
    openModal(service)
  }

  return (
    <article
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleOpen()
        }
      }}
      className="
        group
        relative
        flex
        h-full
        flex-col
        overflow-hidden
        rounded-3xl
        border
        border-gray-200
        bg-white
        shadow-sm
        transition-all
        duration-700
        ease-out
        hover:-translate-y-2
        hover:shadow-lg
      "
    >
      {/* Línea superior reactiva */}
      <div
        className="
          h-px
          w-full
          bg-gradient-to-r
          from-transparent
          via-[#D9E2B6]
          to-transparent
          transition-all
          duration-500
          ease-out
          group-hover:h-[3px]
          group-hover:via-[#8FAF3C]
        "
      />

      <div className="flex h-full flex-col p-8">
        {/* Icono */}
        <div
          className="
            mb-6
            inline-flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            bg-gray-100
            transition-colors
            duration-500
            ease-out
            group-hover:bg-[#F5F7EC]
          "
        >
          <Icon className="h-5 w-5 text-[#6F8C1F]" />
        </div>

        {/* Título */}
        <h3 className="text-2xl font-semibold text-[#2E321B]">
          {service.title}
        </h3>

        {/* Descripción */}
        <p className="mt-4 text-base leading-relaxed text-gray-600 whitespace-pre-wrap">
          {service.cardDescription}
        </p>

        {/* CTA */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleOpen()
          }}
          className="
            mt-6
            w-fit
            text-sm
            font-medium
            text-[#6F8C1F]
            transition-colors
            duration-300
            hover:underline
          "
        >
          Más información →
        </button>

        {/* Imagen inferior */}
        <div className="mt-10 overflow-hidden rounded-2xl bg-gray-100">
          {coverImage ? (
            <img
              src={coverImage}
              alt={service.title}
              className="h-44 w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-44 w-full bg-gray-200" />
          )}
        </div>
      </div>
    </article>
  )
}