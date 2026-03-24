import { useMemo } from "react"
import { NavigationButtons } from "../../components/NavigationButtons"
import { OrganizacionSection } from "../../components/OrganizacionSection"
import { RepresentanteSection } from "../../components/RepresentanteSection"
import { validateOrgStep1Required } from "../../services/volunteerOrgStep1Validation"
import { lookupPersonaByCedula } from "../../services/volunteerFormService"

export function Step1Organization(props: {
  form: any
  lookup?: (id: string) => Promise<any>
  showErrors: boolean
  setShowErrors: (v: boolean) => void
  onNext: () => void
}) {
  const { form, lookup, showErrors, setShowErrors, onNext } = props

  const lookupCombined = useMemo(() => {
    return async (id: string) => {
      const ced = (id ?? "").trim()
      if (!ced) return null

      const db = await lookupPersonaByCedula(ced)

      if (db?.found) {
        return {
          source: "DB",
          ...(db.legacy ?? {}),
          persona: db.persona,
          representanteOrganizacion: db.representanteOrganizacion,
          volunteerIndividual: db.volunteerIndividual,
        }
      }

      if (db?.cedula && db?.nombre && db?.apellido1) {
        return {
          source: "DB",
          firstname: db.nombre ?? "",
          lastname1: db.apellido1 ?? "",
          lastname2: db.apellido2 ?? "",
          persona: {
            cedula: db.cedula ?? "",
            nombre: db.nombre ?? "",
            apellido1: db.apellido1 ?? "",
            apellido2: db.apellido2 ?? "",
            telefono: db.telefono ?? "",
            email: db.email ?? "",
            fechaNacimiento: db.fechaNacimiento ?? "",
            direccion: db.direccion ?? "",
          },
        }
      }

      if (!lookup) return null
      const tse = await lookup(ced)
      return tse ? { source: "TSE", ...tse } : null
    }
  }, [lookup])

  const handleNext = () => {
  const { anyEmpty } = validateOrgStep1Required(form)
  if (anyEmpty) {
    setShowErrors(true)
    return
  }
  onNext()
}

  return (
    <div className="space-y-6">
      <OrganizacionSection form={form} showErrors={showErrors} />

      <RepresentanteSection form={form} lookup={lookupCombined} showErrors={showErrors} />

      <NavigationButtons onPrev={() => {}} onNext={handleNext} disableNext={false} hidePrev />
    </div>
  )
}