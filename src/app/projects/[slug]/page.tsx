"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProjects, ProjectWithUrls } from "@/lib/data";
import Nav2 from "@/components/Nav3";
import FsLightbox from "fslightbox-react";
import { PortableText } from "@portabletext/react";

const ACTIVE_INDEX_DEFAULT = 0;
const REPEAT_COUNT = 3; // real copy + one buffer copy above + one below
const MIDDLE_SET = 1; // index of the "real" copy among the rendered copies
const EDGE_TRANSLATE_X = 50; // px offset applied as an image enters/leaves the screen (desktop)

// Mobile-specific configuration: more buffer copies, deeper middle set
const MOBILE_REPEAT_COUNT = 5;
const MOBILE_MIDDLE_SET = 3;
const MOBILE_EDGE_TRANSLATE_X = 250; // px offset for mobile

// Spring + snapping tuning. The gallery is fully JS-animated: a virtual
// scroll position chases a target with exponential smoothing, and the target
// always converges onto the nearest image's center — one motion system, no
// fighting between CSS snap, momentum and JS (the old approach's problem).
const TAU_MS = 120; // spring time-constant: lower = snappier, higher = softer
const WHEEL_IDLE_MS = 140; // wheel quiet period before snapping to nearest
const MOMENTUM_MS = 220; // touch-flick velocity window for momentum

// Click-to-lightbox: a tap/click only opens the lightbox if the pointer
// barely moved between down and up — otherwise it was a gallery swipe.
const CLICK_MAX_DRAG_PX = 8;
const CLICK_MAX_MS = 350;

function ThumbnailImage({ src, alt }: { src: string; alt: string }) {
  // Thumbnails are fixed aspect-square boxes: fit entirely inside the box,
  // preserving aspect ratio, anchored to the right edge.
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="56px"
      className="object-cover object-right"
    />
  );
}

function GalleryImage({
  src,
  alt,
  onLoad,
}: {
  src: string;
  alt: string;
  onLoad?: () => void;
}) {
  // Same width as every other gallery image; height is whatever the image's
  // own aspect ratio produces at that width. Rendered in normal document
  // flow (not `fill`/absolute) so it directly determines its wrapper's
  // height — no fixed box, no cropping, no stretching.
  return (
    <Image
      src={src}
      alt={alt}
      width={0}
      height={0}
      sizes="(min-width: 1024px) 50vw, 100vw"
      className="block w-full h-[270px] lg:h-auto object-cover"
      onLoad={onLoad}
    />
  );
}

/**
 * Infinite vertical image gallery, rebuilt as a single JS-driven spring.
 *
 * Architecture (replaces the old native-scroll + CSS-snap hybrid that fought
 * itself):
 *  - The viewport div does NOT scroll (overflow-hidden). All motion is a
 *    virtual position `pos` chasing a `target` with a time-based exponential
 *    spring inside one requestAnimationFrame loop.
 *  - The track (all image copies) moves with ONE translate3d per frame — a
 *    single compositor transform, so motion is perfectly smooth.
 *  - Input: wheel deltas add to `target` (idle -> snap to nearest image),
 *    pointer drag sets `target` directly with momentum + snap on release,
 *    thumbnail jumps/scrollBy set `target`. Every gesture ends on an image
 *    center naturally.
 *  - Infinite loop: `pos` (and `target`) wrap by exactly one copy height
 *    whenever they leave the middle copy's window. Content repeats
 *    pixel-identically, so the wrap is invisible.
 *  - Effects (edge translateX, active opacity) are computed from cached
 *    layout metrics — no layout reads in the per-frame path.
 */
