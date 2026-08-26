"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Image from "next/image";
import { getProjects, ProjectCategory, ProjectType, ProjectWithUrls } from "@/lib/data";

const types: { key: ProjectType | "all"; label: string }[] = [
  { key: "all", label: "/all" },
  { key: "competition", label: "/competition" },
  { key: "building", label: "/building" },
  { key: "interior", label: "/interior" },
];

const categories: { key: ProjectCategory; label: string; colStart?: string; isCenter?: boolean }[] = [
  { key: "architecture", label: "architecture", colStart: "lg:col-start-2" },
  { key: "graphic design", label: "graphic design", isCenter: true },
  { key: "speculatives", label: "speculatives", colStart: "lg:col-start-10" },
];

const TOTAL_SLOTS = 6; // 12 columns / 2 per image
const GAP_SLOTS = 2; // slot-widths reserved as empty space for the title
const CYCLE = TOTAL_SLOTS - GAP_SLOTS; // 4 distinct positions the title/gap can take

// Mobile mirrors the desktop staggered logic, scaled to a 4-column grid:
// 2 slots for the title, 1 active (full-opacity) image, 1 faded image.
const MOBILE_TOTAL_SLOTS = 4;
const MOBILE_GAP_SLOTS = 2;
const MOBILE_CYCLE = MOBILE_TOTAL_SLOTS - MOBILE_GAP_SLOTS; // 2 distinct positions

