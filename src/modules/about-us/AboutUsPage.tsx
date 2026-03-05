import { Users, Target, Eye } from "lucide-react"
import { AboutUsCard } from "./components/AboutUsCard"
import { useAboutUs } from "./hooks/useAboutUs"

import { PageState } from "@/shared/ui/PageState"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollReveal } from "@/shared/animations/Scroll"

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
}

// match flexible por palabras clave
function matchesAnyTitle(title: string, needles: string[]) {
  const t = normalize(title)
  return needles.some((n) => t.includes(normalize(n)))
}

export default function AboutUsPage() {
  const { data: aboutUs = [], isLoading } = useAboutUs()

  const findSection = (needles: string[]) =>
    aboutUs.find((item) => matchesAnyTitle(item.title, needles))

  const somos = findSection([
    "quienes somos",
    "quiénes somos",
    "somos",
    "historia",
    "sobre nosotros",
  ])

  const mision = findSection([
    "mision",
    "misión",
    "nuestra mision",
    "nuestro proposito",
  ])
  const vision = findSection(["vision", "visión", "nuestra vision"])

  const isEmpty = !isLoading && aboutUs.length === 0

  return (
    <section className="relative">

      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 md:py-24 space-y-10">
        {/* Header SIEMPRE */}
        <div className="text-center space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Conócenos</p>
          <h1 className="text-4xl md:text-5xl font-semibold text-[#2E321B] text-center mb-4">
            Sobre nosotros
          </h1>
        </div>

        <PageState
          isLoading={isLoading}
          isEmpty={isEmpty}
          withContainer={false}
          emptyTitle="Aún no hay información publicada"
          emptyDescription="Cuando publiquemos contenido, lo verás aquí."
          skeleton={
            <div className="grid gap-6 md:grid-cols-2">
              {/* Izquierda (2 cards) */}
              <div className="flex flex-col gap-6">
                {[0, 1].map((i) => (
                  <Card key={i} className="p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <div className="min-w-0 flex-1 space-y-3">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-11/12" />
                        <Skeleton className="h-4 w-9/12" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Derecha (1 card grande) */}
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-3">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-10/12" />
                    <Skeleton className="h-4 w-9/12" />
                  </div>
                </div>
              </Card>
            </div>
          }
        >
          {/* Si llegó data pero no matchea secciones, mostramos aviso "suave" */}
          {!somos && !mision && !vision ? (
            <div className="mx-auto max-w-3xl">
              <Card className="p-6 sm:p-8">
                <p className="text-base font-medium text-[#2E321B]">
                  Aún no hay información publicada para esta sección
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  En cuanto esté disponible, aparecerá aquí.
                </p>
              </Card>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Izquierda */}
              <div className="flex flex-col gap-6">
                {mision && (
                  <ScrollReveal duration={800} distance={40} delay={100}>
                    <AboutUsCard
                      icon={<Target className="h-5 w-5" />}
                      title={mision.title}
                      description={mision.description}
                    />
                  </ScrollReveal>
                )}

                {vision && (
                  <ScrollReveal duration={800} distance={40} delay={200}>
                    <AboutUsCard
                      icon={<Eye className="h-5 w-5" />}
                      title={vision.title}
                      description={vision.description}
                    />
                  </ScrollReveal>
                )}
              </div>

              {/* Derecha */}
              {somos && (
                <ScrollReveal duration={800} distance={40} delay={150}>
                  <AboutUsCard
                    icon={<Users className="h-5 w-5" />}
                    title={somos.title}
                    description={somos.description}
                  />
                </ScrollReveal>
              )}
            </div>
          )}
        </PageState>
      </div>
    </section>
  )
}