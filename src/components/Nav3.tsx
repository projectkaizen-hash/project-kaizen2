"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ProjectSearch from "@/components/ProjectSearch";

const Logo = ({ className }: { className?: string }) => (
  <svg
    width="50%"
    height="auto"
    viewBox="0 0 376 35"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M18.55 2.76001C16.74 0.820009 14.47 0.0400085 10.64 0.0400085H0V34.79H1.44V20.24H10.64C14.14 20.24 16.37 19.54 18.1 17.89C20 16.12 20.99 13.52 20.99 10.1C20.99 7.01001 20.17 4.62001 18.56 2.76001M17.32 16.57C15.83 18.18 13.86 18.88 10.64 18.88H1.44V1.40001H10.64C13.69 1.40001 15.42 1.94001 16.95 3.34001C18.64 4.91001 19.46 7.22001 19.46 10.1C19.46 12.98 18.72 15.05 17.32 16.57Z" fill="currentColor" />
    <path d="M45.5 19.09C49.79 18.35 51.94 15.17 51.94 9.57001C51.94 6.52001 51.3 4.30001 49.79 2.56001C48.29 0.780009 46.22 0.0400085 42.78 0.0400085H32.77V34.79H35.41V19.37H42.92L49.25 34.79H52.15L45.5 19.08V19.09ZM35.35 16.82V2.56001H42.57C47.15 2.56001 49.33 4.91001 49.33 9.73001C49.33 14.55 47.26 16.82 43.04 16.82H35.35Z" fill="currentColor" />
    <path d="M82.33 3.79C80.81 1.81 78.87 0.57 76.31 0H68.6C66.33 0.54 64.6 1.57 63.12 3.21C61.06 5.48 60.24 8.28 60.24 13.15V21.68C60.24 26.17 60.94 28.85 62.63 31.04C64.11 32.98 66.01 34.21 68.49 34.79H76.53C78.67 34.25 80.36 33.22 81.8 31.62C83.9 29.35 84.69 26.63 84.69 21.69V13.15C84.69 8.62 84.03 5.98 82.34 3.79M80.65 21.31C80.65 24.86 80.2 26.79 79.08 28.61C77.68 30.8 75.58 31.83 72.48 31.83C69.55 31.83 67.62 30.96 66.17 29.07C64.77 27.26 64.27 25.15 64.27 21.32V13.53C64.27 9.99 64.72 8.05 65.83 6.23C67.23 4.05 69.34 3.02 72.47 3.02C75.4 3.02 77.33 3.89 78.74 5.78C80.14 7.59 80.64 9.69 80.64 13.53V21.32L80.65 21.31Z" fill="currentColor" />
    <path d="M103.64 0.0400085V21.31C103.64 25.35 103.52 26.91 103.06 28.19C102.24 30.54 100.42 31.82 97.82 31.82C95.51 31.82 93.53 30.95 91.68 29.1L89.41 31.86C91.06 33.35 92.67 34.29 94.48 34.79H101.45C103.72 34.17 105.41 32.89 106.44 30.96C107.43 29.06 107.68 27.13 107.68 21.23V0.0400085H103.64Z" fill="currentColor" />
    <path d="M122.07 30.51V19.38H135.38V15.09H122.07V4.33001H137.74V0.0400085H116.88V34.8H137.86V30.51H122.07Z" fill="currentColor" />
    <path d="M162.68 25.64C162.19 29.19 159.92 31.04 155.96 31.04C150.97 31.04 149.07 28.28 149.07 20.78V14.14C149.07 6.72 150.97 3.87 155.96 3.87C159.71 3.87 161.9 5.73 162.35 9.27L167.17 8.9C166.88 3.91 164.16 0.86 159.21 0H152.28C149.85 0.49 147.95 1.61 146.51 3.34C144.57 5.65 143.83 8.53 143.83 13.81V21.06C143.83 25.97 144.41 28.69 145.97 30.96C147.37 32.9 149.23 34.17 151.66 34.79H160.32C164.81 33.72 167.29 30.79 167.53 26.17L162.67 25.63L162.68 25.64Z" fill="currentColor" />
    <path d="M172.57 0.0400085V4.33001H182.3V34.79H187.53V4.33001H197.26V0.0400085H172.57Z" fill="currentColor" />
    <path d="M227.03 14.35L238.53 0.0400085H229.75L219.57 14.06V0.0400085H212.15V34.79H219.57V22.88L222.16 19.42L230.37 34.79H239.07L227.03 14.35Z" fill="currentColor" />
    <path d="M260.88 0.0400085H253.62L241.05 34.79H249.13L251.19 28.28H263.35L265.37 34.79H273.49L260.88 0.0400085ZM253.01 22.34L257.34 8.82001L261.59 22.34H253.02H253.01Z" fill="currentColor" />
    <path d="M285.28 0.0400085H277.78V34.79H285.28V0.0400085Z" fill="currentColor" />
    <path d="M299.71 28.69L313.64 4.95001V0.0400085H291.96V6.14001H305.15L291.3 29.89V34.79H314.3V28.69H299.71Z" fill="currentColor" />
    <path d="M327.66 28.69V20.28H339.99V14.22H327.66V6.14001H342.21V0.0400085H320.24V34.79H342.42V28.69H327.66Z" fill="currentColor" />
    <path d="M367.2 0.0400085V20.32L356.56 0.0400085H348.11V34.79H356.48V14.51L367.15 34.79H375.56V0.0400085H367.2Z" fill="currentColor" />
  </svg>
);

