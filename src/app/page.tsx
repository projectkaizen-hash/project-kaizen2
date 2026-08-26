"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getProjects, ProjectWithUrls } from "@/lib/data";
import Nav from "@/components/Nav3";

export default function Home() {
  const [projects, setProjects] = useState<ProjectWithUrls[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjects().then((data) => {
      setProjects(data);
      setLoading(false);
    });
  }, []);

  // 1. Massive array (100 sets) to create a flawless, native CSS infinite scroll
  // without any JavaScript teleportation glitches.
  const extendedProjects = Array.from({ length: 100 }).flatMap((_, setIndex) =>
    projects.slice(0, 5).map((p, i) => ({ ...p, uniqueId: `set${setIndex}-${i}`, realIndex: i }))
  );

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const containerRefDesktop = useRef<HTMLDivElement>(null);
  const containerRefMobile = useRef<HTMLDivElement>(null);
  const itemRefsDesktop = useRef<(HTMLAnchorElement | null)[]>([]);
  const itemRefsMobile = useRef<(HTMLAnchorElement | null)[]>([]);

  // 2. Start perfectly in the middle of the massive array on load
  useEffect(() => {
    const startInMiddle = (container: HTMLDivElement | null, refs: (HTMLAnchorElement | null)[]) => {
      if (!container) return;
      const middleIndex = Math.floor(extendedProjects.length / 2);
      const middleElement = refs[middleIndex];
      if (middleElement) {
        middleElement.scrollIntoView({ block: "center", inline: "center" });
      }
    };

    startInMiddle(containerRefDesktop.current, itemRefsDesktop.current);
    startInMiddle(containerRefMobile.current, itemRefsMobile.current);
  }, [extendedProjects.length]);

  // 3. Track strictly the center item.
  // IMPORTANT: root is scoped to each scroll container (not the viewport),
  // and rootMargin is collapsed to a thin band around the vertical center
  // of that container. This guarantees the item highlighted is the one
  // actually passing through the middle (where the crosshair frame sits),
  // not just whichever item happens to be 60% visible on screen.
  useEffect(() => {
    const desktopObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            setActiveIndex(index);
          }
        });
      },
      {
        root: containerRefDesktop.current,
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      }
    );

    const mobileObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            setActiveIndex(index);
          }
        });
      },
      {
        root: containerRefMobile.current,
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      }
    );

    itemRefsDesktop.current.forEach((ref) => ref && desktopObserver.observe(ref));
    itemRefsMobile.current.forEach((ref) => ref && mobileObserver.observe(ref));

    return () => {
      desktopObserver.disconnect();
      mobileObserver.disconnect();
    };
  }, [extendedProjects.length]);

  return (
    <main className="relative h-[100svh] w-full bg-white text-black font-sans overflow-hidden">
      <Nav />

      {/* =========================================
          MOBILE VIEWPORT (6 Column Grid)
      ========================================= */}
      <div className="lg:hidden w-full h-full flex flex-col relative z-20">
        <div className="w-full h-full grid grid-cols-4 gap-4 px-6 pt-20 relative pointer-events-none">
          {/* Main Mobile Scrolling Container - spans columns 2,3,4,5 */}
          <div
            ref={containerRefMobile}
            className="col-start-2 col-span-2 h-full overflow-y-auto snap-y snap-mandatory [&::-webkit-scrollbar]:hidden pointer-events-auto"
          >
            <div className="w-full shrink-0" style={{ paddingTop: "calc(50svh - 50%)" }}></div>

            {extendedProjects.map((p, i) => (
              <Link
                key={p.uniqueId}
                href={`/projects/${p.slug}`}
                data-index={i}
                ref={(el) => { itemRefsMobile.current[i] = el; }}
                className="block w-full aspect-square mb-4 snap-center transition-all duration-300 ease-out relative"
                style={{
                  filter: activeIndex === i ? "saturate(1)" : "saturate(0)",
                  opacity: activeIndex === i ? 1 : 0.5
                }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={p.thumbnail}
                    alt={p.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, 80vw"
                    className="object-cover"
                  />
                </div>
              </Link>
            ))}

            <div className="w-full shrink-0" style={{ paddingBottom: "calc(50svh - 50%)" }}></div>
          </div>

          {/* Mobile Crosshair Frame */}
          <div className="absolute left-[60px] right-[60px] top-[calc(50svh+40px)] -translate-y-1/2 h-[30vh] pointer-events-none">
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-2xl font-light text-black/40">+</div>
            <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-2xl font-light text-black/40">+</div>
            <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-2xl font-light text-black/40">+</div>
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-2xl font-light text-black/40">+</div>
          </div>
        </div>
      </div>

      {/* =========================================
          DESKTOP VIEWPORT - PERFECT 12-COLUMN GRID
          Grid measured directly off "Guides and Clues on"-01.png:
            - side margin  = 120px  (was px-12/48px — the main mismatch)
            - gutter       =  24px  (gap-6 — already correct)
            - crosshairs sit exactly ON the col-5-start / col-8-end lines,
              no manual offset needed once the frame itself is 4 columns wide
            - the visible square is inset by exactly ONE column from that
              frame on each side (it does NOT fill the full col-span-4 box)

          FIX (this pass): the UI layer below had no explicit row track.
          Two children both started at col-start-1 (the paragraph,
          col-span-3, and the logo, col-span-4) with overlapping column
          ranges. CSS Grid auto-placement will not stack overlapping
          items in the same implicit row, so the logo was silently
          pushed into a *second*, content-sized row instead of the
          full-height row — which is why `h-full`/`items-center` on the
          logo had no visible effect and everything read as vertically
          misaligned against the image and crosshairs. Fix: declare a
          single explicit row (`grid-rows-1`) on the container and pin
          every direct child to it (`row-start-1`), so overlap no longer
          creates new rows and `h-full` means the full inset-0 height.
      ========================================= */}

      {/* 1. SCROLLING LAYER (Placed behind UI to allow clicking) */}
      <div className="hidden lg:grid absolute inset-0 grid-cols-12 gap-6 px-[120px] z-10 pointer-events-auto">
        <div
          ref={containerRefDesktop}
          className="col-start-5 col-span-4 h-full overflow-y-auto snap-y snap-mandatory [&::-webkit-scrollbar]:hidden"
        >
          <div className="w-full shrink-0 pointer-events-none" style={{ paddingTop: "calc(50svh - 50%)" }}></div>

          {extendedProjects.map((p, i) => (
            <Link
              key={p.uniqueId}
              href={`/projects/${p.slug}`}
              data-index={i}
              ref={(el) => { itemRefsDesktop.current[i] = el; }}
              className="block aspect-square mx-auto mb-1 snap-center transition-all duration-300 ease-out relative"
              style={{
                // Frame (this container) = col-span-4 = 4 columns + 3 gutters.
                // Wireframe shows the photo inset by exactly one column width
                // on each side, i.e. frame-width minus 2 columns. Since
                // column = (100% - 3*gutter) / 4, that simplifies to a clean
                // 50% + 1.5*gutter. Gutter is gap-6 = 24px, so 1.5*24 = 36px.
                width: "calc(50% + 36px)",
                filter: activeIndex === i ? "saturate(1)" : "saturate(0)",
                opacity: activeIndex === i ? 1 : 0.5
              }}
            >
              <div className="relative w-full h-full">
                <Image
                  src={p.thumbnail}
                  alt={p.name}
                  fill
                  sizes="(min-width: 1024px) 25vw, 80vw"
                  className="object-cover"
                />
              </div>
            </Link>
          ))}

          <div className="w-full shrink-0 pointer-events-none" style={{ paddingBottom: "calc(50svh - 50%)" }}></div>
        </div>
      </div>

      {/* 2. FIXED UI LAYER (Typography, Crosshairs, Links) */}
      <div className="hidden lg:grid absolute inset-0 grid-cols-12 grid-rows-1 gap-6 px-[120px] z-20 pointer-events-none">

        {/* Top Left Text (Spans cols 1-3 exactly per wireframe) */}
        <div className="col-start-1 col-span-3 row-start-1 pt-[5vh]">
          <p className="font-display text-black pointer-events-auto text-[18px] leading-[1.3]">
            Lorem ipsum dolor sit amet,
            consectetuer adipiscing elit, sed diam
            nonummy nibh euismod tincidunt ut
            laoreet dolore magna aliquam erat
            volutpat. Ut wisi enim ad minim veniam,
          </p>
        </div>

        {/* Center Left Logo (Spans cols 1-4) */}
        <div className="col-start-1 col-span-3 row-start-1 flex items-center h-full pointer-events-auto text-[2.1rem] whitespace-nowrap leading-none pb-[33.6px] tracking-tight">
          <Link href="/">
            <svg width="100%" height="auto" viewBox="0 0 376 35" fill="none" xmlns="http://www.w3.org/2000/svg">
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


        <div className="col-start-5 col-span-4 row-start-1 relative mt-[30vh] h-[40vh]">
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-2xl font-light text-black/40">+</div>
          <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-2xl font-light text-black/40">+</div>
          <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-2xl font-light text-black/40">+</div>
          <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-2xl font-light text-black/40">+</div>
        </div>

        {/* Right Navigation Links (Cols 10, 11, 12 exactly per wireframe) */}
        <div className="col-start-10 col-span-1 row-start-1 flex flex-col justify-center h-full relative">
          <Link href="/projects" className="text-[15px] font-medium uppercase pointer-events-auto hover:opacity-50 transition-opacity text-end pb-[33.6px]">
            PROJECTS
          </Link>
        </div>

        <div className="col-start-11 col-span-1 row-start-1 flex flex-col justify-center h-full relative">
          <Link href="/people" className="text-[15px] font-medium uppercase pointer-events-auto hover:opacity-50 transition-opacity text-end pb-[33.6px]">
            PEOPLE
          </Link>
        </div>

        <div className="col-start-12 col-span-1 row-start-1 flex flex-col justify-center h-full relative">
          <Link href="/process" className="text-[15px] font-medium uppercase pointer-events-auto hover:opacity-50 transition-opacity text-end pb-[33.6px]">
            PROCESS
          </Link>
          <Link href="/contact" className="absolute bottom-[5vh] right-0 text-[15px] font-medium uppercase pointer-events-auto hover:opacity-50 transition-opacity">
            CONTACT
          </Link>
        </div>

      </div>
    </main>
  );
}