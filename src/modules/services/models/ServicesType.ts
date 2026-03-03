export type Service = {
  id: number
  title: string
  cardDescription: string
  modalDescription: string
  images: string[]
}


export const initialStateService: Service = {
  id: 0,
  title: "",
  cardDescription: "",
  modalDescription: "",
  images: [],
}

export const services: Service[] = [
  {
    id: 1,
    title: "Capacitación y transferencia1",
    cardDescription: "Lorem ipsum dolor sit amet consectetur adipiscing elit habitasse nibh, facilisi ullamcorper magnis justo metus maecenas fermentum erat tortor, in facilisis taciti scelerisque pretium malesuada a purus. Facilisis non nostra lacinia etiam eget sociosqu tempus senectus, integer praesent elementum morbi litora natoque commodo netus leo, vulputate rutrum varius duis aptent dictumst torquent.",
    modalDescription: "Lorem ipsum dolor sit amet consectetur adipiscing elit habitasse nibh, facilisi ullamcorper magnis justo metus maecenas fermentum erat tortor, in facilisis taciti scelerisque... [continúa]",
    images: [
      "https://scontent.fsjo10-1.fna.fbcdn.net/v/t39.30808-6/482000334_571803125909150_7851598428227402418_n.jpg?...",
    ],
  },
  {
    id: 2,
    title: "Asistencia técnica2",
    cardDescription: "Lorem ipsum dolor sit amet consectetur adipiscing elit habitasse nibh,",
    modalDescription: "Nuestro equipo técnico visita fincas, evalúa procesos y brinda asesoramiento directo sobre sanidad animal, nutrición, genética y manejo sostenible.",
    images: [
      "https://scontent.fsjo10-1.fna.fbcdn.net/v/t39.30808-6/468735561_500353246387472_7430796887605064981_n.jpg?...",
    ],
  },
  {
    id: 3,
    title: "Innovación rural",
    cardDescription: "Lorem ipsum dolor sit amet consectetur adipiscing elit habitasse nibh...",
    modalDescription: "Apoyamos la implementación de soluciones tecnológicas como cercas eléctricas, sistemas de captación de agua, monitoreo satelital y aplicaciones móviles...",
    images: [
      "https://scontent.fsjo10-1.fna.fbcdn.net/v/t39.30808-6/480681953_559776447111818_994803168973652271_n.jpg?...",
    ],
  },
  // ...otros servicios
]
