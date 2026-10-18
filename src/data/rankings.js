// Fictional weekly standings requested for the landing preview.
// Keep isDemo true until these records are replaced by verified match results.
export const rankings = [
  {
    id: "padel",
    label: "Pádel",
    isDemo: true,
    players: [
      {
        id: "demo-padel-1",
        name: "Pedro Ruiz",
        points: 320,
        image: "/images/ranking-man-court.webp",
      },
      {
        id: "demo-padel-2",
        name: "Sofía Martínez",
        points: 285,
        image: "/images/ranking-woman-court.webp",
        imagePosition: "55% 35%",
      },
      {
        id: "demo-padel-3",
        name: "Diego Navarro",
        points: 260,
        image: "/images/ranking-man-studio.webp",
        imagePosition: "50% 20%",
      },
      { id: "demo-padel-4", name: "Valentina Torres", points: 235 },
      { id: "demo-padel-5", name: "Andrés Vega", points: 210 },
    ],
  },
  {
    id: "pickleball",
    label: "Pickleball",
    isDemo: true,
    players: [
      {
        id: "demo-pickleball-1",
        name: "Camila Ríos",
        points: 295,
        image: "/images/ranking-woman-court.webp",
        imagePosition: "55% 35%",
      },
      {
        id: "demo-pickleball-2",
        name: "Mateo Cruz",
        points: 270,
        image: "/images/ranking-man-court.webp",
      },
      {
        id: "demo-pickleball-3",
        name: "Lucía Herrera",
        points: 245,
        image: "/images/ranking-woman-indoor.webp",
        imagePosition: "42% 35%",
      },
      { id: "demo-pickleball-4", name: "Gabriel Santos", points: 220 },
      { id: "demo-pickleball-5", name: "Renata Flores", points: 195 },
    ],
  },
];
