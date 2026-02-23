import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Fade-in and slide-up on scroll */
export function initScrollReveals(): void {
  if (prefersReducedMotion) {
    // Show everything immediately
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      (el as HTMLElement).style.opacity = '1';
      (el as HTMLElement).style.transform = 'none';
    });
    return;
  }

  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

/** Stagger children within a container */
export function initStaggerReveals(): void {
  if (prefersReducedMotion) return;

  gsap.utils.toArray<HTMLElement>('[data-stagger]').forEach((container) => {
    const children = container.children;
    gsap.fromTo(
      children,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: container,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );
  });
}

/** Animate a number counting up */
export function animateCounter(el: HTMLElement, target: number, duration = 2): void {
  if (prefersReducedMotion) {
    el.textContent = target.toLocaleString();
    return;
  }

  const obj = { val: 0 };
  gsap.to(obj, {
    val: target,
    duration,
    ease: 'power2.out',
    onUpdate() {
      el.textContent = Math.round(obj.val).toLocaleString();
    },
    scrollTrigger: {
      trigger: el,
      start: 'top 90%',
      toggleActions: 'play none none none',
    },
  });
}

/** SVG path draw-in animation */
export function initPathDraw(): void {
  if (prefersReducedMotion) return;

  gsap.utils.toArray<SVGPathElement>('[data-draw]').forEach((path) => {
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.to(path, {
      strokeDashoffset: 0,
      duration: 2,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: path,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
  });
}

/** Letter-by-letter acronym reveal */
export function initAcronymReveal(): void {
  if (prefersReducedMotion) return;

  const letters = gsap.utils.toArray<HTMLElement>('[data-acronym-letter]');
  const descriptions = gsap.utils.toArray<HTMLElement>('[data-acronym-desc]');

  gsap.fromTo(
    letters,
    { opacity: 0.2, scale: 0.8 },
    {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      stagger: 0.2,
      ease: 'back.out(1.4)',
      scrollTrigger: {
        trigger: letters[0]?.parentElement,
        start: 'top 70%',
        toggleActions: 'play none none none',
      },
    }
  );

  gsap.fromTo(
    descriptions,
    { opacity: 0, x: -20 },
    {
      opacity: 1,
      x: 0,
      duration: 0.5,
      stagger: 0.2,
      delay: 0.3,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: descriptions[0]?.parentElement,
        start: 'top 70%',
        toggleActions: 'play none none none',
      },
    }
  );
}

/** Initialize all animations */
export function initAnimations(): void {
  initScrollReveals();
  initStaggerReveals();
  initPathDraw();
  initAcronymReveal();
}
