"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getProjects, ProjectWithUrls } from "@/lib/data";

export function SearchIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="10.5" cy="10.5" r="6.75" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M15.6 15.6L21 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Project search in two variants:
 *
 *  - "trigger" (default): a magnifier button that opens a fullscreen search
 *    overlay. Used in the desktop nav.
 *  - "inline": just the search bar + live results, rendered in place. Used
 *    inside the mobile fullscreen menu, above the CONTACT link — no icon,
 *    no extra overlay (the menu itself is the overlay).
 *
 * The project list is fetched lazily on first open/first keystroke (same
 * getProjects() the projects page uses). Matching is a case-insensitive
 * substring over name / slug / category name; Enter jumps to the first
 * result. `onOpen` lets a parent close itself when the trigger variant
 * opens so two overlays never fight over body.style.overflow.
 */
export default function ProjectSearch({
  variant = "trigger",
  iconClassName = "",
  onOpen,
}: {
  variant?: "trigger" | "inline";
  iconClassName?: string;
  onOpen?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false); // trigger variant only
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<ProjectWithUrls[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);

  const ensureLoaded = () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    getProjects().then(setProjects);
  };

  // Trigger variant: lazy-load on first open.
  useEffect(() => {
    if (open) ensureLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Trigger variant, while open: focus the field, lock body scroll, close
  // on Escape. The inline variant lives inside the menu's own overlay, so
  // it must NOT touch body scroll — the menu owns that.
  useEffect(() => {
    if (variant !== "trigger" || !open) return;
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [variant, open]);

  const q = query.trim().toLowerCase();
  const results = q
    ? projects
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.slug.toLowerCase().includes(q) ||
            (p.categoryName ?? "").toLowerCase().includes(q)
        )
        .slice(0, 8)
    : [];

  const go = (slug: string) => {
    setOpen(false);
    setQuery("");
    router.push(`/projects/${slug}`);
    // Navigating also closes the mobile menu: both navs reset menuOpen on
    // pathname change during render.
  };

  const resultsList = (
    <ul className={variant === "inline" ? "mt-4 max-h-[38vh] overflow-y-auto" : "mt-6 max-h-[70vh] overflow-y-auto"}>
      {results.map((p) => (
        <li key={p._id}>
          <button
            type="button"
            onClick={() => go(p.slug)}
            className="w-full flex items-center gap-4 py-3 border-b border-black/10 text-left hover:opacity-60 transition-opacity"
          >
            {p.thumbnail ? (
              <Image
                src={p.thumbnail}
                alt=""
                width={48}
                height={48}
                className="w-12 h-12 object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-black/5 shrink-0" />
            )}
            <span className="text-[15px] font-medium uppercase truncate">
              {p.name}
            </span>
            {p.categoryName ? (
              <span className="ml-auto text-[12px] text-black/50 uppercase shrink-0">
                {p.categoryName}
              </span>
            ) : null}
          </button>
        </li>
      ))}
      {q && projects.length === 0 && (
        <li className="py-4 text-[14px] text-black/50">Loading projects…</li>
      )}
      {q && projects.length > 0 && results.length === 0 && (
        <li className="py-4 text-[14px] text-black/50">No projects found.</li>
      )}
    </ul>
  );

  // ----- Inline variant: bare bar + results, for the mobile menu -----
  if (variant === "inline") {
    return (
      <div>
        <div className="flex items-center gap-3 border-b border-black pb-2">
          <SearchIcon className="shrink-0 text-black/60" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              ensureLoaded();
              setQuery(e.target.value);
            }}
            onFocus={ensureLoaded}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) go(results[0].slug);
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="search projects"
            autoComplete="off"
            className="w-full bg-transparent outline-none text-[18px] font-medium placeholder:text-black/30"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="shrink-0 hover:opacity-50 transition-opacity"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        {resultsList}
      </div>
    );
  }

  // ----- Trigger variant: icon button + fullscreen overlay (desktop) -----
  return (
    <>
      <button
        type="button"
        aria-label="Search projects"
        onClick={() => {
          onOpen?.();
          setOpen(true);
        }}
        className={`shrink-0 hover:opacity-50 transition-opacity ${iconClassName}`}
      >
        <SearchIcon />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-white"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Search projects"
        >
          <div
            className="w-full px-6 lg:px-[120px] pt-28 lg:pt-[140px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 border-b border-black pb-3">
              <SearchIcon className="shrink-0 text-black/60" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results[0]) go(results[0].slug);
                }}
                placeholder="search projects"
                className="w-full bg-transparent outline-none text-[20px] lg:text-[28px] font-medium placeholder:text-black/30"
              />
              <button
                type="button"
                aria-label="Close search"
                onClick={() => setOpen(false)}
                className="shrink-0 hover:opacity-50 transition-opacity"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M5 5L19 19M19 5L5 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {resultsList}
          </div>
        </div>
      )}
    </>
  );
}
