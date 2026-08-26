"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getProjects, ProjectWithUrls } from "@/lib/data";
import Nav2 from "@/components/Nav3";

const ACTIVE_INDEX_DEFAULT = 0;
const REPEAT_COUNT = 3; // real copy + one buffer copy above + one below
const MIDDLE_SET = 1; // index of the "real" copy among the 3 rendered copies
const EDGE_TRANSLATE_X = 50; // px offset applied as an image enters/leaves the screen (desktop)

// Mobile-specific configuration: 3 top, 1 middle (real), 1 bottom
const MOBILE_REPEAT_COUNT = 5;
const MOBILE_MIDDLE_SET = 3;
const MOBILE_EDGE_TRANSLATE_X = 190; // px offset for mobile

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
 * Hand-rolled infinite vertical scroll gallery. See the file header comment
 * for the full explanation of how the loop and sizing work.
 */
function InfiniteGallery({
  images,
  projectName,
  activeIndex,
  onActiveIndexChange,
  onRegisterJumpTo,
  onRegisterScrollBy,
}: {
  images: string[];
  projectName: string;
  activeIndex: number;
  onActiveIndexChange: (i: number) => void;
  onRegisterJumpTo: (fn: (originalIndex: number) => void) => void;
  onRegisterScrollBy: (fn: (deltaY: number) => void) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const middleSetHeight = useRef(0);
  const rafId = useRef<number | null>(null);
  const initialized = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  const count = images.length;
  const repeatCount = isMobile ? MOBILE_REPEAT_COUNT : REPEAT_COUNT;
  const middleSet = isMobile ? MOBILE_MIDDLE_SET : MIDDLE_SET;
  const edgeTranslateX = isMobile ? MOBILE_EDGE_TRANSLATE_X : EDGE_TRANSLATE_X;
  const repeated = Array.from({ length: repeatCount }, () => images).flat();

  const measureAndPlace = useCallback(() => {
    const el = scrollRef.current;
    const start = itemRefs.current[middleSet * count];
    const end = itemRefs.current[middleSet * count + count - 1];
    if (!el || !start || !end) return;

    const height = end.offsetTop + end.offsetHeight - start.offsetTop;
    if (height <= 0) return;
    middleSetHeight.current = height;

    if (!initialized.current) {
      const mobileOffset = isMobile ? el.clientHeight * 0.3 : 0;
      el.scrollTop =
        start.offsetTop - el.clientHeight / 2 + start.offsetHeight / 2 + mobileOffset;
      initialized.current = true;
    }
  }, [count, middleSet, isMobile]);

  const recomputeActive = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const containerRect = el.getBoundingClientRect();
    const mobileOffset = isMobile ? containerRect.height * 0.2 : 0;
    const centerY = containerRect.top + containerRect.height / 2 + mobileOffset;

    let closestIdx = 0;
    let closestDist = Infinity;
    itemRefs.current.forEach((item, idx) => {
      if (!item) return;
      const r = item.getBoundingClientRect();
      const itemCenter = r.top + r.height / 2;
      const dist = Math.abs(itemCenter - centerY);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = idx;
      }
    });
    onActiveIndexChange(closestIdx % count);
  }, [count, onActiveIndexChange, isMobile]);

  // Scroll-linked translateX: 0px when an item's center is aligned with the
  // viewport center, easing out to EDGE_TRANSLATE_X as it approaches the
  // top or bottom edge — i.e. the same 50px offset whether the image is
  // entering the screen or on its way out, with 0px at the midpoint.
  const updateTransforms = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const containerRect = el.getBoundingClientRect();
    const mobileOffset = isMobile ? containerRect.height * 0.2 : 0;
    const centerY = containerRect.top + containerRect.height / 2 + mobileOffset;
    const maxDist = containerRect.height / 2 || 1;

    itemRefs.current.forEach((item) => {
      if (!item) return;
      const r = item.getBoundingClientRect();
      const itemCenter = r.top + r.height / 2;
      const dist = Math.abs(itemCenter - centerY);
      // On mobile, reach full offset at 70% of max distance (30% before edge)
      const effectiveMaxDist = isMobile ? maxDist * 0.5 : maxDist;
      const t = Math.min(dist / effectiveMaxDist, 1);
      const translateX = t * edgeTranslateX;
      const transform = isMobile 
        ? `translateX(${translateX}px) scale(${1 - t * 0})`
        : `translateX(${translateX}px)`;
      item.style.transform = transform;
    });
  }, [isMobile, edgeTranslateX]);

  const recomputeAll = useCallback(() => {
    recomputeActive();
    updateTransforms();
  }, [recomputeActive, updateTransforms]);

  // Measure once on mount, then again every time an image finishes loading
  // (heights aren't known before that), and on resize.
  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const id = requestAnimationFrame(() => {
      measureAndPlace();
      updateTransforms();
    });

    const imgs = Array.from(el.querySelectorAll("img"));
    const pending = imgs.filter((img) => !img.complete);
    const handleImgLoad = () => {
      measureAndPlace();
      updateTransforms();
    };
    pending.forEach((img) => img.addEventListener("load", handleImgLoad));

    const handleResize = () => {
      measureAndPlace();
      updateTransforms();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(id);
      pending.forEach((img) => img.removeEventListener("load", handleImgLoad));
      window.removeEventListener("resize", handleResize);
    };
  }, [measureAndPlace, updateTransforms]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !middleSetHeight.current) return;

    // Silent wrap: jump exactly one copy's height when we've scrolled into
    // a buffer copy. Because the buffer copy is pixel-identical to the real
    // copy it mirrors, this is invisible.
    if (el.scrollTop <= 0) {
      el.scrollTop += middleSetHeight.current;
    } else if (el.scrollTop >= el.scrollHeight - el.clientHeight) {
      el.scrollTop -= middleSetHeight.current;
    }

    if (rafId.current) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      recomputeAll();
    });
  }, [recomputeAll]);

  useEffect(() => {
    onRegisterScrollBy((deltaY: number) => {
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop += deltaY;
      handleScroll();
    });
  }, [onRegisterScrollBy, handleScroll]);

  useEffect(() => {
    onRegisterJumpTo((originalIndex: number) => {
      const el = scrollRef.current;
      if (!el) return;

      // Jump to whichever of the rendered copies of this image is
      // closest to the current scroll position, to keep the scroll short.
      const candidates = Array.from({ length: repeatCount }, (_, i) => i).map((set) => set * count + originalIndex);
      let best = candidates[middleSet];
      let bestDist = Infinity;
      candidates.forEach((idx) => {
        const item = itemRefs.current[idx];
        if (!item) return;
        const dist = Math.abs(item.offsetTop - el.scrollTop);
        if (dist < bestDist) {
          bestDist = dist;
          best = idx;
        }
      });

      const target = itemRefs.current[best];
      if (!target) return;
      el.scrollTo({
        top: target.offsetTop - el.clientHeight / 2 + target.offsetHeight / 2,
        behavior: "smooth",
      });
    });
  }, [count, repeatCount, middleSet, onRegisterJumpTo]);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="h-[100vh] overflow-y-scroll overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {repeated.map((src, i) => {
        const originalIdx = i % count;
        return (
          <div
            key={i}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            className="w-full transition-opacity duration-500 ease-out"
            style={{
              opacity: originalIdx === activeIndex ? 1 : 0.4,
              transform: `translateX(${EDGE_TRANSLATE_X}px)`,
              willChange: "transform",
            }}
          >
            <GalleryImage
              src={src}
              alt={`${projectName} image ${originalIdx + 1}`}
              onLoad={measureAndPlace}
            />
          </div>
        );
      })}
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
      console.log('Fetched projects:', data.map(p => ({ slug: p.slug, name: p.name })));
      console.log('Looking for slug:', params.slug);
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
    <div className="min-h-screen bg-white text-black">
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
      <section className="mx-auto px-0 lg:px-[120px]">
        <div className="grid grid-cols-12 gap-x-4 md:gap-x-6 lg:gap-x-8 gap-y-10">
          {/* Columns 1–4: credits, sticky while gallery/info scrolls */}
          <div className={`col-span-12 lg:col-span-3 lg:sticky lg:top-32 lg:self-center ${infoOpen ? 'static pt-26 pb-0 px-6' : 'absolute top-26 lg:w-full w-[40%] left-6 lg:static'} lg:flex flex-col`}>
            <h1 className="text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.05] mb-4">
              {project.name}
            </h1>
            <p className="text-[12px] lg:text-[15px] text-neutral-600 mb-1">
              {project.categoryLabel}
            </p>
            {project.year ? (
              <p className="text-[12px] lg:text-[15px] text-neutral-600 lg:mb-8 mb-4">{project.year}</p>
            ) : null}
            {project.link ? (
              <p className="text-[11px] lg:text-[13px] lg:mb-8 mb-4">
                <a
                  href={project.link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold border-b border-neutral-900 pb-1 hover:opacity-60 transition-opacity"
                >
                  {project.link.label}
                </a>
              </p>
            ) : null}
            <p className="text-[13px] mb-4 lg:mb-10">
              <span className="font-semibold">Team: </span>
              <span className="text-neutral-600">{project.team.join(", ")}</span>
            </p>

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
                {"Info +"}
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
                />
              </div>
            </>
          ) : (
            /* Info state: flush against the credits column, 100px padding
               per the wireframe's dimension arrows, fixed height with
               internal scroll so the page height doesn't jump. Crosshair
               "+" corners mirror the ones used on the People page — same
               relative wrapper + four absolutely-positioned corner marks. */
            <div className="col-span-12 lg:col-start-5 lg:col-span-8 lg:h-screen lg:flex lg:flex-col lg:justify-between">
              <div className="mt-0 lg:mt-[34px] flex flex-col items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setInfoOpen(false)}
                  className="text-[13px] font-semibold hover:opacity-60 transition-opacity"
                >
                     Info + 
                </button>

              </div>
              <div className="relative w-full">
                {/* Dedicated crosshair layer — a single extra div, absolutely
                    covering the frame via inset-0, holding all four "+"
                    marks. Because THIS layer is absolutely positioned, it
                    never contributes to the parent's auto-height, and
                    because it's separate from the scroll box below, it
                    can't interfere with that box's own overflow/padding
                    rendering the way it did when the marks lived directly
                    alongside the box. */}
                <div className="hidden lg:block absolute inset-0 pointer-events-none">
                  <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-2xl font-light text-black/40">+</div>
                  <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-2xl font-light text-black/40">+</div>
                  <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-2xl font-light text-black/40">+</div>
                  <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-2xl font-light text-black/40">+</div>
                </div>

                {/* overflow-y-auto restored, with a plain max-h value
                    (no calc()) — calc() inside a Tailwind arbitrary value
                    kept failing to apply reliably, so this sidesteps that
                    entirely while still giving the box a real ceiling to
                    scroll within. */}
                <div className="p-[20px] lg:p-[100px]">
                  <div className="w-full lg:max-h-[calc(100vh-450px)] scrollbar-none overflow-y-auto space-y-6">
                    {[0, 1, 2].map((i) => (
                      <p key={i} className="text-[15px] leading-relaxed text-neutral-700">
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
                  </div>
                </div>
              </div>
              <div className="mb-[35.5px] flex flex-col items-center gap-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setInfoOpen(false)}
                  className="text-[13px] font-semibold hover:opacity-60 transition-opacity"
                >
                  Back to image
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}