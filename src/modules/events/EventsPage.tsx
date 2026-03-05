import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { EventData } from "./models/EventType"
import { useEventsSubastaFirst } from "./hooks/useEvents"
import { EventCard } from "./components/EventCard"
import { Button } from "@/components/ui/button"
import { PageState } from "@/shared/ui/PageState"
import { ScrollReveal } from "@/shared/animations/Scroll"

function mod(n: number, m: number) {
  return ((n % m) + m) % m
}

const SIDE_DELAY = 0.2

const cardVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    y: 60,              // ⬅ entra desde abajo
    opacity: 0,
    scale: 0.75,
    rotateY: direction > 0 ? 25 : -25,
  }),

  center: {
    x: "0%",
    y: 0,               // ⬅ sube y se posiciona
    opacity: 1,
    scale: 1.15,
    rotateY: 0,
    zIndex: 10,
    transition: {
      duration: 0.75,   // ⬅ más suave
      ease: [0.32, 0.72, 0, 1] as const,
      opacity: { duration: 0.45 },
    },
  },

  left: {
    x: "-70%",
    y: 0,               // ⬅ sube y se posiciona
    scale: 0.7,
    opacity: 0.3,
    rotateY: 20,
    zIndex: 0,
    transition: {
      delay: SIDE_DELAY, // ⬅ +0.2s vs el centro
      duration: 0.75,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  },

  right: {
    x: "70%",
    y: 0,               // ⬅ sube y se posiciona
    scale: 0.7,
    opacity: 0.3,
    rotateY: -20,
    zIndex: 0,
    transition: {
      delay: SIDE_DELAY, // ⬅ +0.2s vs el centro
      duration: 0.75,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  },

  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    y: 40,              // ⬅ al salir baja un poquito (opcional)
    opacity: 0,
    scale: 0.75,
    rotateY: direction < 0 ? 25 : -25,
    transition: {
      duration: 0.6,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  }),
}


const ANIM_MS = 950
const AUTO_MS = 10000
const SWIPE_THRESHOLD = 50

