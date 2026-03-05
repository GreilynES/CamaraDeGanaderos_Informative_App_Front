import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Calendar, X } from "lucide-react"
import { CardContent } from "@/components/ui/card"
import { formatDateToWords } from "@/shared/utils/formatDate"
import { Button } from "@/components/ui/button"

type Props = {
  event: any
  onModalChange?: (open: boolean) => void
  }

export function EventCard({ event, onModalChange }: Props) {
  const [showModal, setShowModal] = useState(false)

  // ✅ avisar al padre cuando abre/cierra (para pausar/reanudar autoplay)
  useEffect(() => {
    onModalChange?.(showModal)
  }, [showModal, onModalChange])

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (!showModal) return

    const originalOverflow = document.body.style.overflow
    const originalPosition = document.body.style.position
    const scrollY = window.scrollY

    document.body.style.overflow = "hidden"
    document.body.style.position = "fixed"
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = "100%"

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.position = originalPosition
      document.body.style.top = ""
      document.body.style.width = ""
      window.scrollTo(0, scrollY)
    }
  }, [showModal])

  const modalContent = showModal ? (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[99999]"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del modal */}
        <div className="relative bg-gradient-to-br from-[#F2F7D8] to-[#DDE9BB] h-48 sm:h-56 md:h-64">
          <img
            src={event.illustration || "/placeholder.svg"}
            alt={event.title}
            className="object-cover w-full h-full opacity-70"
          />
          <button
            onClick={() => setShowModal(false)}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6 text-[#2E321B]" />
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="p-6 sm:p-8">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#F2F7D8] rounded-lg border border-[#DDE9BB] w-fit">
            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#6F8C1F] flex-shrink-0" />
            <p className="font-semibold text-xs text-[#6F8C1F]">
              {formatDateToWords(event.date)}
            </p>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#2E321B] mb-4 sm:mb-6 leading-tight">
            {event.title}
          </h3>

          <div className="prose max-w-none">
            <p className="text-[#2E321B] text-base sm:text-lg leading-relaxed break-words whitespace-normal">
              {event.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <div className="overflow-hidden relative rounded-xl shadow-lg h-full">
        <div className="grid lg:grid-cols-2 gap-0 h-full">
          {/* Image Section */}
          <div className="relative h-48 sm:h-56 md:h-64 lg:h-full bg-gradient-to-br from-[#F2F7D8] to-[#DDE9BB] flex-shrink-0">
            <img
              src={event.illustration || "/placeholder.svg"}
              alt={event.title}
              className="object-cover w-full h-full "
            />
          </div>

          {/* Content Section */}
          <CardContent className="p-4 sm:p-5 md:p-6 lg:p-7 flex flex-col justify-between bg-white/95 backdrop-blur-sm min-h-[240px] sm:min-h-[260px] md:min-h-[280px]">
            <div className="space-y-2 sm:space-y-3 flex-grow">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-[#F2F7D8] rounded-lg border border-[#DDE9BB] w-fit">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#6F8C1F] flex-shrink-0" />
                <p className="font-semibold text-xs text-[#6F8C1F]">
                  {formatDateToWords(event.date)}
                </p>
              </div>

              <h3 className="text-base sm:text-lg md:text-xl lg:text-1xl font-bold text-[#2E321B] leading-tight text-balance tracking-tight line-clamp-2">
                {event.title}
              </h3>

              <p
                className="
                  text-[#2E321B]/65
                  text-[10px] sm:text-[11px] md:text-xs
                  leading-tight
                  line-clamp-5
                  text-pretty
                "
              >
                {event.description}
              </p>
            </div>

            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#DDE9BB] flex-shrink-0">
              <Button
                onClick={() => setShowModal(true)}
                className="
                  w-full
                  bg-gradient-to-r from-[#6F8C1F] to-[#5A7319]
                  hover:from-[#5A7319] hover:to-[#4A5F15]
                  text-white font-semibold shadow-lg hover:shadow-xl
                  transition-all duration-200 group
                  px-4 sm:px-5
                  py-2.5 sm:py-3
                  text-xs sm:text-sm
                  rounded-md
                "
              >
                Ver más detalles 
              </Button>
            </div>
          </CardContent>
        </div>
      </div>

      {/* Modal renderizado con portal */}
      {showModal && createPortal(modalContent, document.body)}
    </>
  )
}