function InfiniteGallery({
  images,
  projectName,
  activeIndex,
  onActiveIndexChange,
  onRegisterJumpTo,
  onRegisterScrollBy,
  onOpenLightbox,
}: {
  images: string[];
  projectName: string;
  activeIndex: number;
  onActiveIndexChange: (i: number) => void;
  onRegisterJumpTo: (fn: (originalIndex: number) => void) => void;
  onRegisterScrollBy: (fn: (deltaY: number) => void) => void;
  onOpenLightbox: (originalIndex: number) => void;
}) {
  const onOpenLightboxRef = useRef(onOpenLightbox);
  useEffect(() => {
    onOpenLightboxRef.current = onOpenLightbox;
  });
  const scrollRef = useRef<HTMLDivElement>(null); // viewport (never scrolls)
  const trackRef = useRef<HTMLDivElement>(null); // moving track
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const metricsRef = useRef<{ top: number; height: number }[]>([]);

  const posRef = useRef(0); // virtual scroll position (content px from track top)
  const targetRef = useRef(0); // where the spring is heading
  const viewportHRef = useRef(0);
  const setStartRef = useRef(0); // content offset where the middle copy begins
  const setHRef = useRef(1); // one copy's height
  const initializedRef = useRef(false);
  const activeIdxRef = useRef(-1); // rendered index currently on the line
  const txRef = useRef<number[]>([]); // last written translateX per item

  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);

  // Input state
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ y: 0, t: 0 });
  const downRef = useRef({ x: 0, y: 0, t: 0 }); // where the current drag/tap began
  const velocityRef = useRef(0); // px/ms, positive = scrolling down
  const wheelIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  const isMobileRef = useRef(false);

  // Normally 3 copies (desktop) / 5 (mobile) are plenty; if images are so
  // short that a copy is smaller than the viewport, measure() raises this so
  // the visible window is always covered by rendered content.
  const [extraSets, setExtraSets] = useState(0);

  const count = images.length;
  const baseSets = isMobile ? MOBILE_REPEAT_COUNT : REPEAT_COUNT;
  const repeatCount = Math.max(baseSets, extraSets);
  const middleSet = isMobile ? MOBILE_MIDDLE_SET : MIDDLE_SET;
  const edgeTranslateX = isMobile ? MOBILE_EDGE_TRANSLATE_X : EDGE_TRANSLATE_X;
  const repeated = Array.from({ length: repeatCount }, () => images).flat();

  // Latest-ref mirrors so once-attached listeners and the rAF loop always
  // see current values without re-subscribing.
  const onActiveChangeRef = useRef(onActiveIndexChange);
  useEffect(() => {
    onActiveChangeRef.current = onActiveIndexChange;
  });
  const edgeRef = useRef(edgeTranslateX);
  useEffect(() => {
    edgeRef.current = edgeTranslateX;
  });
  const middleSetRef = useRef(middleSet);
  useEffect(() => {
    middleSetRef.current = middleSet;
  });
  const countRef = useRef(count);
  useEffect(() => {
    countRef.current = count;
  });
  const repeatCountRef = useRef(repeatCount);
  useEffect(() => {
    repeatCountRef.current = repeatCount;
  });

  /** Alignment line offset from viewport top: center, 20% lower on mobile. */
  const lineOffset = () =>
    viewportHRef.current * (isMobileRef.current ? 0.2 : 0);

  /** Scroll position that puts item m's center exactly on the line. */
  const centerScrollFor = (m: { top: number; height: number }) =>
    m.top + m.height / 2 - viewportHRef.current / 2 - lineOffset();

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    viewportHRef.current = el.clientHeight;

    const start = itemRefs.current[middleSetRef.current * countRef.current];
    const end =
      itemRefs.current[middleSetRef.current * countRef.current + countRef.current - 1];
    if (!start || !end) return;

    metricsRef.current = itemRefs.current.map((item) =>
      item ? { top: item.offsetTop, height: item.offsetHeight } : { top: 0, height: 0 }
    );
    const startM = metricsRef.current[middleSetRef.current * countRef.current];
    if (!startM) return;

    setStartRef.current = startM.top;
    setHRef.current = end.offsetTop + end.offsetHeight - start.offsetTop;
    if (setHRef.current <= 0) return;

    // If a copy is shorter than the viewport, guarantee enough rendered
    // copies to cover pos + viewport at the bottom of the wrap window.
    const h = viewportHRef.current;
    if (h > 0) {
      const needed =
        middleSetRef.current + 1 + Math.ceil(h / setHRef.current);
      if (needed > repeatCountRef.current) setExtraSets(needed);
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      const p = centerScrollFor(startM);
      posRef.current = p;
      targetRef.current = p;
    }
  }, []);

  /** Keep pos (and target, shifted identically) inside the middle copy. */
  const wrap = useCallback(() => {
    const S = setStartRef.current;
    const H = setHRef.current;
    if (H <= 0) return;
    while (posRef.current < S) {
      posRef.current += H;
      targetRef.current += H;
    }
    while (posRef.current >= S + H) {
      posRef.current -= H;
      targetRef.current -= H;
    }
  }, []);

  /** Snap the target onto the nearest image's center. */
  const snapTargetToNearest = useCallback(() => {
    const metrics = metricsRef.current;
    if (!metrics.length) return;
    const t = targetRef.current;
    let best = t;
    let bestDist = Infinity;
    metrics.forEach((m) => {
      if (!m) return;
      const c = centerScrollFor(m);
      const d = Math.abs(c - t);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    });
    targetRef.current = best;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const armWheelSnap = useCallback(() => {
    if (wheelIdleTimer.current) clearTimeout(wheelIdleTimer.current);
    wheelIdleTimer.current = setTimeout(() => {
      wheelIdleTimer.current = null;
      snapTargetToNearest();
    }, WHEEL_IDLE_MS);
  }, [snapTargetToNearest]);

  /** Re-anchor pos/target onto the active image (after reflow/load). */
  const anchorToActive = useCallback(() => {
    if (!initializedRef.current || draggingRef.current) return;
    const original = ((activeIdxRef.current % countRef.current) + countRef.current) % countRef.current;
    const m =
      metricsRef.current[middleSetRef.current * countRef.current + original];
    if (!m) return;
    const p = centerScrollFor(m);
    posRef.current = p;
    targetRef.current = p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContentChanged = useCallback(() => {
    measure();
    anchorToActive();
  }, [measure, anchorToActive]);

  // The one animation loop.
  useEffect(() => {
    rafRef.current = requestAnimationFrame(function frame(ts: number) {
      rafRef.current = requestAnimationFrame(frame);
      const track = trackRef.current;
      if (!track || !initializedRef.current) {
        lastFrameRef.current = ts;
        measure();
        return;
      }

      const dt = Math.min(ts - lastFrameRef.current, 64) || 16;
      lastFrameRef.current = ts;

      // Spring: pos chases target with exponential smoothing (frame-rate
      // independent), settling exactly when close enough.
      const diff = targetRef.current - posRef.current;
      if (Math.abs(diff) > 0.05) {
        const s = 1 - Math.exp(-dt / TAU_MS);
        let next = posRef.current + diff * s;
        if (Math.abs(targetRef.current - next) < 0.35) next = targetRef.current;
        posRef.current = next;
      }
      wrap();
      track.style.transform = `translate3d(0, ${-posRef.current}px, 0)`;

      // Per-item edge effect + active detection from cached metrics only.
      const h = viewportHRef.current;
      const line = posRef.current + h / 2 + lineOffset();
      const maxDist = h / 2 || 1;
      const effMax = isMobileRef.current ? maxDist * 0.5 : maxDist;
      const metrics = metricsRef.current;
      const edge = edgeRef.current;
      let bestIdx = activeIdxRef.current;
      let bestDist = Infinity;

      for (let i = 0; i < itemRefs.current.length; i++) {
        const item = itemRefs.current[i];
        const m = metrics[i];
        if (!item || !m) continue;
        const d = Math.abs(m.top + m.height / 2 - line);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
        const t = Math.min(d / effMax, 1);
        const tx = Math.round(t * edge * 10) / 10;
        if (txRef.current[i] !== tx) {
          txRef.current[i] = tx;
          item.style.transform = `translateX(${tx}px)`;
        }
      }

      if (bestIdx !== activeIdxRef.current && countRef.current > 0) {
        activeIdxRef.current = bestIdx;
        onActiveChangeRef.current(
          ((bestIdx % countRef.current) + countRef.current) % countRef.current
        );
      }
    });

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [measure, wrap]);

  // Measure on mount / when the copy layout changes / on resize, then
  // re-anchor so the active image stays on the line.
  useEffect(() => {
    measure();
    anchorToActive();
  }, [measure, anchorToActive, repeatCount, count]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      isMobileRef.current = mobile;
      setIsMobile(mobile);
    };
    checkMobile();
    const handleResize = () => {
      checkMobile();
      measure();
      anchorToActive();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [measure, anchorToActive]);

  // Wheel: swallow native scrolling (React's onWheel is passive) and feed
  // deltas straight into the spring's target — direct, smooth response; an
  // idle pause snaps onto the nearest image.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // horizontal passes
      e.preventDefault();
      targetRef.current += e.deltaY;
      armWheelSnap();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelIdleTimer.current) clearTimeout(wheelIdleTimer.current);
    };
  }, [armWheelSnap]);

  // Pointer drag (touch + mouse): the target follows the finger exactly;
  // on release, flick velocity becomes momentum and the target snaps to the
  // nearest image center — the spring glides there, so the settle is soft.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      draggingRef.current = true;
      velocityRef.current = 0;
      downRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
      lastPointerRef.current = { y: e.clientY, t: performance.now() };
      if (wheelIdleTimer.current) {
        clearTimeout(wheelIdleTimer.current);
        wheelIdleTimer.current = null;
      }
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const now = performance.now();
      const dy = lastPointerRef.current.y - e.clientY; // drag up => scroll down
      const dt = now - lastPointerRef.current.t;
      if (dt > 0) {
        const v = dy / dt;
        velocityRef.current = velocityRef.current * 0.2 + v * 0.8;
      }
      targetRef.current += dy;
      lastPointerRef.current = { y: e.clientY, t: now };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      // Momentum from the flick, capped, then snap to nearest image center.
      const momentum = Math.max(
        -viewportHRef.current * 1.2,
        Math.min(viewportHRef.current * 1.2, velocityRef.current * MOMENTUM_MS)
      );
      targetRef.current += momentum;
      snapTargetToNearest();

      // Tap (not swipe)? Open the lightbox on the tapped image. Pointer
      // capture retargets events to the viewport, so the element under the
      // pointer is found geometrically via data-gallery-index.
      const dist = Math.hypot(e.clientX - downRef.current.x, e.clientY - downRef.current.y);
      const dur = performance.now() - downRef.current.t;
      if (dist <= CLICK_MAX_DRAG_PX && dur <= CLICK_MAX_MS && countRef.current > 0) {
        const hit = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest("[data-gallery-index]") as HTMLElement | null;
        if (hit?.dataset.galleryIndex) {
          const idx = Number(hit.dataset.galleryIndex);
          if (Number.isFinite(idx)) {
            onOpenLightboxRef.current(
              ((idx % countRef.current) + countRef.current) % countRef.current
            );
          }
        }
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [snapTargetToNearest]);

  // Thumbnail rail / external controls.
  useEffect(() => {
    onRegisterScrollBy((deltaY: number) => {
      targetRef.current += deltaY;
      armWheelSnap();
    });
  }, [onRegisterScrollBy, armWheelSnap]);

  useEffect(() => {
    onRegisterJumpTo((originalIndex: number) => {
      if (!initializedRef.current) return;
      // Jump to whichever rendered copy of this image is closest, keeping
      // the glide short.
      const sets = repeatCountRef.current;
      let best = middleSetRef.current * countRef.current + originalIndex;
      let bestDist = Infinity;
      for (let s = 0; s < sets; s++) {
        const m = metricsRef.current[s * countRef.current + originalIndex];
        if (!m) continue;
        const c = centerScrollFor(m);
        const d = Math.abs(c - targetRef.current);
        if (d < bestDist) {
          bestDist = d;
          best = s * countRef.current + originalIndex;
        }
      }
      const m = metricsRef.current[best];
      if (!m) return;
      targetRef.current = centerScrollFor(m);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterJumpTo]);

  if (count === 0) {
    return <div className="h-[100vh]" aria-label={`${projectName} gallery`} />;
  }

  return (
    <div
      ref={scrollRef}
      className="relative h-[100vh] overflow-hidden select-none touch-none [scrollbar-width:none]"
    >
      {/* The single moving part: one GPU transform per frame moves the whole
          track. `relative` makes it the items' offsetParent so item
          offsetTop values are track-relative content coordinates. */}
      <div ref={trackRef} className="relative will-change-transform">
        {repeated.map((src, i) => {
          const originalIdx = i % count;
          return (
            <div
              key={i}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              data-gallery-index={i}
              className="w-full cursor-zoom-in transition-opacity duration-500 ease-out"
              style={{
                opacity: originalIdx === activeIndex ? 1 : 0.4,
                transform: `translateX(${edgeTranslateX}px)`,
                willChange: "transform",
              }}
            >
              <GalleryImage
                src={src}
                alt={`${projectName} image ${originalIdx + 1}`}
                onLoad={handleContentChanged}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const [projects, setProjects] = useState<ProjectWithUrls[]>([]);
  const [loading, setLoading] = useState(true);
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(ACTIVE_INDEX_DEFAULT);
  const [thumbVirtualIndex, setThumbVirtualIndex] = useState(ACTIVE_INDEX_DEFAULT);
  const [thumbSize, setThumbSize] = useState(56);
  const jumpToRef = useRef<(originalIndex: number) => void>(() => { });
  const scrollByRef = useRef<(deltaY: number) => void>(() => { });
  const prevActiveIndexRef = useRef(ACTIVE_INDEX_DEFAULT);
  const thumbRailRef = useRef<HTMLDivElement>(null);

  const project = projects.find((p: ProjectWithUrls) => p.slug === params.slug);
  const galleryCount = project?.images.length ?? 0;

  useEffect(() => {
    getProjects().then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, [params.slug]);

  useEffect(() => {
    if (galleryCount === 0) return;
    const prevActive = prevActiveIndexRef.current;
    let delta = activeIndex - prevActive;
    if (delta > galleryCount / 2) delta -= galleryCount;
    if (delta < -galleryCount / 2) delta += galleryCount;
    prevActiveIndexRef.current = activeIndex;
    setThumbVirtualIndex((prev) => prev + delta);
  }, [activeIndex, galleryCount]);

  useEffect(() => {
    const el = thumbRailRef.current;
    if (!el) return;

    const applyWidth = (width: number) => {
      if (width > 0) setThumbSize(width);
    };

    applyWidth(el.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      applyWidth(entry.contentRect.width);
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const registerJumpTo = useCallback((fn: (originalIndex: number) => void) => {
    jumpToRef.current = fn;
  }, []);

  const registerScrollBy = useCallback((fn: (deltaY: number) => void) => {
    scrollByRef.current = fn;
  }, []);

  // FS Lightbox: the library opens when the `toggler` prop CHANGES — its
  // value is irrelevant, any flip triggers open() (confirmed in library
  // source). So we simply flip our state on every tap and never sync it
  // back on close: an onClose-driven flip would itself be a toggler change
  // and instantly REOPEN the lightbox (the "must close twice" bug). Closing
  // is handled entirely by the library (X button / Escape / backdrop).
  // `slide` (1-based) is read from current props at open time.
  const [lightboxToggler, setLightboxToggler] = useState(false);
  const [lightboxSlide, setLightboxSlide] = useState(1);
  const openLightbox = useCallback((originalIndex: number) => {
    setLightboxSlide(originalIndex + 1);
    setLightboxToggler((t) => !t);
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>
  }

  if (!project) {
    notFound();
  }

  const THUMB_SCROLL_MULTIPLIER = 4;
  const handleThumbWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    scrollByRef.current(e.deltaY * THUMB_SCROLL_MULTIPLIER);
  };

  const THUMB_GAP = 16;
  const THUMB_WINDOW = 5;
  const THUMB_STEP = thumbSize + THUMB_GAP;
  const THUMB_RADIUS = 6; // buffer beyond the visible window for smooth transitions
  const thumbWindowHeight =
    THUMB_WINDOW * thumbSize + (THUMB_WINDOW - 1) * THUMB_GAP;
  const thumbCenter = Math.round(thumbVirtualIndex);
  const thumbVirtualPositions = Array.from(
    { length: THUMB_RADIUS * 2 + 1 },
    (_, i) => thumbCenter - THUMB_RADIUS + i
  );

  const galleryImages = project.images;

  return (
    <div
      className={`min-h-screen bg-white text-black ${
        infoOpen
          ? // Info state, mobile: the whole page is locked to exactly one
            // viewport height — no page scrolling. Desktop restores the
            // original block layout via the lg: overrides.
            "flex h-screen flex-col overflow-hidden lg:block lg:h-auto lg:overflow-visible"
          : ""
      }`}
    >
      <header className="w-full relative">
        <div className="hidden absolute lg:grid grid-cols-12 gap-6 px-[120px] h-[84px] items-center">
          <Link
            href="/"
            className="col-start-1 col-span-3 text-[16px] tracking-[0.1em] flex items-baseline"
          >
            <svg width="50%" height="auto" viewBox="0 0 376 35" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.55 2.76001C16.74 0.820009 14.47 0.0400085 10.64 0.0400085H0V34.79H1.44V20.24H10.64C14.14 20.24 16.37 19.54 18.1 17.89C20 16.12 20.99 13.52 20.99 10.1C20.99 7.01001 20.17 4.62001 18.56 2.76001M17.32 16.57C15.83 18.18 13.86 18.88 10.64 18.88H1.44V1.40001H10.64C13.69 1.40001 15.42 1.94001 16.95 3.34001C18.64 4.91001 19.46 7.22001 19.46 10.1C19.46 12.98 18.72 15.05 17.32 16.57Z" fill="#231F20" />
              <path d="M45.5 19.09C49.79 18.35 51.94 15.17 51.94 9.57001C51.94 6.52001 51.3 4.30001 49.79 2.56001C48.29 0.780009 46.22 0.0400085 42.78 0.0400085H32.77V34.79H35.41V19.37H42.92L49.25 34.79H52.15L45.5 19.08V19.09ZM35.35 16.82V2.56001H42.57C47.15 2.56001 49.33 4.91001 49.33 9.73001C49.33 14.55 47.26 16.82 43.04 16.82H35.35Z" fill="#231F20" />
              <path d="M82.33 3.79C80.81 1.81 78.87 0.57 76.31 0H68.6C66.33 0.54 64.6 1.57 63.12 3.21C61.06 5.48 60.24 8.28 60.24 13.15V21.68C60.24 26.17 60.94 28.85 62.63 31.04C64.11 32.98 66.01 34.21 68.49 34.79H76.53C78.67 34.25 80.36 33.22 81.8 31.62C83.9 29.35 84.69 26.63 84.69 21.69V13.15C84.69 8.62 84.03 5.98 82.34 3.79M80.65 21.31C80.65 24.86 80.2 26.79 79.08 28.61C77.68 30.8 75.58 31.83 72.48 31.83C69.55 31.83 67.62 30.96 66.17 29.07C64.77 27.26 64.27 25.15 64.27 21.32V13.53C64.27 9.99 64.72 8.05 65.83 6.23C67.23 4.05 69.34 3.02 72.47 3.02C75.4 3.02 77.33 3.89 78.74 5.78C80.14 7.59 80.64 9.69 80.64 13.53V21.32L80.65 21.31Z" fill="#231F20" />
              <path d="M103.64 0.0400085V21.31C103.64 25.35 103.52 26.91 103.06 28.19C102.24 30.54 100.42 31.82 97.82 31.82C95.51 31.82 93.53 30.95 91.68 29.1L89.41 31.86C91.06 33.35 92.67 34.29 94.48 34.79H101.45C103.72 34.17 105.41 32.89 106.44 30.96C107.43 29.06 107.68 27.13 107.68 21.23V0.0400085H103.64Z" fill="#231F20" />
              <path d="M122.07 30.51V19.38H135.38V15.09H122.07V4.33001H137.74V0.0400085H116.88V34.8H137.86V30.51H122.07Z" fill="#231F20" />
              <path d="M162.68 25.64C162.19 29.19 159.92 31.04 155.96 31.04C150.97 31.04 149.07 28.28 149.07 20.78V14.14C149.07 6.72 150.97 3.87 155.96 3.87C159.71 3.87 161.9 5.73 162.35 9.27L167.17 8.9C166.88 3.91 164.16 0.86 159.21 0H152.28C149.85 0.49 147.95 1.61 146.51 3.34C144.57 5.65 143.83 8.53 143.83 13.81V21.06C143.83 25.97 144.41 28.69 145.97 30.96C147.37 32.9 149.23 34.17 151.66 34.79H160.32C164.81 33.72 167.29 30.79 167.53 26.17L162.67 25.63L162.68 25.64Z" fill="#231F20" />
              <path d="M172.57 0.0400085V4.33001H182.3V34.79H187.53V4.33001H197.26V0.0400085H172.57Z" fill="#231F20" />
              <path d="M227.03 14.35L238.53 0.0400085H229.75L219.57 14.06V0.0400085H212.15V34.79H219.57V22.88L222.16 19.42L230.37 34.79H239.07L227.03 14.35Z" fill="#231F20" />
              <path d="M260.88 0.0400085H253.62L241.05 34.79H249.13L251.19 28.28H263.35L265.37 34.79H273.49L260.88 0.0400085ZM253.01 22.34L257.34 8.82001L261.59 22.34H253.02H253.01Z" fill="#231F20" />
              <path d="M285.28 0.0400085H277.78V34.79H285.28V0.0400085Z" fill="#231F20" />
              <path d="M299.71 28.69L313.64 4.95001V0.0400085H291.96V6.14001H305.15L291.3 29.89V34.79H314.3V28.69H299.71Z" fill="#231F20" />
              <path d="M327.66 28.69V20.28H339.99V14.22H327.66V6.14001H342.21V0.0400085H320.24V34.79H342.42V28.69H327.66Z" fill="#231F20" />
              <path d="M367.2 0.0400085V20.32L356.56 0.0400085H348.11V34.79H356.48V14.51L367.15 34.79H375.56V0.0400085H367.2Z" fill="#231F20" />
            </svg>
          </Link>
        </div>
        <Nav2 />
      </header>
      <section
        className={`mx-auto px-0 lg:px-[120px] ${
          infoOpen ? "flex min-h-0 flex-1 flex-col lg:block" : ""
        }`}
      >
        <div
          className={`grid grid-cols-12 gap-x-4 md:gap-x-6 lg:gap-x-8 gap-y-10 ${
            infoOpen
              ? // Mobile info state: row 1 (credits) takes its natural height,
                // row 2 (info panel) fills every remaining pixel down to the
                // bottom of the 100vh page. lg: restores implicit rows.
                "min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-none"
              : ""
          }`}
        >
          {/* Columns 1–4: credits, sticky while gallery/info scrolls */}
          <div className={`col-span-12 z-49 lg:col-span-3 lg:sticky lg:top-32 lg:self-center ${infoOpen ? 'static md:pt-0 pt-26 pb-0 px-6' : 'absolute top-26 lg:w-full w-[40%] left-6 lg:static'} lg:flex flex-col`}>
            <h1 className="text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.05] mb-4">
              {project.name}
            </h1>
            {project.description && project.description.length > 0 ? (
              <div className="text-[13px]  text-black mb-6 [&>p]:mb-0 [&>h2]:text-[20px] [&>h2]:font-bold [&>h2]:text-black [&>h2]:mb-3 [&>h3]:text-[16px] [&>h3]:font-bold [&>h3]:text-black [&>h3]:mb-2 [&>blockquote]:border-l-2 [&>blockquote]:border-black/20 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:mb-3 [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-bold [&_em]:italic">
                <PortableText value={project.description} />
              </div>
            ) : null}

            {/* Label is intentionally static — clicking still toggles the
                panel, but the text always reads "// Info +" per the
                wireframe, so it never duplicates the centered
                "// Back to image" button below the info panel. */}

            {!infoOpen && (
              <button
                type="button"
                onClick={() => setInfoOpen((v) => !v)}
                className="text-[13px] font-semibold border-b border-neutral-900 pb-1 hover:opacity-60 transition-opacity self-start"
              >
                &#47;&#47; Info +
              </button>
            )}
            <Link
              href="/projects"
              aria-label="Back to projects"
              className="fixed bottom-[35.5px] lg:left-[120px] left-6 hover:opacity-60 transition-opacity self-start"
            >
              <svg width="32" height="22" viewBox="0 0 64 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4.24 25.89L21.64 43.29L25.88 39.04L14.61 27.78H10.33V24.65H11.48H64V18.65H11.49H10.33V15.52H14.61L25.89 4.24L21.65 0L4.24 17.41L0 21.65L4.24 25.89Z" fill="black" />
              </svg>
            </Link>
          </div>

          {!infoOpen ? (
            <>
              {/* Column 5: thumbnail rail — width is measured from this
                  column so each thumbnail matches it exactly and stays
                  square (aspect-square + equal width/height below) */}
              <div
                ref={thumbRailRef}
                className="hidden lg:col-start-5 lg:col-span-1 lg:flex lg:sticky lg:top-32 lg:self-center"
                style={{ height: thumbWindowHeight, overflow: "hidden" }}
                onWheel={handleThumbWheel}
              >
                <div
                  className="relative w-full transition-transform duration-500 ease-out"
                  style={{
                    transform: `translateY(${thumbWindowHeight / 2 -
                      thumbSize / 2 -
                      thumbVirtualIndex * THUMB_STEP
                      }px)`,
                  }}
                >
                  {thumbVirtualPositions.map((virtualPos) => {
                    const originalIdx =
                      ((virtualPos % galleryImages.length) + galleryImages.length) %
                      galleryImages.length;
                    const steps = Math.abs(virtualPos - thumbVirtualIndex);
                    const opacity =
                      steps < 0.5 ? 1 : steps < 1.5 ? 0.5 : steps < 2.5 ? 0.2 : 0.05;
                    return (
                      <button
                        key={virtualPos}
                        type="button"
                        onClick={() => jumpToRef.current(originalIdx)}
                        aria-label={`Jump to image ${originalIdx + 1}`}
                        aria-current={originalIdx === activeIndex}
                        className="absolute left-0 aspect-square w-full overflow-hidden transition-all duration-500 ease-out"
                        style={{
                          top: virtualPos * THUMB_STEP,
                          height: thumbSize,
                          opacity,
                        }}
                      >
                        <ThumbnailImage
                          src={galleryImages[originalIdx]}
                          alt={`${project.name} thumbnail ${originalIdx + 1}`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 6 is deliberately empty in the wireframe */}
              <div className="hidden lg:block lg:col-span-1" aria-hidden />

              {/* Columns 7–12, pulled left by one gutter to sit flush on
                  the column 6/7 divider instead of leaving a gap */}
              <div className="col-span-12 lg:col-start-7 lg:col-span-6 lg:-ml-8 lg:w-[calc(100%+2rem)]">
                <InfiniteGallery
                  images={galleryImages}
                  projectName={project.name}
                  activeIndex={activeIndex}
                  onActiveIndexChange={setActiveIndex}
                  onRegisterJumpTo={registerJumpTo}
                  onRegisterScrollBy={registerScrollBy}
                  onOpenLightbox={openLightbox}
                />
              </div>
            </>
          ) : (
            /* Info state: flush against the credits column, 100px padding
               per the wireframe's dimension arrows, fixed height with
               internal scroll so the page height doesn't jump. Crosshair
               "+" corners mirror the ones used on the People page — same
               relative wrapper + four absolutely-positioned corner marks. */
            <div className="col-span-12 flex h-full min-h-0 flex-col justify-between lg:col-start-5 lg:col-span-8 lg:h-screen">
              <div className="mt-0 lg:mt-[34px] flex flex-col items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setInfoOpen(false)}
                  className="text-[13px] font-semibold hover:opacity-60 transition-opacity text-black/50"
                >
                     &#47;&#47; Info + 
                </button>

              </div>
              {/* Mobile: the frame itself flexes to fill the leftover space
                  between the two buttons; its height (not the page) bounds
                  the text. Desktop keeps the content-hugging frame. */}
              <div className="relative w-full min-h-0 flex-1 lg:flex-none">
                {/* Dedicated crosshair layer — a single extra div, absolutely
                    covering the frame via inset-0, holding all four "+"
                    marks. Rendered on mobile AND desktop (same treatment as
                    the People page's framed detail views). Because THIS
                    layer is absolutely positioned, it never contributes to
                    the parent's auto-height, and because it's separate from
                    the scroll box below, it can't interfere with that box's
                    own overflow/padding rendering. */}
                <div className="absolute inset-6 pointer-events-none">
                  <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-4xl font-light font-fraunces">+</div>
                  <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-4xl font-light font-fraunces">+</div>
                  <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-4xl font-light font-fraunces">+</div>
                  <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-4xl font-light font-fraunces">+</div>
                </div>

                {/* Mobile: padding wrapper + scroll box are h-full, so the
                    text scrolls INSIDE the crosshair frame. Desktop: back to
                    the content-height box with the calc() max-h ceiling. */}
                <div className="h-full px-16 py-12 lg:h-auto lg:p-[40px]">
                  <div className="h-full w-full lg:h-auto lg:max-h-[calc(100vh-300px)] scrollbar-none overflow-y-auto space-y-6">
                    {project.info && project.info.length > 0 ? (
                      <div className="text-[15px] text-justify leading-[1.3] text-black font-display [&>p]:mb-4 [&>h2]:text-[20px] [&>h2]:font-bold [&>h2]:text-black [&>h2]:mb-3 [&>h3]:text-[16px] [&>h3]:font-bold [&>h3]:text-black [&>h3]:mb-2 [&>blockquote]:border-l-2 [&>blockquote]:border-black/20 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:mb-4 [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-bold [&_em]:italic">
                        <PortableText value={project.info} />
                      </div>
                    ) : (
                      <>
                        {/* Placeholder until Project Info is filled in the CMS. */}
                        {[0, 1, 2].map((i) => (
                          <p key={i} className="text-[15px] leading-[1.3] text-justify font-display text-black">
                            Lorem ipsum dolor sit amet, consectetuer adipiscing elit,
                            sed diam nonummy nibh euismod tincidunt ut laoreet dolore
                            magna aliquam erat volutpat. Ut wisi enim ad minim
                            veniam, quis nostrud exerci tation ullamcorper suscipit
                            lobortis nisl ut aliquip ex ea commodo consequat. Duis
                            autem vel eum iriure dolor in hendrerit in vulputate
                            velit esse molestie consequat, vel illum dolore eu
                            feugiat nulla facilisis at vero eros et accumsan et
                            iusto odio dignissim qui blandit praesent luptatum
                            zzril delenit augue duis dolore te feugait nulla
                            facilisi.
                          </p>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="mb-[35.5px] flex flex-col items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setInfoOpen(false)}
                  className="text-[13px] font-semibold hover:opacity-60 transition-opacity"
                >
                  &#47;&#47; BACK TO IMAGE
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Fullscreen lightbox (FS Lightbox) — always mounted; opens on any
          toggler flip, at the chosen 1-based slide. */}
      <FsLightbox
        toggler={lightboxToggler}
        sources={galleryImages}
        slide={lightboxSlide}
      />
    </div>
  );
}
