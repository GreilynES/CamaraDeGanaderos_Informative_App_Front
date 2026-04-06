import { DocumentUploadVoluntarios } from "../../components/DocumentUploadVoluntarios"
import { NavigationButtons } from "../../components/NavigationButtons"
import { useMemo, useState } from "react"

export function Step4Individual(props: {
  files: any
  setFiles: (files: any) => void
  goPrev: () => void
  goNext: () => void
  isStepValid: () => boolean
}) {
  const { files, setFiles, goPrev, goNext } = props
  const [showErrors, setShowErrors] = useState(false)

  const missing = useMemo(
    () => ({
      cedula: !files?.cedula,
      cv: !files?.cv,
    }),
    [files]
  )

  const disableNext = missing.cedula || missing.cv

  const handleNext = () => {
    setShowErrors(true)
    if (disableNext) return
    goNext()
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-[#DCD6C9]">
      <div className="px-6 py-4 border-b border-[#DCD6C9] flex items-center space-x-2">
        <div className="w-8 h-8 bg-[#708C3E] rounded-full flex items-center justify-center text-white font-bold text-sm">
          4
        </div>
        <h3 className="text-lg font-semibold text-[#708C3E]">Documentos</h3>
      </div>

      <DocumentUploadVoluntarios
        tipo="INDIVIDUAL"
        files={files}
        setFiles={setFiles}
      />

      {showErrors && disableNext && (
        <div className="px-6 pb-2">
          <p className="text-sm text-[#9c1414]">
            Debes adjuntar cédula/pasaporte y CV para continuar.
          </p>
        </div>
      )}

      <NavigationButtons onPrev={goPrev} onNext={handleNext} disableNext={disableNext} />
    </div>
  )
}