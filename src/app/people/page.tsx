"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getPeople, PersonWithUrls } from "@/lib/data";
import Nav from "@/components/Nav";

const FALLBACK_BIO =
  "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut\nLorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in";

// Both layers below share this exact class string for their grid container
// (grid-cols-12 / gap-6 / px-[120px] / pt-[8vh] / pb-[8vh]) so the photo
// clip boundary and the crosshair frame are driven by the SAME padding box
// and can never drift apart from one another.
const FRAME_GRID =
  "grid grid-cols-12 gap-6 px-[120px] pt-[8vh] pb-[8vh]";

export default function PeoplePage() {
  const [list, setList] = useState<PersonWithUrls[]>([]);
  const [activeSlug, setActiveSlug] = useState<string>("");
  const [loading, setLoading] = useState(true);
  // Mobile-only: toggles between the team list and a single person's detail view
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  useEffect(() => {
    getPeople().then((data) => {
      setList(data);
      setActiveSlug(data[0]?.slug ?? "");
      setLoading(false);
    });
  }, []);

  const active = list.find((p) => p.slug === activeSlug) ?? list[0];

  const selectPersonMobile = (slug: string) => {
    setActiveSlug(slug);
    setMobileView("detail");
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <main className="relative h-[100svh] w-full bg-white text-black font-sans overflow-hidden">
      <Nav />

      {/* =========================================
          DESKTOP — two overlapping grids below the header,
          both pinned to the SAME grid-cols-12 / gap-6 / px-[120px] /
          pt-[8vh] / pb-[8vh] tracks so nothing can drift out of alignment.
      ========================================= */}
      <div className="hidden lg:block absolute inset-0 top-[84px]">

        {/* 1. SCROLL LAYER — the actual photo grid, clipped to the frame */}
        <div className={`absolute inset-0 ${FRAME_GRID} z-10 pointer-events-none`}>
          <div className="col-start-5 col-span-8 h-full overflow-y-auto [&::-webkit-scrollbar]:hidden pointer-events-auto">
            {/* Subdividing this 8-col box into its own grid-cols-8/gap-6 keeps
        each sub-column exactly the same width as the parent's columns
        (8c+7g is constant either way), so insetting into col-start-2/
        col-span-6 leaves a true one-column gap on each side that stays
        locked to the crosshair frame at any viewport width. */}
            <div className="grid grid-cols-8 gap-6">
              <div className="col-start-2 col-span-6 pt-6 pb-6">
                <div className="grid grid-cols-3 gap-x-6 gap-y-10 content-start">
                  {list.map((p) => (
                    <button
                      key={p.slug}
                      onMouseEnter={() => setActiveSlug(p.slug)}
                      onClick={() => setActiveSlug(p.slug)}
                      className="text-left"
                    >
                      <div
                        className="w-full aspect-square transition-all duration-300 relative"
                        style={{
                          filter: activeSlug === p.slug ? "saturate(1)" : "saturate(0)",
                          opacity: activeSlug === p.slug ? 1 : 0.85,
                        }}
                      >
                        <Image
                          src={p.image || "/placeholder.jpg"}
                          alt={p.name}
                          fill
                          sizes="(min-width: 1024px) 33vw, 50vw"
                          className="object-cover"
                        />
                      </div>
                      <p className="mt-3 text-[15px] font-bold text-center">{p.name}</p>
                      <p className="text-[14px] text-black/50 text-center">{p.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. FIXED UI LAYER — bio text + crosshairs, pinned to row-start-1
            so it can never be pushed into a second implicit row. */}
        <div className={`absolute inset-0 ${FRAME_GRID} grid-rows-1 z-20 pointer-events-none`}>
          <div className="col-start-1 col-span-3 row-start-1 h-full pointer-events-auto overflow-y-auto [&::-webkit-scrollbar]:hidden flex flex-col justify-center">
            <h1 className="text-[28px] font-bold leading-tight">{active?.name}</h1>
            <p className="text-[18px] text-black/60 mt-1">{active?.title}</p>
            <p className="font-display text-[15px] leading-[1.6] mt-10 whitespace-pre-line">
              {active?.bio ?? FALLBACK_BIO}
            </p>
          </div>

          {/* Crosshair frame — sits in the same row/track as the scroll
              layer above, so the "+" corners always sit exactly at the
              clip boundary defined by the shared pt-[8vh]/pb-[8vh]. */}
          <div className="col-start-5 col-span-8 row-start-1 relative h-full">
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-2xl font-light text-black/40">+</div>
            <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-2xl font-light text-black/40">+</div>
            <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-2xl font-light text-black/40">+</div>
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-2xl font-light text-black/40">+</div>
          </div>
        </div>
      </div>

      {/* =========================================
          MOBILE — toggles between a team list and a single
          person's crosshair-framed detail view.
      ========================================= */}
      <div className="lg:hidden absolute inset-0 top-20 overflow-y-auto px-15 pt-20 pb-16">
        {mobileView === "detail" ? (
          <>
            {/* Crosshair-framed detail view for the active person */}
            <div className="relative pb-10">
              <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-xl font-light text-black/40">+</div>
              <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-xl font-light text-black/40">+</div>
              <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-xl font-light text-black/40">+</div>
              <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-xl font-light text-black/40">+</div>

              <div className="p-15 flex flex-col items-center text-center">
                <div className="w-3/5 aspect-square relative mb-6">
                  <Image
                    src={active?.image || "/placeholder.jpg"}
                    alt={active?.name ?? ""}
                    fill
                    sizes="60vw"
                    className="object-cover"
                  />
                </div>
                <h1 className="text-[17px] font-bold leading-tight">{active?.name}</h1>
                <p className="text-[15px] text-black/50 mb-8">{active?.title}</p>
                <p className="font-display text-[14px] leading-[1.6] text-justify whitespace-pre-line">
                  {active?.bio ?? FALLBACK_BIO}
                </p>
              </div>
            </div>

            <button
              onClick={() => setMobileView("list")}
              className="pt-10 block text-[15px] font-bold uppercase tracking-wide"
            >
               Back to team
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-12">
            {list.map((p) => (
              <button
                key={p.slug}
                onClick={() => selectPersonMobile(p.slug)}
                className="flex items-center gap-6 text-left"
              >
                <div className="w-[45%] aspect-square relative shrink-0">
                  <Image
                    src={p.image || "/placeholder.jpg"}
                    alt={p.name}
                    fill
                    sizes="45vw"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-[17px] font-bold">{p.name}</p>
                  <p className="text-[15px] text-black/50">{p.title}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}