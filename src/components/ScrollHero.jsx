"use client";

import { useEffect, useRef, useState } from "react";
import { scenes } from "../data/club";
import Header from "./Header";
import { Arrow, Button } from "./ui";

export default function ScrollHero({ onReserve }) {
  const rootRef = useRef(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame;
    const update = () => {
      const distance = root.offsetHeight - root.firstElementChild.offsetHeight;
      const progress = Math.min(
        1,
        Math.max(0, -root.getBoundingClientRect().top / Math.max(1, distance)),
      );
      const position = progress * (scenes.length - 1);
      setActive(Math.round(position));
      root.querySelectorAll("[data-scene]").forEach((scene, index) => {
        const delta = position - index;
        const opacity = motion.matches
          ? Number(Math.round(position) === index)
          : Math.max(0, 1 - Math.abs(delta) * 1.65);
        scene.style.setProperty("--scene-opacity", opacity);
        scene.style.setProperty(
          "--scene-shift",
          `${motion.matches ? 0 : delta * -65}px`,
        );
        scene.style.setProperty(
          "--scene-scale",
          motion.matches ? 1 : 1 + Math.abs(delta) * 0.06,
        );
      });
      frame = null;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, []);

  const goToScene = (index) => {
    const root = rootRef.current;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({
      top:
        window.scrollY +
        root.getBoundingClientRect().top +
        ((root.offsetHeight - root.firstElementChild.offsetHeight) * index) /
          (scenes.length - 1),
      behavior: reduced ? "instant" : "smooth",
    });
  };

  return (
    <section
      ref={rootRef}
      className="hero"
      id="inicio"
      aria-label="Descubre HEAT"
    >
      <div className="hero__sticky">
        {scenes.map((scene, index) => (
          <div
            className={`hero__scene hero__scene--${scene.tint}`}
            key={scene.id}
            data-scene
            style={{ "--scene-opacity": index === 0 ? 1 : 0 }}
            aria-hidden={index !== active}
          >
            <img
              className="hero__background"
              src={scene.image}
              alt=""
              fetchPriority={index === 0 ? "high" : "auto"}
            />
            <div className="hero__shade" />
            <div className="hero__headline">
              <p className="hero__eyebrow">{scene.eyebrow}</p>
              {index === 0 ? (
                <h1 className="hero__title">
                  {scene.title.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h1>
              ) : (
                <h2 className="hero__title">
                  {scene.title.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </h2>
              )}
            </div>
            <img
              className={`hero__player hero__player--${scene.id}`}
              src={scene.player}
              alt=""
              fetchPriority={index === 0 ? "high" : "auto"}
            />
          </div>
        ))}
        <div className="hero__frame" aria-hidden="true" />
        <div className="hero__topline">
          <span>PLAYA DEL CARMEN, MÉXICO</span>
          <span>PÁDEL · PICKLEBALL · COMUNIDAD</span>
        </div>
        <Header onReserve={onReserve} />
        <div className="hero__bottom">
          <div className="hero__intro">
            <p className="hero__description">{scenes[active].description}</p>
            <Button onClick={onReserve}>
              Entra en juego <Arrow diagonal />
            </Button>
          </div>
          <a className="hero__scroll" href="#club" aria-label="Explora el club">
            <span>EXPLORA EL CLUB</span>
            <span className="hero__scroll-circle">↓</span>
          </a>
          <div className="hero__aside">
            <span className="hero__location">
              <span /> TU PUNTO DE ENCUENTRO
            </span>
            <p>
              Nos vemos en la cancha.
              <br />
              Te quedas por la comunidad.
            </p>
            <span className="hero__detail">{scenes[active].detail}</span>
          </div>
        </div>
        <div className="hero__pagination" aria-label="Escenas de portada">
          {scenes.map((scene, index) => (
            <button
              key={scene.id}
              className={`hero__step${active === index ? " hero__step--active" : ""}`}
              onClick={() => goToScene(index)}
              aria-current={active === index ? "step" : undefined}
            >
              <span>0{index + 1}</span>
              <span>{scene.label}</span>
              <span className="hero__step-line" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
