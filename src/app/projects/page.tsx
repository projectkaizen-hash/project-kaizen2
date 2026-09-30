"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Image from "next/image";
import { getProjects, getCategories, getSubcategories, ProjectWithUrls, Category, Subcategory } from "@/lib/data";

// Desktop tab placement for the original three-column layout. The first tab
// sits after column 1, the last hugs column 10; when there are exactly three
// tabs the middle one centers.
function tabPlacement(index: number, total: number): string {
  if (index === 0) return "lg:col-start-2";
  if (index === total - 1) return "lg:col-start-10";
  if (total === 3 && index === 1) return "absolute left-1/2 -translate-x-1/2";
  return "";
}



const TOTAL_SLOTS = 6; // 12 columns / 2 per image
const GAP_SLOTS = 2; // slot-widths reserved as empty space for the title
const CYCLE = TOTAL_SLOTS - GAP_SLOTS; // 4 distinct positions the title/gap can take

// Mobile mirrors the desktop staggered logic, scaled to a 4-column grid:
// 2 slots for the title, the rest images. The title cycles through all three
// positions it can occupy — including LEADING the row (text first, images
// after) — so rows alternate: text|imgs, img|text|img, imgs|text.
const MOBILE_TOTAL_SLOTS = 4;
const MOBILE_GAP_SLOTS = 2;
const MOBILE_TITLE_POSITIONS = MOBILE_TOTAL_SLOTS - MOBILE_GAP_SLOTS + 1; // 3 positions

const ALL_SUBCATS = "__all__";

