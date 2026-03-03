import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import type { Service } from "../models/ServicesType"

interface ServicesModalProps {
  content: Service
  onClose: () => void
}

export function ServicesModal({ content, onClose }: ServicesModalProps) {
  const images = useMemo(() => content.images ?? [], [content.images])
  const [idx, setIdx] = useState(0)

  useEffect(() => setIdx(0), [content.id]) // ✅ reset al abrir otro servicio

  useEffect(() => {
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
  }, [])

  const hasMany = images.length > 1
  const current = images[idx] ?? ""

  const prev = () => setIdx((v) => (v - 1 + images.length) % images.length)
  const next = () => setIdx((v) => (v + 1) % images.length)

  // teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (!hasMany) return
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [hasMany, images.length])

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con carrusel */}
        {current && (
          <div className="relative h-64 w-full overflow-hidden rounded-t-2xl bg-gray-200">
            <img src={current} alt={content.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

            {hasMany && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="w-6 h-6 text-[#2E321B]" />
                </button>

                <button
                  type="button"
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="w-6 h-6 text-[#2E321B]" />
                </button>

                {/* contador */}
                <div className="absolute bottom-3 right-4 text-xs text-white/90 bg-black/40 px-2 py-1 rounded-full">
                  {idx + 1}/{images.length}
                </div>
              </>
            )}
          </div>
        )}

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-200 z-10"
          aria-label="Cerrar modal"
        >
          <X className="w-6 h-6 text-[#2E321B]" />
        </button>

        {/* Contenido */}
        <div className="p-8">
          <h2 className="text-3xl font-bold text-[#2E321B] mb-6">{content.title}</h2>

          <p className="text-[#2E321B] leading-relaxed whitespace-pre-wrap">
            {content.modalDescription}
          </p>

          {/* thumbnails opcional */}
          {hasMany && (
            <div className="mt-6 grid grid-cols-4 sm:grid-cols-6 gap-2">
              {images.map((u, i) => (
                <button
                  key={`${u}-${i}`}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`h-14 rounded-lg overflow-hidden border ${i === idx ? "border-[#6F8C1F]" : "border-transparent"}`}
                  aria-label={`Ver imagen ${i + 1}`}
                >
                  <img src={u} className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}