export default function Nav({ dark = false }: { dark?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  // Reset the menu whenever the route changes. Previously this lived in a
  // useEffect that called setMenuOpen(false) directly — react-hooks flags
  // that as an anti-pattern (an Effect calling setState synchronously can
  // trigger a cascading extra render). Per React's own guidance for
  // "resetting state when a prop changes," the effect is dropped entirely
  // in favor of comparing against the previous pathname during render and
  // adjusting state right there — React applies the update before
  // committing to the screen, so there's no visible flash and no separate
  // Effect pass.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  // Lock body scroll while the mobile menu is open — this one stays a
  // genuine Effect: it's synchronizing React state with an external system
  // (the DOM's body style), which is exactly what Effects are for.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // `dark` swaps the header's text/logo/divider color for use on dark
  // backgrounds (e.g. project pages with a dark hero image behind the
  // nav). Every color below reads from this one flag instead of being
  // hardcoded, so it's a single source of truth.
  const textColor = dark ? "text-white" : "text-black";
  const dividerColor = dark ? "border-white/15" : "border-black/15";
  const hamburgerColor = dark ? "bg-white" : "bg-[#231F20]";

  return (
    <header className={`w-full absolute top-0 ${textColor}`}>
      

      {/* Mobile header */}
      <div className="lg:hidden relative z-50">
        <div className="relative z-[60] flex items-center justify-between px-6 h-20 bg-white">
          <Link href="/" className="flex items-baseline" onClick={() => setMenuOpen(false)}>
            <Logo />
          </Link>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
            className="relative w-7 h-[24px] flex items-center justify-center shrink-0"
          >
            <span
              className={`absolute h-[1.5px] w-full transition-transform duration-300 ease-in-out ${hamburgerColor} ${
                menuOpen ? "rotate-45" : "-translate-y-[6px]"
              }`}
            />
            <span
              className={`absolute h-[1.5px] w-full transition-transform duration-300 ease-in-out ${hamburgerColor} ${
                menuOpen ? "-rotate-45" : "translate-y-[6px]"
              }`}
            />
          </button>
        </div>

        {/* Divider under the header — stays visible whether menu is open or closed */}

        {/* Fullscreen mobile menu overlay — sits BELOW the header, not over it */}
        <div
          className={`fixed inset-x-0 top-20 bottom-0 z-40 bg-white transition-opacity duration-300 ease-in-out ${
            menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >          <nav className="h-full flex flex-col justify-between px-6 py-0">
            {/* Inline search bar sits at the very top of the menu, before
                CONTACT — the menu overlay is the search's own overlay, so
                the inline variant renders bar + live results in place and
                leaves body scroll-locking to the menu. */}
            <div className="pt-6">
              <ProjectSearch variant="inline" />
            </div>

            <div className="">
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="block text-[34px] "
              >
                CONTACT
              </Link>
            </div>

            <div className="flex flex-col gap-2 pb-16">
              <Link
                href="/projects"
                onClick={() => setMenuOpen(false)}
                className="text-[34px]"
              >
                PROJECTS
              </Link>
              <Link
                href="/people"
                onClick={() => setMenuOpen(false)}
                className="text-[34px]"
              >
                PEOPLE
              </Link>
              <Link
                href="/process"
                onClick={() => setMenuOpen(false)}
                className="text-[34px]"
              >
                PROCESS
              </Link>
            </div>
          </nav>
        </div>
      </div>

      <div className="mx-auto block md:hidden w-[calc(100%-48px)] md:w-[calc(100%-240px)] border-b border-black" />
    </header>
  );
}