export default function ProjectsPage() {
  const [categorySlug, setCategorySlug] = useState<string>("");
  const [subcategorySlug, setSubcategorySlug] = useState<string>(ALL_SUBCATS);
  const [projects, setProjects] = useState<ProjectWithUrls[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  // Switching category resets the sub-category filter — sub-categories are
  // scoped to their parent category.
  const selectCategory = (slug: string) => {
    setCategorySlug(slug);
    setSubcategorySlug(ALL_SUBCATS);
  };

  useEffect(() => {
    getProjects().then(setProjects);
    getCategories().then((cmsCategories) => {
      setCategories(cmsCategories);
      if (cmsCategories.length > 0) {
        setCategorySlug(cmsCategories[0].slug);
      }
    });
    getSubcategories().then(setSubcategories);
  }, []);



  const filtered = useMemo(
    () =>
      projects.filter(
        (p: ProjectWithUrls) =>
          p.categorySlug === categorySlug &&
          (subcategorySlug === ALL_SUBCATS || p.subcategorySlugs.includes(subcategorySlug))
      ),
    [categorySlug, subcategorySlug, projects]
  );

  // Sub-categories of the currently selected category, if any exist.
  const subcatsForCategory = useMemo(
    () => subcategories.filter((s) => s.parentCategorySlug === categorySlug),
    [subcategories, categorySlug]
  );

  // Don't render content until categories are loaded
  if (categories.length === 0) {
    return (
      <main className="relative min-h-[100svh] w-full bg-white text-black font-sans">
        <Nav fixed />
        <div className="flex items-center justify-center h-[100svh]">
          <p className="text-[14px] text-black/50">Loading categories...</p>
        </div>
      </main>
    );
  }

  return (
    // Full-page scroll: the header is fixed and the filter row sticks beneath
    // it, while the whole document scrolls — no more inner scroller.
    <main className="relative min-h-[100svh] w-full bg-white text-black font-sans">
      <Nav fixed />

      {/* ============ Desktop ============ */}
      <div className="hidden lg:block pt-[84px]">
        {/* Category tabs + sub-category filters — sticks under the fixed
            header while the project list scrolls underneath. */}
        <div className="bg-white grid grid-cols-12 gap-6 px-[120px] pt-[8vh] pb-8">
          {categories.map((c, i) => {
            const placement = tabPlacement(i, categories.length);
            return (
              <div
                key={c._id}
                className={`col-span-3 flex flex-col items-start ${placement}`}
              >
                <button
                  onClick={() => selectCategory(c.slug)}
                  className={`text-[14px] rounded-sm trim ${
                    placement.startsWith("absolute") ? "" : "translate-x-[-12px]"
                  } px-3 py-1.5 transition-colors whitespace-nowrap ${
                    categorySlug === c.slug
                      ? "bg-black text-white"
                      : "text-black/70 hover:text-black"
                  }`}
                >
                  {c.name}
                </button>
              </div>
            );
          })}

          {/* Sub-category filters — the primary filter (replaces the old
              hardcoded type row). Renders when the active category has
              sub-categories in the CMS; "/all" resets. Labels keep the
              "/name" style of the old type row. */}
          {subcatsForCategory.length > 0 && (
            <div className="col-start-2 col-span-6 flex flex-wrap items-center gap-6 text-[14px]">
              <button
                onClick={() => setSubcategorySlug(ALL_SUBCATS)}
                className={`whitespace-nowrap transition-opacity ${
                  subcategorySlug === ALL_SUBCATS
                    ? "underline underline-offset-4"
                    : "opacity-50 hover:opacity-100"
                }`}
              >
                /all
              </button>
              {subcatsForCategory.map((s) => (
                <button
                  key={s._id}
                  onClick={() => setSubcategorySlug(s.slug)}
                  className={`whitespace-nowrap transition-opacity ${
                    subcategorySlug === s.slug
                      ? "underline underline-offset-4"
                      : "opacity-50 hover:opacity-100"
                  }`}
                >
                  /{s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Staggered project rows — scroll with the document now. */}
        <div className="px-[120px] pb-[8vh]">
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
                    <span className="text-[36px] leading-tight"> 
                      {p.name}
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>

      </div>

      {/* ============ Mobile ============ */}
      <div className="lg:hidden pt-28 px-6 pb-16">
        <div className="flex flex-wrap gap-1 mb-4">
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => selectCategory(c.slug)}
              className={`text-[14px] rounded-sm px-1 py-0 whitespace-nowrap transition-colors ${
                categorySlug === c.slug ? "bg-black text-white" : "text-black/70"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Sub-category filter row (mobile) — same "/name + underline"
            styling as desktop. Hidden when the category has no
            sub-categories. */}
        {subcatsForCategory.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 text-[14px]">
            <button
              onClick={() => setSubcategorySlug(ALL_SUBCATS)}
              className={`whitespace-nowrap transition-opacity ${
                subcategorySlug === ALL_SUBCATS
                  ? "underline underline-offset-4"
                  : "opacity-50 hover:opacity-100"
              }`}
            >
              /all
            </button>
            {subcatsForCategory.map((s) => (
              <button
                key={s._id}
                onClick={() => setSubcategorySlug(s.slug)}
                className={`whitespace-nowrap transition-opacity ${
                  subcategorySlug === s.slug
                    ? "underline underline-offset-4"
                    : "opacity-50 hover:opacity-100"
                }`}
              >
                /{s.name}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <p className="text-[14px] text-black/50 py-10">No projects in this filter yet.</p>
        ) : (
          <div className="flex flex-col">
            {filtered.map((p: ProjectWithUrls, i: number) => {
              // Title cycles through its three possible positions: leading the
              // row (text first, images follow), middle, and end.
              const titleStart = i % MOBILE_TITLE_POSITIONS;
              // Bright image sits just left of the title; when the text leads
              // the row, the first image after it is the bright one.
              const activeSlot = titleStart === 0 ? MOBILE_GAP_SLOTS : titleStart - 1;

              return (
                <Link
                  key={p.slug}
                  href={`/projects/${p.slug}`}
                  className="group relative grid grid-cols-4 gap-3 py-10 items-start"
                >
                  {Array.from({ length: MOBILE_TOTAL_SLOTS }).map((_, slot) => {
                    // Slots inside the title's space aren't rendered at all.
                    if (slot >= titleStart && slot < titleStart + MOBILE_GAP_SLOTS) return null;
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
                    style={{
                      gridColumn: `${titleStart + 1} / span ${MOBILE_GAP_SLOTS}`,
                      gridRow: 1,
                    }}
                  >
                    <span className="text-[20px] font-bold leading-tight">{p.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}