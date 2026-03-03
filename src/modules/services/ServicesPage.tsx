import { useEffect, useMemo, useRef, useState } from "react"
import { initialStateService, type Service } from "./models/ServicesType"
import { useServices } from "./hooks/useServices"
import { ServicesCard } from "./components/serviceCard"
import { ServicesModal } from "./components/serviceModal"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

import { PageState } from "@/shared/ui/PageState"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollReveal } from "@/shared/animations/Scroll"

export default function ServicesPage() {
  const { services, isLoading, error } = useServices()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState<Service>(initialStateService)

  // ✅ Page size responsive: 3 en teléfono, 6 en pantallas >= sm
  const [pageSize, setPageSize] = useState(6)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)")
    const update = () => setPageSize(mq.matches ? 3 : 6)
    update()
    mq.addEventListener?.("change", update)
    return () => mq.removeEventListener?.("change", update)
  }, [])

  const [page, setPage] = useState(1)

  // ✅ Ref para volver al inicio del título SOLO cuando el usuario pagina
  const servicesTopRef = useRef<HTMLHeadingElement | null>(null)
  const shouldScrollRef = useRef(false)

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(services.length / pageSize))
  }, [services.length, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
    if (page < 1) setPage(1)
  }, [page, totalPages])

  const pagedServices = useMemo(() => {
    const start = (page - 1) * pageSize
    return services.slice(start, start + pageSize)
  }, [services, page, pageSize])

  // ✅ Si cambia pageSize (resize/orientación), resetea a 1 PERO SIN SCROLL
  useEffect(() => {
    setPage(1)
    // no tocamos shouldScrollRef aquí
  }, [pageSize])

  // ✅ Scroll arriba SOLO si el usuario paginó (no en load, no en fetch)
  useEffect(() => {
    if (isLoading) return
    if (!shouldScrollRef.current) return

    shouldScrollRef.current = false
    servicesTopRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }, [page, isLoading])

    const openModal = (service: Service) => {
      setModalContent(service)
      setIsModalOpen(true)
    }

  const closeModal = () => setIsModalOpen(false)

  const go = (n: number) => {
    const safe = Math.min(Math.max(1, n), totalPages)
    // ✅ SOLO aquí activamos scroll (porque fue acción del usuario)
    shouldScrollRef.current = true
    setPage(safe)
  }

  // Render de páginas estilo shadcn (1 … current-1 current current+1 … last)
  const pageItems = useMemo(() => {
    if (totalPages <= 1) return []

    const items: Array<
      | { type: "page"; n: number }
      | { type: "ellipsis"; key: string }
    > = []

    const addPage = (n: number) => items.push({ type: "page", n })
    const addEllipsis = (key: string) => items.push({ type: "ellipsis", key })

    addPage(1)

    if (totalPages === 2) {
      addPage(2)
      return items
    }

    const left = Math.max(2, page - 1)
    const right = Math.min(totalPages - 1, page + 1)

    if (left > 2) addEllipsis("left")
    for (let n = left; n <= right; n++) addPage(n)
    if (right < totalPages - 1) addEllipsis("right")

    addPage(totalPages)

    return items
  }, [page, totalPages])

  const showEmpty = !isLoading && !error && services.length === 0

  return (
    <section className="min-h-full bg-white py-20">
      <div className="container mx-auto px-6 md:px-20">
        <ScrollReveal duration={800} distance={30}>
          <div className="text-center space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Te ofrecemos</p>

            <h1
              ref={servicesTopRef}
              className="text-4xl md:text-5xl font-semibold text-[#2E321B] text-center mb-4"
            >
              Nuestros servicios
            </h1>
          </div>
        </ScrollReveal>

        <p className="text-center text-base md:text-lg text-gray-600 mb-16 max-w-3xl mx-auto"></p>

        <PageState
          isLoading={isLoading}
          isEmpty={showEmpty}
          withContainer={false}
          emptyTitle="No hay servicios disponibles"
          emptyDescription="Cuando publiquemos servicios, aparecerán aquí."
          skeleton={
            <div className="max-w-6xl mx-auto">
               <div className="grid gap-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-stretch">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="p-5">
                    <Skeleton className="h-44 w-full rounded-2xl" />
                    <div className="mt-4 space-y-3">
                      <Skeleton className="h-6 w-2/3" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-4 w-4/6" />
                      <Skeleton className="h-10 w-32 rounded-full" />
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-10 flex justify-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 w-28 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <Skeleton className="h-9 w-28 rounded-full" />
                </div>
              </div>
            </div>
          }
          className="mt-2"
        >
          {error ? (
            <div className="max-w-3xl mx-auto">
              <Card className="p-6 sm:p-8">
                <p className="text-base font-medium text-[#2E321B]">
                  No pudimos cargar los servicios
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Intenta nuevamente en unos minutos.
                </p>
              </Card>
            </div>
          ) : (
            <>
              <div className="max-w-6xl mx-auto">
                <div className="grid gap-10 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {pagedServices.map((service, index) => (
                    <ScrollReveal 
                      key={service.id} 
                      duration={1400} 
                      distance={50} 
                      delay={index * 200}
                    >
                      <ServicesCard
                        service={service}
                        openModal={openModal}
                      />
                    </ScrollReveal>
                  ))}
                </div>

                {/* ✅ Paginación: usa pageSize (3 móvil / 6 desktop) */}
                {services.length > pageSize && totalPages > 1 && (
                  <ScrollReveal duration={800} distance={30} delay={600}>
                    <div className="mt-10 flex justify-center">
                      <Pagination>
                        <PaginationContent className="w-full justify-center">
                          <PaginationItem className="w-[110px] flex justify-start">
                            {page > 1 ? (
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  go(page - 1)
                                }}
                              />
                            ) : (
                              <span className="invisible inline-flex items-center gap-1 px-3 py-2">
                                <span>Previous</span>
                              </span>
                            )}
                          </PaginationItem>

                          <div className="flex items-center gap-1">
                            {pageItems.map((it: any) => {
                              if (it.type === "ellipsis") {
                                return (
                                  <PaginationItem key={it.key}>
                                    <PaginationEllipsis />
                                  </PaginationItem>
                                )
                              }

                              const active = it.n === page
                              return (
                                <PaginationItem key={it.n}>
                                  <PaginationLink
                                    href="#"
                                    isActive={active}
                                    onClick={(e) => {
                                      e.preventDefault()
                                      go(it.n)
                                    }}
                                  >
                                    {it.n}
                                  </PaginationLink>
                                </PaginationItem>
                              )
                            })}
                          </div>

                          <PaginationItem className="w-[110px] flex justify-end">
                            {page < totalPages ? (
                              <PaginationNext
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault()
                                  go(page + 1)
                                }}
                              />
                            ) : (
                              <span className="invisible inline-flex items-center gap-1 px-3 py-2">
                                <span>Next</span>
                              </span>
                            )}
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </ScrollReveal>
                )}
              </div>

              {isModalOpen && (
                <ServicesModal content={modalContent} onClose={closeModal}/>
              )}
            </>
          )}
        </PageState>
      </div>
    </section>
  )
}
