"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import PlaceholderImage from "@/components/PlaceholderImage";
import ProcessTabs from "@/components/ProcessTabs";

const FALLBACK_COPY =
  "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut";

type Step = {
  label: string;
  heading?: string; // omit for image-only steps
  hue: number;
};

const steps: Step[] = [
  {
    label: "Step 01",
    heading:
      "Project Kaizen is a design collaboration where we explore possibilities",
    hue: 0,
  },
  { label: "Step 02", hue: 20 }, // image only
  {
    label: "Step 03",
    heading: "Defining the brief and aligning on what success looks like",
    hue: 40,
  },
  { label: "Step 04", hue: 60 }, // image only
  {
    label: "Step 05",
    heading: "Developing the strongest direction into a working system",
    hue: 80,
  },
  { label: "Step 06", hue: 100 }, // image only
  {
    label: "Step 07",
    heading: "Refining details until the work feels resolved",
    hue: 120,
  },
  { label: "Step 08", hue: 140 }, // image only
  {
    label: "Step 09",
    heading: "Reflecting on the process to inform the next one",
    hue: 160,
  },
];

export default function ProcessPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = steps[activeIndex];

  return (
    <main className="relative h-[100svh] w-full bg-white text-black font-sans overflow-hidden">
      <Nav />

      {/* Desktop view */}
      <div className="hidden lg:block absolute inset-0 top-[84px]">
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-1 gap-6 px-[120px] pt-[8vh] pb-[8vh] z-10">
          {/* Frame + content */}
          <div className="col-start-1 col-span-8 row-start-1 relative h-full">
            {/* Crosshair frame */}
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-2xl font-light text-black/40">+</div>
            <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-2xl font-light text-black/40">+</div>
            <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-2xl font-light text-black/40">+</div>
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-2xl font-light text-black/40">+</div>

            {/* Content, inset 100px from the crosshair frame on every side */}
            <div className="absolute inset-[100px] flex flex-col">
              {active.heading && (
                <h1 className="text-[28px] font-extrabold leading-[1.15] uppercase tracking-tight max-w-[900px] mb-10">
                  {active.heading}
                </h1>
              )}
              <PlaceholderImage
                hue={active.hue}
                label={active.label}
                className="w-full flex-1 bg-gray-300"
                treated={false}
              />
            </div>
          </div>

          {/* 9-step tab indicator, anchored to gutters after columns 9, 10, 11 */}
          <ProcessTabs
            count={9}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            gutterColumns={[9, 10, 11]}
          />
        </div>
      </div>

      {/* Mobile view */}
      <div className="lg:hidden absolute inset-0 top-20 overflow-hidden">
        <div className="h-full grid grid-rows-[1fr_auto] px-15 py-20">
          {/* Crosshair-framed content, aligned to the site's 4-column mobile grid */}
          <div className="relative grid grid-cols-6 gap-11 min-h-0">
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-xl font-light text-black/40">+</div>
            <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-xl font-light text-black/40">+</div>
            <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-xl font-light text-black/40">+</div>
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-xl font-light text-black/40">+</div>

            <div className="col-start-2 col-span-4 py-20 flex flex-col h-full justify-center gap-6 min-h-0">
              {active.heading && (
                <h1 className="text-[24px] font-extrabold leading-[1.2] uppercase tracking-tight">
                  {active.heading}
                </h1>
              )}
              <PlaceholderImage
                hue={active.hue}
                label={active.label}
                className="w-full flex-1 min-h-0 bg-gray-300"
                treated={false}
              />
            </div>
          </div>

          {/* Step dots, pinned to the bottom, aligned to the same 4-column grid */}
             <div className="grid grid-cols-4 gap-11 pt-20">
            <div className="col-span-4 flex justify-center">
              <div className="grid grid-cols-3 gap-9 w-fit">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Step ${i + 1}`}
                    onClick={() => setActiveIndex(i)}
                    className={`h-5 w-5 ${
                      activeIndex === i ? "bg-black" : "bg-black/25"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}