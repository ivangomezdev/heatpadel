"use client";

import { useState } from "react";
import { club } from "../data/club";
import { Arrow, Button, SectionLabel } from "./ui";
import ScrollHero from "./ScrollHero";
import BookingDialog from "./BookingDialog";
import Rankings from "./Rankings";

export default function Landing() {
  const [bookingOpen, setBookingOpen] = useState(false);
  const openBooking = () => setBookingOpen(true);

  return (
    <>
      <a className="skip-link" href="#club">
        Saltar al contenido
      </a>
      <main>
        <ScrollHero onReserve={openBooking} />
        <div className="club-strip" aria-label="Tu juego. Tu ritmo. Tu lugar.">
          <span>TU JUEGO.</span>
          <span className="club-strip__star">✳</span>
          <span>TU RITMO.</span>
          <span className="club-strip__star">✳</span>
          <span>TU LUGAR.</span>
          <span className="club-strip__star">✳</span>
          <span>FEEL THE HEAT.</span>
          <span className="club-strip__star">✳</span>
        </div>
        <section className="club section" id="club">
          <img
            className="club__brand"
            src="/images/heat-logo-dark.svg"
            alt="HEAT Pádel & Pickleball"
            width="112"
            height="37"
          />
          <div className="club__heading">
            <SectionLabel>BIENVENIDO A HEAT</SectionLabel>
            <h2 className="section__title">
              MÁS QUE UN CLUB.
              <br />
              TU LUGAR.
            </h2>
          </div>
          <div className="club__story">
            <p>
              Hay partidos que se quedan contigo.
              <br />Y lugares a los que siempre quieres volver.
            </p>
            <p className="club__text">
              En el corazón de Playa del Carmen, el deporte se convierte en tu
              mejor plan. Ven a jugar, encuentra tu comunidad y disfruta todo lo
              que pasa dentro y fuera de la cancha.
            </p>
            <a className="text-link" href="#canchas">
              Conoce la experiencia <Arrow diagonal />
            </a>
          </div>
          <div className="club__stats">
            <div>
              <strong>05</strong>
              <p>Canchas de pádel</p>
            </div>
            <div>
              <strong>04</strong>
              <p>Canchas de pickleball</p>
            </div>
            <div>
              <strong className="club__community-title">
                TU
                <br />
                COMUNIDAD
              </strong>
              <p>Dentro y fuera de la cancha.</p>
            </div>
            <div className="club__hours">
              <span>JUEGA A TU RITMO</span>
              <strong>7 AM — 11 PM</strong>
              <p>Todos los días</p>
            </div>
          </div>
        </section>
        <section className="courts section" id="canchas">
          <div className="section__head">
            <div>
              <SectionLabel>EL ESCENARIO DE TU PRÓXIMO PARTIDO</SectionLabel>
              <h2 className="section__title">AQUÍ SE JUEGA.</h2>
            </div>
            <Button variant="outline-dark" onClick={openBooking}>
              Encuentra tu cancha <Arrow diagonal />
            </Button>
          </div>
          <div className="courts__grid">
            {[
              {
                title: "PÁDEL",
                tag: "01 / EL JUEGO QUE NOS UNE",
                image: "club-02",
                text: "5 canchas certificadas por Adidas. Un punto más, siempre.",
              },
              {
                title: "PICKLEBALL",
                tag: "02 / DESCUBRE TU NUEVO PLAN",
                image: "club-01",
                text: "4 canchas certificadas por Adidas. Toda la energía, otro ritmo.",
              },
            ].map((court) => (
              <button className="court" key={court.title} onClick={openBooking}>
                <img
                  className="court__image"
                  src={`/images/${court.image}.webp`}
                  alt={`Canchas de ${court.title.toLowerCase()} en HEAT`}
                  loading="lazy"
                />
                <div className="court__overlay" />
                <span className="court__tag">{court.tag}</span>
                <div className="court__content">
                  <div>
                    <h3>{court.title}</h3>
                    <p>{court.text}</p>
                  </div>
                  <span className="court__arrow">
                    <Arrow diagonal />
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="courts__amenities">
            <span>ILUMINACIÓN LED PRO</span>
            <span>REGADERAS</span>
            <span>ZONA DE CALENTAMIENTO</span>
            <span>PRO SHOP</span>
            <span>HEALTHY & SPORT BAR</span>
          </div>
        </section>
        <section className="academy" id="academia">
          <div className="academy__image-wrap">
            <img
              className="academy__image"
              src="/images/paquito.webp"
              alt="Paquito Navarro Academy en HEAT"
              loading="lazy"
            />
          </div>
          <div className="academy__content">
            <SectionLabel light>PAQUITO NAVARRO ACADEMY</SectionLabel>
            <h2 className="section__title">
              EL TALENTO
              <br />
              SE ENTRENA.
              <br />
              <span>
                LA PASIÓN,
                <br />
                SE COMPARTE.
              </span>
            </h2>
            <p>
              Aprende con una metodología diseñada por Paquito Navarro y su
              equipo. Programas para todas las edades y niveles, con
              entrenadores certificados que te acompañan en cada punto.
            </p>
            <Button
              href={`${club.whatsapp}?text=${encodeURIComponent("Hola HEAT, quiero información de la academia Paquito Navarro.")}`}
              external
            >
              Descubre la academia <Arrow diagonal />
            </Button>
          </div>
        </section>
        <section className="experience section">
          <div className="section__head">
            <div>
              <SectionLabel>EL PARTIDO ES SOLO EL PRINCIPIO</SectionLabel>
              <h2 className="section__title">QUÉDATE UN SET MÁS.</h2>
            </div>
            <p className="section__intro">
              Entrena, compite, comparte.
              <br />
              Siempre hay algo pasando en HEAT.
            </p>
          </div>
          <div className="experience__grid">
            <article className="experience__item">
              <span className="experience__number">01</span>
              <h3>Tu lado competitivo.</h3>
              <p>
                Torneos, ligas y ranking para todas las categorías. Encuentra tu
                próximo reto.
              </p>
              <a
                className="text-link"
                href={`${club.whatsapp}?text=${encodeURIComponent("Hola, quisiera conocer los próximos torneos y ligas.")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Pregunta por los torneos <Arrow diagonal />
              </a>
            </article>
            <article className="experience__item">
              <span className="experience__number">02</span>
              <h3>El punto de encuentro.</h3>
              <p>
                Un snack, una buena charla y simuladores de golf. El cuarto set
                se vive en The Bunker.
              </p>
              <a
                className="text-link"
                href="https://www.thebunkergolfbar.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Conoce The Bunker <Arrow diagonal />
              </a>
            </article>
            <article className="experience__item">
              <span className="experience__number">03</span>
              <h3>Un plan diferente.</h3>
              <p>
                Eventos de empresa y celebraciones privadas. Haz de la cancha un
                lugar para conectar.
              </p>
              <a
                className="text-link"
                href={`${club.whatsapp}?text=${encodeURIComponent("Hola, quiero organizar un evento en HEAT.")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Organiza tu evento <Arrow diagonal />
              </a>
            </article>
          </div>
        </section>
        <Rankings />
        <section className="contact" id="contacto">
          <img
            className="contact__background"
            src="/images/club-wide.webp"
            alt=""
            loading="lazy"
          />
          <div className="contact__content">
            <SectionLabel light>PLAYA DEL CARMEN, MÉXICO</SectionLabel>
            <h2>
              MENOS PENSARLO.
              <br />
              <span>MÁS JUGARLO.</span>
            </h2>
            <Button onClick={openBooking}>
              Reserva tu próximo partido <Arrow diagonal />
            </Button>
            <div className="contact__details">
              <p>{club.address}</p>
              <a href={club.maps} target="_blank" rel="noopener noreferrer">
                Cómo llegar <Arrow diagonal />
              </a>
            </div>
          </div>
        </section>
      </main>
      <footer className="footer">
        <a href="#inicio" aria-label="Volver al inicio">
          <img
            src="/images/heat-logo.svg"
            alt="HEAT Pádel & Pickleball"
            width="165"
            height="55"
          />
        </a>
        <p>Tu juego. Tu ritmo. Tu lugar.</p>
        <a href={club.whatsapp} target="_blank" rel="noopener noreferrer">
          +52 984 130 8308 <Arrow diagonal />
        </a>
        <span className="footer__copyright">
          © {new Date().getFullYear()} HEAT Pádel & Pickleball
        </span>
      </footer>
      <BookingDialog open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </>
  );
}
