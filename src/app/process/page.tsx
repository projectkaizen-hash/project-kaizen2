"use client";

import { useEffect, useState } from "react";
import Nav from "@/components/Nav";
import PlaceholderImage from "@/components/PlaceholderImage";
import ProcessTabs from "@/components/ProcessTabs";
import { PortableText } from "@portabletext/react";
import { getProcessSteps, ProcessStep } from "@/lib/data";
import { urlFor } from "@/lib/image";

const FALLBACK_COPY =
  "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut";

type Step = {
  _id: string;
  order: number;
  heading: ProcessStep["heading"];
  image: ProcessStep["image"];
  imageUrl: string | null;
};

// The pre-Sanity content, used until steps are published in the CMS.
const FALLBACK_STEPS: Step[] = [
  {
    _id: "fallback-1",
    order: 1,
    heading: [
      {
        _type: "block",
        _key: "a1",
        children: [{ _type: "span", _key: "a1s", text: "Project Kaizen is a design collaboration where we explore possibilities" }],
        markDefs: [],
      },
    ],
    image: null,
    imageUrl: null,
  },
  { _id: "fallback-2", order: 2, heading: null, image: null, imageUrl: null }, // image only
  {
    _id: "fallback-3",
    order: 3,
    heading: [
      {
        _type: "block",
        _key: "a3",
        children: [{ _type: "span", _key: "a3s", text: "Defining the brief and aligning on what success looks like" }],
        markDefs: [],
      },
    ],
    image: null,
    imageUrl: null,
  },
  { _id: "fallback-4", order: 4, heading: null, image: null, imageUrl: null }, // image only
  {
    _id: "fallback-5",
    order: 5,
    heading: [
      {
        _type: "block",
        _key: "a5",
        children: [{ _type: "span", _key: "a5s", text: "Developing the strongest direction into a working system" }],
        markDefs: [],
      },
    ],
    image: null,
    imageUrl: null,
  },
  { _id: "fallback-6", order: 6, heading: null, image: null, imageUrl: null }, // image only
  {
    _id: "fallback-7",
    order: 7,
    heading: [
      {
        _type: "block",
        _key: "a7",
        children: [{ _type: "span", _key: "a7s", text: "Refining details until the work feels resolved" }],
        markDefs: [],
      },
    ],
    image: null,
    imageUrl: null,
  },
  { _id: "fallback-8", order: 8, heading: null, image: null, imageUrl: null }, // image only
  {
    _id: "fallback-9",
    order: 9,
    heading: [
      {
        _type: "block",
        _key: "a9",
        children: [{ _type: "span", _key: "a9s", text: "Reflecting on the process to inform the next one" }],
        markDefs: [],
      },
    ],
    image: null,
    imageUrl: null,
  },
];

// Deterministic hues for placeholder boxes, matching the original design.
const STEP_HUES = [0, 20, 40, 60, 80, 100, 120, 140, 160];

export default function ProcessPage() {
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    getProcessSteps().then((cmsSteps) => {
      const mapped: Step[] = cmsSteps.map((s) => ({
        _id: s._id,
        order: s.order,
        heading: s.heading,
        image: s.image,
        imageUrl: s.image ? urlFor(s.image).width(1200).url() : null,
      }));
      setSteps(mapped.length > 0 ? mapped : null);
    });
  }, []);

  // Fall back to the hardcoded content until the CMS has steps.
  const displaySteps = steps ?? FALLBACK_STEPS;
  const count = displaySteps.length;
  const active = displaySteps[Math.min(activeIndex, count - 1)];
  const hue = STEP_HUES[activeIndex % STEP_HUES.length];

  return (
    <main className="relative h-[100svh] w-full bg-white text-black font-sans overflow-hidden">
      <Nav />

      {/* Desktop view */}
      <div className="hidden lg:block absolute inset-0 top-[84px]">
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-1 gap-6 px-[120px] pt-[8vh] pb-[8vh] z-10">
          {/* Frame + content */}
          <div className="col-start-1 col-span-8 row-start-1 relative h-full">
            {/* Crosshair frame */}
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-4xl font-light font-fraunces">+</div>
            <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-4xl font-light font-fraunces">+</div>
            <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-4xl font-light font-fraunces">+</div>
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-4xl font-light font-fraunces">+</div>

            {/* Content, inset 100px from the crosshair frame on every side.
                overflow-hidden + min-h-0 chain keeps the step image strictly
                inside the frame: the image is a flex child that shrinks to
                the leftover space (min-h-0) and object-cover crops it, so a
                tall portrait image can never spill past the crosshairs. */}
            <div className="absolute inset-[20px] flex flex-col min-h-0 overflow-hidden">
              {active.heading && (
                <div className="shrink-0 text-[28px] font-extrabold leading-[1.15] uppercase tracking-tight max-w-[900px] mb-10 [&>p]:mb-4">
                  <PortableText value={active.heading} />
                </div>
              )}
              {active.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={active.imageUrl}
                  alt={`Process step ${activeIndex + 1}`}
                  className="w-full flex-1 min-h-0 bg-gray-300 object-cover"
                />
              ) : (
                <PlaceholderImage
                  hue={hue}
                  label={`Step ${String(activeIndex + 1).padStart(2, "0")}`}
                  className="w-full flex-1 min-h-0 bg-gray-300"
                  treated={false}
                />
              )}
            </div>
          </div>

          {/* 9-step tab indicator, anchored to gutters after columns 9, 10, 11 */}
          <ProcessTabs
            count={count}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
            gutterColumns={[9, 10, 11]}
          />
        </div>
      </div>

      {/* Mobile view */}
      <div className="lg:hidden absolute inset-0 top-20 overflow-hidden">
        <div className="h-full grid grid-rows-[1fr_auto] px-15 py-10">
          {/* Crosshair-framed content, aligned to the site's 4-column mobile grid */}
          <div className="relative grid grid-cols-6 gap-11 min-h-0">
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-4xl font-light font-fraunces">+</div>
            <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-4xl font-light font-fraunces">+</div>
            <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-4xl font-light font-fraunces">+</div>
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-4xl font-light font-fraunces">+</div>

            <div className="col-start-2 col-span-4 py-20 flex flex-col h-full justify-center gap-6 min-h-0 overflow-hidden">
              {/* Image first on mobile: the media block is the flex item
                  that grows/shrinks, the heading sits below it, so a tall
                  heading can never push the image out of the frame. */}
              {active.imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={active.imageUrl}
                  alt={`Process step ${activeIndex + 1}`}
                  className="w-full flex-1 min-h-0 bg-gray-300 object-cover"
                />
              ) : (
                <PlaceholderImage
                  hue={hue}
                  label={`Step ${String(activeIndex + 1).padStart(2, "0")}`}
                  className="w-full flex-1 min-h-0 bg-gray-300"
                  treated={false}
                />
              )}
              {active.heading && (
                <div className="shrink-0 font-extrabold leading-[1.2] uppercase tracking-tight [&>p]:mb-4">
                  <PortableText value={active.heading} />
                </div>
              )}
            </div>
          </div>

          {/* Step dots, pinned to the bottom, aligned to the same 4-column grid */}
             <div className="grid grid-cols-4 gap-11 pt-20">
            <div className="col-span-4 flex justify-center">
              <div className="grid grid-cols-3 gap-9 w-fit">
                {displaySteps.map((_, i) => (
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
