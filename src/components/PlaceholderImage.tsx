export default function PlaceholderImage({
  hue = 20,
  label,
  className = "",
  treated = true,
}: {
  hue?: number;
  label?: string;
  className?: string;
  treated?: boolean;
}) {
  const bg = `linear-gradient(160deg, hsl(${hue} 35% 22%) 0%, hsl(${hue + 40} 25% 10%) 55%, hsl(${hue - 20} 20% 6%) 100%)`;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        className={treated ? "kz-image absolute inset-0" : "absolute inset-0"}
        style={{ background: bg }}
      />
      {label ? (
        <span
          className="absolute bottom-3 left-3 eyebrow"
          style={{ color: "rgba(242,242,239,0.35)" }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