export default function EventsPage() {
  const { events, isLoading } = useEventsSubastaFirst()

  const [rtEvents, setRtEvents] = useState<EventData[]>([])
  const seeded = useRef(false)

  const [page, setPage] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const isModalOpenRef = useRef(false)
  useEffect(() => {
    isModalOpenRef.current = isModalOpen
  }, [isModalOpen])

  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isAnimatingRef = useRef(false)
  useEffect(() => {
    isAnimatingRef.current = isAnimating
  }, [isAnimating])

  // Touch handling
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const carouselRef = useRef<HTMLDivElement>(null)


const total = rtEvents.length
const hasEvents = total > 0

const [showSwipeHint] = useState(true)

  useEffect(() => {
    if (!seeded.current && events.length > 0) {
      setRtEvents(events)
      setPage(0)
      seeded.current = true
      return
    }
    if (seeded.current) {
      setRtEvents(events)
      if (events.length === 0) setPage(0)
    }
  }, [events])

  const index = useMemo(() => (hasEvents ? mod(page, total) : 0), [page, total, hasEvents])
  const prevIndex = useMemo(() => (hasEvents ? mod(index - 1, total) : 0), [index, total, hasEvents])
  const nextIndex = useMemo(() => (hasEvents ? mod(index + 1, total) : 0), [index, total, hasEvents])

  const lockAnimation = useCallback(() => {
    setIsAnimating(true)
    if (animTimerRef.current) clearTimeout(animTimerRef.current)
    animTimerRef.current = setTimeout(() => {
      setIsAnimating(false)
    }, ANIM_MS)
  }, [])

  const stopAuto = useCallback(() => {
    if (autoTimerRef.current) {
      clearTimeout(autoTimerRef.current)
      autoTimerRef.current = null
    }
  }, [])

  const scheduleAuto = useCallback(() => {
    stopAuto()

    if (!hasEvents || total <= 1) return
    if (isModalOpenRef.current) return

    autoTimerRef.current = setTimeout(() => {
      if (!isModalOpenRef.current && !isAnimatingRef.current) {
        setDirection(1)
        lockAnimation()
        setPage((p) => p + 1)
      }
      scheduleAuto()
    }, AUTO_MS)
  }, [hasEvents, total, lockAnimation, stopAuto])

  const paginate = useCallback(
    (dir: -1 | 1) => {
      if (!hasEvents || isAnimatingRef.current) return
      
      stopAuto()
      
      setDirection(dir)
      lockAnimation()
      setPage((p) => p + dir)

      setTimeout(() => {
        if (!isModalOpenRef.current) {
          scheduleAuto()
        }
      }, ANIM_MS + 100)
    },
    [hasEvents, lockAnimation, stopAuto, scheduleAuto]
  )

  const goPrev = () => paginate(-1)
  const goNext = () => paginate(1)

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStartX.current || !touchEndX.current) return
    
    const diff = touchStartX.current - touchEndX.current
    const absDiff = Math.abs(diff)

    if (absDiff > SWIPE_THRESHOLD) {
      if (diff > 0) {
        // Swipe left -> next
        goNext()
      } else {
        // Swipe right -> prev
        goPrev()
      }
    }

    touchStartX.current = 0
    touchEndX.current = 0
  }, [goNext, goPrev])

  useEffect(() => {
    if (!hasEvents || total <= 1) {
      stopAuto()
      return
    }

    if (isModalOpen) {
      stopAuto()
      return
    }

    scheduleAuto()

    return () => stopAuto()
  }, [hasEvents, total, isModalOpen, scheduleAuto, stopAuto])

  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current)
      if (autoTimerRef.current) clearTimeout(autoTimerRef.current)
    }
  }, [])

  return (
    <div className="min-h-full justify-center text-[#1F3D2B] bg-gradient-to-b from-[#F5F7EC] via-[#DCECB8] to-[#9BAF6A]/70">
      <div className="relative min-h-full overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-24 py-8 md:py-10 lg:py-8">
          {/* HEADER SIEMPRE con animación */}
          <ScrollReveal duration={800} distance={30}>
            <div className="mx-auto max-w-3xl text-center mb-8 sm:mb-10 md:mb-12 lg:mb-0">
              <div className="mx-auto inline-flex items-center rounded-full border border-[#A7C4A0] bg-white/50 px-3 sm:px-3 py-1.5 sm:py-1.5 text-xs sm:text-sm font-medium text-[#1F3D2B] backdrop-blur-sm shadow-lg">
                <span className="relative flex h-2 w-2 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8FAE5A] opacity-60"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2F5F0B]"></span>
                </span>
                <span>Eventos presenciales</span>
              </div>

              <h2 className="mt-3 sm:mt-4 text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-semibold">
                <span className="text-4xl md:text-5xl font-semibold text-[#2E321B] text-center mb-4">
                  Próximos eventos
                </span>
              </h2>
              {hasEvents && total > 1 && (
                <p className="md:hidden mt-2 mb-0 text-center text-[12px] font-medium tracking-wide text-[#1F3D2B]/55">
                  Desliza para ver más eventos
                </p>
              )}
            </div>
          </ScrollReveal>

          <PageState
            isLoading={isLoading}
            isEmpty={!isLoading && !hasEvents}
            withContainer={false}
            emptyTitle="No hay eventos disponibles"
            emptyDescription="Cuando haya una subasta o evento, lo verás publicado aquí."
            className="min-h-[600px] sm:min-h-[640px]"
            skeleton={
              <div className="relative mt-4 sm:mt-6 md:mt-8 lg:mt-0 ">
                <div className="relative flex items-center justify-center px-3 sm:px-4 md:px-2">
                  <div className="relative w-full max-w-6xl lg:px-2">
                    <div className="relative h-[640px] sm:h-[680px] md:h-[700px] lg:h-[600px] flex items-center justify-center">
                      <Card className="w-[92%] sm:w-[86%] md:w-[75%] lg:w-[72%] p-6">
                        <Skeleton className="h-[340px] sm:h-[380px] w-full rounded-2xl" />
                        <div className="mt-5 space-y-3">
                          <Skeleton className="h-6 w-2/3" />
                          <Skeleton className="h-4 w-1/2" />
                          <Skeleton className="h-4 w-3/4" />
                        </div>
                      </Card>
                    </div>

                    <div className="mt-6 sm:mt-10 flex justify-center gap-2">
                      <Skeleton className="h-2.5 w-10 rounded-full" />
                      <Skeleton className="h-2.5 w-2.5 rounded-full" />
                      <Skeleton className="h-2.5 w-2.5 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            }
          >
            <div className="relative mt-4 sm:mt-6 md:mt-8 lg:mt-0 mx-8">
              {/* Carrusel con touch events - cards y dots juntos con animación */}
              <ScrollReveal duration={900} distance={50} delay={100}>
                <div className="relative flex items-start lg:items-center justify-center px-3 sm:px-2 md:px-0">
                  <div className="relative w-full max-w-6xl lg:px-24 sm:px-4">
                    <div 
                      ref={carouselRef}
                      className="relative min-h-[540px] sm:min-h-[580px] md:min-h-[600px] lg:min-h-[520px] flex items-center justify-center touch-pan-y"
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                    >
                      <AnimatePresence initial={false} custom={direction} mode="sync">
                        {/* Carta izquierda (solo desktop) */}
                        <motion.div
                          key={`left-${page - 1}`}
                          className="absolute hidden md:block w-[75%] md:w-[65%] lg:w-[60%] pointer-events-none"
                          variants={cardVariants}
                          initial="enter"
                          animate="left"
                          exit="exit"
                          custom={direction}
                          style={{ transformOrigin: "center center" }}
                        >
                          <div className="brightness-90 saturate-90 transition-all duration-300">
                            <EventCard event={rtEvents[prevIndex]} />
                          </div>
                        </motion.div>

                        {/* Carta central */}
                        <motion.div
                          key={`center-${page}`}
                          className="absolute w-[92%] sm:w-[86%] md:w-[75%] lg:w-[72%] mx-auto"
                          variants={cardVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          custom={direction}
                          style={{ transformOrigin: "center center" }}
                                                  >
                          <EventCard
                            event={rtEvents[index]}
                            onModalChange={(open: boolean) => setIsModalOpen(open)}
                          />
                        </motion.div>

                        {/* Carta derecha (solo desktop) */}
                        <motion.div
                          key={`right-${page + 1}`}
                          className="absolute hidden md:block w-[75%] md:w-[65%] lg:w-[60%] pointer-events-none"
                          variants={cardVariants}
                          initial="enter"
                          animate="right"
                          exit="exit"
                          custom={direction}
                          style={{ transformOrigin: "center center" }}
                        >
                          <div className="brightness-90 saturate-90 transition-all duration-300">
                            <EventCard event={rtEvents[nextIndex]} />
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* dots - sin animación separada, se animan con los cards */}
                    <div className="mt-8 sm:mt-6 md:mt-6 lg:mt-0.25 flex justify-center gap-1.5">
                      {rtEvents.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (isAnimatingRef.current) return

                            stopAuto()

                            const dir = i > index ? 1 : -1
                            setDirection(dir)
                            lockAnimation()
                            setPage((p) => p - mod(p, total) + i)

                            setTimeout(() => {
                              if (!isModalOpenRef.current) {
                                scheduleAuto()
                              }
                            }, ANIM_MS + 100)
                          }}
                          className={[
                            "rounded-full transition-all duration-300",
                            i === index
                              ? "h-2.5 w-10 bg-gradient-to-r from-[#2F5F0B] to-[#6D8B37] shadow-lg shadow-[#8FAE5A]/30"
                              : "h-2.5 w-2.5 bg-[#1F3D2B]/18 hover:bg-[#1F3D2B]/28 hover:w-6",
                          ].join(" ")}
                          aria-label={`Ir al evento ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>

              {/* Flecha IZQUIERDA */}
              <ScrollReveal
                duration={800}
                distance={40}
                delay={200}
                direction="up"
                className="contents pointer-events-none"
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goPrev}
                  disabled={!hasEvents}
                  className="pointer-events-auto hidden lg:flex absolute left-0 top-1/2 -translate-y-1/2 z-[60] -translate-x-24 h-12 w-12 rounded-full p-0 border-2 border-[#A7C4A0] bg-white/70 text-[#1F3D2B] hover:bg-[#D6E5C8] hover:border-[#8FAE5A] disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-110"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
              </ScrollReveal>

              {/* Flecha DERECHA */}
              <ScrollReveal
                duration={800}
                distance={40}
                delay={200}
                direction="up"
                className="contents pointer-events-none"
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={goNext}
                  disabled={!hasEvents}
                  className="pointer-events-auto hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-[60] translate-x-24 h-12 w-12 rounded-full p-0 border-2 border-[#A7C4A0] bg-white/70 text-[#1F3D2B] hover:bg-[#D6E5C8] hover:border-[#8FAE5A] disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-md shadow-xl transition-all duration-300 hover:scale-110"
                  aria-label="Siguiente"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </ScrollReveal>
            </div>
          </PageState>
        </div>
      </div>
    </div>
  )
}