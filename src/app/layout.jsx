import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://heatpadelclub.com"),
  title: "HEAT Pádel & Pickleball | Tu juego. Tu ritmo. Tu lugar.",
  description:
    "Tu próximo partido empieza en HEAT, Playa del Carmen. Canchas de pádel y pickleball, Paquito Navarro Academy y una comunidad con tu misma energía.",
  openGraph: {
    title: "HEAT Pádel & Pickleball",
    description: "Tu juego. Tu ritmo. Tu lugar. Playa del Carmen, México.",
    locale: "es_MX",
    type: "website",
    images: [{ url: "/images/club-wide.webp", width: 1440, height: 960 }],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
