import { useEffect, useState } from 'react';
import { ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { MediaImage } from '../../features/Blocks';

export function HeroSlider({ slides, fa }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [playing, setPlaying] = useState(
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    if (!playing || paused || slides.length < 2) return undefined;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % slides.length),
      6000,
    );
    return () => window.clearInterval(timer);
  }, [playing, paused, slides.length]);
  useEffect(() => setActive(0), [slides.length]);
  const move = (step) =>
    setActive((current) => (current + step + slides.length) % slides.length);
  return (
    <section
      className="hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label={fa ? 'اسلایدر معرفی' : 'Featured slider'}
    >
      {slides.map((slide, index) => (
        <article
          className={'hero-slide ' + (active === index ? 'active' : '')}
          inert={active !== index}
          aria-hidden={active !== index}
          key={slide.key}
        >
          <MediaImage
            src={slide.image}
            eager={index === 0}
            className="hero-image"
          />
          <div className="container hero-inner">
            <div className="hero-mark">
              <span />
              {slide.eyebrow}
            </div>
            <h1>{slide.title}</h1>
            <p>{slide.summary}</p>
            <div className="actions">
              <Link to={slide.primary.href} className="button primary">
                {slide.primary.label} {slide.arrow}
              </Link>
              <Link to={slide.secondary.href} className="button outline">
                {slide.secondary.label}
              </Link>
            </div>
          </div>
        </article>
      ))}
      {slides.length > 1 && (
        <>
          <button
            className="slider-control previous"
            onClick={() => move(-1)}
            aria-label={fa ? 'اسلاید قبلی' : 'Previous slide'}
          >
            <ChevronRight />
          </button>
          <button
            className="slider-control next"
            onClick={() => move(1)}
            aria-label={fa ? 'اسلاید بعدی' : 'Next slide'}
          >
            <ChevronLeft />
          </button>
          <div className="slider-dots">
            {slides.map((slide, index) => (
              <button
                key={slide.key}
                className={active === index ? 'active' : ''}
                onClick={() => setActive(index)}
                aria-label={`${fa ? 'اسلاید' : 'Slide'} ${index + 1}`}
                aria-current={active === index ? 'true' : undefined}
              />
            ))}
          </div>
        </>
      )}
      {slides.length > 1 && (
        <button
          className="slider-play"
          type="button"
          onClick={() => setPlaying(!playing)}
        >
          {playing
            ? fa
              ? 'توقف اسلایدر'
              : 'Pause slider'
            : fa
              ? 'پخش اسلایدر'
              : 'Play slider'}
        </button>
      )}
      <a
        href="#products"
        className="scroll-indicator"
        aria-label={fa ? 'رفتن به محصولات' : 'Scroll to products'}
      >
        <ArrowDown size={20} />
      </a>
    </section>
  );
}
