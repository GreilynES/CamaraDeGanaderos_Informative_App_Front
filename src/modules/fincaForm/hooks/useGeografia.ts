import { useState, useEffect } from "react";
import { geografiaService, type UbicacionItem } from "../services/geografiaService";
import type { FormLike } from "../../../shared/types/form-lite";

interface UseGeografiaProps {
  form: FormLike;
}

export function useGeografia({ form }: UseGeografiaProps) {
  const [provincias, setProvincias] = useState<UbicacionItem[]>([]);
  const [cantones, setCantones] = useState<UbicacionItem[]>([]);
  const [distritos, setDistritos] = useState<UbicacionItem[]>([]);

  const [loadingProvincias, setLoadingProvincias] = useState(false);
  const [loadingCantones, setLoadingCantones] = useState(false);
  const [loadingDistritos, setLoadingDistritos] = useState(false);

  const [selectedProvinciaId, setSelectedProvinciaId] = useState<string>("");

  const values = form.state.values as any;
  const provinciaValue = values?.provincia ?? "";
  const cantonValue = values?.canton ?? "";

  // 1) Cargar provincias al montar
  useEffect(() => {
    const fetchProvincias = async () => {
      setLoadingProvincias(true);
      try {
        const data = await geografiaService.getProvincias();
        setProvincias(data);
      } catch (error) {
        console.error("Error cargando provincias:", error);
      } finally {
        setLoadingProvincias(false);
      }
    };

    fetchProvincias();
  }, []);

  // 2) Rehidratar cantones si ya hay provincia guardada y aún no están cargados
  useEffect(() => {
    const fetchCantonesFromSavedProvincia = async () => {
      if (!provincias.length || !provinciaValue) return;

      const provinciaId = geografiaService.findProvinciaId(provincias, provinciaValue);
      if (!provinciaId) return;

      setSelectedProvinciaId(provinciaId);

      // Evita doble carga si ya están los cantones para esa provincia
      if (cantones.length > 0) return;

      setLoadingCantones(true);
      try {
        const data = await geografiaService.getCantones(provinciaId);
        setCantones(data);
      } catch (error) {
        console.error("Error cargando cantones:", error);
      } finally {
        setLoadingCantones(false);
      }
    };

    fetchCantonesFromSavedProvincia();
  }, [provincias, provinciaValue, cantones.length]);

  // 3) Rehidratar distritos si ya hay cantón guardado y aún no están cargados
  useEffect(() => {
    const fetchDistritosFromSavedCanton = async () => {
      if (!selectedProvinciaId || !cantones.length || !cantonValue) return;

      const cantonId = geografiaService.findCantonId(cantones, cantonValue);
      if (!cantonId) return;

      // Evita doble carga si ya están los distritos
      if (distritos.length > 0) return;

      setLoadingDistritos(true);
      try {
        const data = await geografiaService.getDistritos(selectedProvinciaId, cantonId);
        setDistritos(data);
      } catch (error) {
        console.error("Error cargando distritos:", error);
      } finally {
        setLoadingDistritos(false);
      }
    };

    fetchDistritosFromSavedCanton();
  }, [selectedProvinciaId, cantones, cantonValue, distritos.length]);

  const handleProvinciaChange = async (provinciaNombre: string, field: any) => {
    const previousProvincia = form.state.values?.provincia ?? "";

    field.handleChange(provinciaNombre);

    // Solo limpiar si realmente cambió la provincia
    if (provinciaNombre !== previousProvincia) {
      form.setFieldValue("canton", "");
      form.setFieldValue("distrito", "");
      setCantones([]);
      setDistritos([]);
    }

    if (!provinciaNombre) {
      setSelectedProvinciaId("");
      return;
    }

    const provinciaId = geografiaService.findProvinciaId(provincias, provinciaNombre);
    if (!provinciaId) return;

    setSelectedProvinciaId(provinciaId);
    setLoadingCantones(true);

    try {
      const data = await geografiaService.getCantones(provinciaId);
      setCantones(data);
    } catch (error) {
      console.error("Error cargando cantones:", error);
    } finally {
      setLoadingCantones(false);
    }
  };

  const handleCantonChange = async (cantonNombre: string, field: any) => {
    const previousCanton = form.state.values?.canton ?? "";

    field.handleChange(cantonNombre);

    // Solo limpiar si realmente cambió el cantón
    if (cantonNombre !== previousCanton) {
      form.setFieldValue("distrito", "");
      setDistritos([]);
    }

    if (!cantonNombre || !selectedProvinciaId) {
      return;
    }

    const cantonId = geografiaService.findCantonId(cantones, cantonNombre);
    if (!cantonId) return;

    setLoadingDistritos(true);

    try {
      const data = await geografiaService.getDistritos(selectedProvinciaId, cantonId);
      setDistritos(data);
    } catch (error) {
      console.error("Error cargando distritos:", error);
    } finally {
      setLoadingDistritos(false);
    }
  };

  return {
    provincias,
    cantones,
    distritos,
    loadingProvincias,
    loadingCantones,
    loadingDistritos,
    handleProvinciaChange,
    handleCantonChange,
  };
}