export default function ProjectsPage() {
  const [type, setType] = useState<ProjectType | "all">("all");
  const [category, setCategory] = useState<ProjectCategory>("architecture");
  const [projects, setProjects] = useState<ProjectWithUrls[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const filtered = useMemo(
    () =>
      projects.filter(
        (p: ProjectWithUrls) => (type === "all" || p.type === type) && p.category === category
      ),
    [type, category, projects]
  );

  const scrollByAmount = (dir: 1 | -1) =>
    scrollRef.current?.scrollBy({ top: dir * 360, behavior: "smooth" });

  return (
    <main className="relative h-[100svh] w-full bg-white text-black font-sans overflow-hidden">
      <Nav />

      {/* ============ Desktop ============ */}
      <div className="hidden lg:block absolute inset-0 top-[84px]">
        {/* Category tabs + filter row */}
        <div className="grid grid-cols-12 gap-6 px-[120px] pt-[8vh] pb-8">
          {categories.map((c) => (
            <div
              key={c.key}
              className={`col-span-3 flex flex-col items-start ${
                c.isCenter ? "absolute left-1/2 -translate-x-1/2" : c.colStart
              }`}
            >
              <button
                onClick={() => setCategory(c.key)}
                className={`text-[14px] rounded-sm trim ${
                  c.isCenter ? "" : "translate-x-[-12px]"
                } px-3 py-1.5 transition-colors whitespace-nowrap ${
                  category === c.key ? "bg-black text-white" : "text-black/70 hover:text-black"
                }`}
              >
                {c.label}
              </button>
            </div>
          ))}

          {/* Type filters - always under first category */}
          <div className="col-start-2 col-span-3 flex flex-col items-start">
            <div className="flex items-center gap-6 text-[14px]">
              {types.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={`whitespace-nowrap transition-opacity ${
                    type === t.key ? "underline underline-offset-4" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Staggered project rows */}
        <div
          ref={scrollRef}
          className="absolute inset-x-0 bottom-0 top-[220px] overflow-y-auto [&::-webkit-scrollbar]:hidden px-[120px] pb-[8vh]"
        >
          {filtered.length === 0 ? (
            <p className="text-[14px] text-black/50 py-20">No projects in this filter yet.</p>
          ) : (
            filtered.map((p: ProjectWithUrls, i: number) => {
              const activeSlot = i % CYCLE; // which column-pair is "lit up"
              const gapStart = activeSlot + 1; // first slot swallowed by the title's empty space
              const titleColStart = gapStart * 2 + 1; // grid column where the title's space begins
              const titleColSpan = GAP_SLOTS * 2; // title space is exactly as wide as the slots it replaces
              return (
                <Link
                  key={p.slug}
                  href={`/projects/${p.slug}`}
                  className="group/row relative grid grid-cols-12 gap-6 py-6"
                >
                  {Array.from({ length: TOTAL_SLOTS }).map((_, slot) => {
                    // Slots inside the gap aren't rendered at all — that space belongs to the title.
                    if (slot >= gapStart && slot < gapStart + GAP_SLOTS) return null;
                    return (
                      <div
                        key={slot}
                        className="relative col-span-2 aspect-square overflow-hidden"
                        style={{ gridColumn: `${slot * 2 + 1} / span 2`, gridRow: 1 }}
                      >
                        {/*
                          Active slot: 100% opacity (actual image).
                          Inactive slots: 10% opacity (very light image) at rest,
                          all images become 100% opacity on hover.
                        */}
                        <Image
                          src={p.images[slot % p.images.length] || p.thumbnail}
                          alt={p.name}
                          fill
                          sizes="(min-width: 1024px) 10vw, 50vw"
                          className={`object-cover transition-opacity duration-300 ${
                            slot === activeSlot
                              ? "opacity-100"
                              : "opacity-10 group-hover/row:opacity-100"
                          }`}
                        />
                      </div>
                    );
                  })}

                  <div
                    className="font-bold"
                    style={{ gridColumn: `${titleColStart} / span ${titleColSpan}`, gridRow: 1 }}
                  >
                    <span className="text-[36px]">
                      {p.name}
                    </span>
                  </div>
                </Link>
              );
            })
          )}

          <p className="text-[13px] text-black/40 text-center pt-16 pb-10">
            The Projects could go on&hellip;
          </p>
        </div>

        {/* Scroll controls */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 z-30">
          <button aria-label="Scroll up" onClick={() => scrollByAmount(-1)} className="hover:opacity-60 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </button>
          <button aria-label="Scroll down" onClick={() => scrollByAmount(1)} className="hover:opacity-60 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* ============ Mobile ============ */}
      <div className="lg:hidden absolute inset-0 top-20 overflow-y-auto px-6 pt-8 pb-16">
        <div className="flex flex-wrap gap-3 mb-4">
          {categories.map((c) => (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`text-[15px] rounded-sm px-3 py-1.5 whitespace-nowrap transition-colors ${
                category === c.key ? "bg-black text-white" : "text-black/70"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-6 mb-10 text-[15px]">
          {types.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={type === t.key ? "underline underline-offset-4" : "opacity-60"}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-[14px] text-black/50 py-10">No projects in this filter yet.</p>
        ) : (
          <div className="flex flex-col">
            {filtered.map((p: ProjectWithUrls, i: number) => {
              // Mirrors the desktop staggered logic, scaled to a 4-column grid:
              // 2 slots for the title, 1 active (full-opacity) image, 1 faded image.
              const activeSlot = i % MOBILE_CYCLE;
              const gapStart = activeSlot + 1; // slot swallowed by the title

              return (
                <Link
                  key={p.slug}
                  href={`/projects/${p.slug}`}
                  className="group relative grid grid-cols-4 gap-3 py-10 items-center"
                >
                  {Array.from({ length: MOBILE_TOTAL_SLOTS }).map((_, slot) => {
                    if (slot >= gapStart && slot < gapStart + MOBILE_GAP_SLOTS) return null;
                    return (
                      <div
                        key={slot}
                        className="relative aspect-square overflow-hidden"
                        style={{ gridColumn: `${slot + 1} / span 1`, gridRow: 1 }}
                      >
                        <Image
                          src={p.images[slot % p.images.length] || p.thumbnail}
                          alt={p.name}
                          fill
                          sizes="25vw"
                          className={`object-cover transition-opacity duration-300 ${
                            slot === activeSlot ? "opacity-100" : "opacity-10"
                          }`}
                        />
                      </div>
                    );
                  })}

                  <div
                    className="font-extrabold"
                    style={{ gridColumn: `${gapStart + 1} / span ${MOBILE_GAP_SLOTS}`, gridRow: 1 }}
                  >
                    <span className="text-[28px] leading-tight">{p.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <p className="text-[12px] text-black/40 text-center pt-10 pb-6">
          The Projects could go on&hellip;
        </p>
      </div>
    </main>
  );
}