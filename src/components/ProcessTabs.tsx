"use client";

import { useEffect, useRef, useState } from "react";

type ProcessTabsProps = {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  /** Column number (1-12) each square-column sits after, left to right */
  gutterColumns: number[];
};

export default function ProcessTabs({
  count,
  activeIndex,
  onSelect,
  gutterColumns,
}: ProcessTabsProps) {
  const perColumn = Math.ceil(count / gutterColumns.length);
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);
  const squareRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [rowGap, setRowGap] = useState(24); // sensible default before first measure

  useEffect(() => {
    function measure() {
      const squares = squareRefs.current.filter(Boolean) as HTMLButtonElement[];
      if (squares.length < 2) return;

      const rectA = squares[0].getBoundingClientRect();
      const rectB = squares[1].getBoundingClientRect();

      // Real horizontal center-to-center distance between two neighboring
      // squares, as actually painted.
      const centerA = rectA.left + rectA.width / 2;
      const centerB = rectB.left + rectB.width / 2;
      const centerToCenter = Math.abs(centerB - centerA);

      // CSS `gap` is the space BETWEEN items, not center-to-center — so
      // vertical center-to-center = squareHeight + gap. To make vertical
      // center-to-center equal the horizontal one, subtract the square's
      // own height before assigning it to gap.
      const gap = centerToCenter - rectA.height;
      setRowGap(gap);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <>
      {gutterColumns.map((col, groupIndex) => (
        <div
          key={col}
          ref={(el) => {
            groupRefs.current[groupIndex] = el;
          }}
          style={{
            gridColumnStart: col,
            gridColumnEnd: col + 1,
            gap: `${rowGap}px`,
          }}
          className="row-start-1 h-full flex flex-col items-end justify-center"
        >
          {Array.from({ length: perColumn }).map((_, rowIndex) => {
            const stepIndex = groupIndex * perColumn + rowIndex;
            if (stepIndex >= count) return null;
            const isFirstInGroup = rowIndex === 0;
            return (
              <button
                key={stepIndex}
                ref={(el) => {
                  if (isFirstInGroup) squareRefs.current[groupIndex] = el;
                }}
                aria-label={`Step ${stepIndex + 1}`}
                onClick={() => onSelect(stepIndex)}
                className={`h-6 w-6 translate-x-full transition-colors duration-200 ${
                  activeIndex === stepIndex
                    ? "bg-black"
                    : "bg-black/25 hover:bg-black/40"
                }`}
              />
            );
          })}
        </div>
      ))}
    </>
  );
}