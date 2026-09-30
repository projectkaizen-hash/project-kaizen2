import Nav from "@/components/Nav";
import PlaceholderImage from "@/components/PlaceholderImage";
import { getStudio } from "@/lib/data";
import { buildMapEmbedUrl, parseCoords } from "@/lib/geo";
import Image from "next/image";

export default async function ContactPage() {
  const studio = await getStudio();

  // Fallback to hardcoded data if Sanity fetch fails
  const studioData = studio || {
    phone: "+880 1971 306540",
    email: "office@project-kaizen.net",
    web: "www.project-kaizen.net",
    lat: "23°47'42.3\"N",
    lng: "90°23'55.3\"E",
  };

  // CMS-driven "Come visit us" copy with the current hardcoded text as fallback
  const contactTitle = studio?.contactTitle ?? "Come visit us";
  const contactDescription =
    studio?.contactDescription ??
    "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut";

  // Real coordinates if lat/lng parse; otherwise fall back to a text search
  // on the address; if that's empty too, keep the placeholder box.
  const coords = parseCoords(studioData.lat, studioData.lng);
  const mapEmbedUrl = buildMapEmbedUrl(coords, studioData.address ?? null);

  // Map socials from Sanity or use fallback
  const socials = studio?.socials
    ?.map(social => {
      const platformNames: Record<string, string> = {
        instagram: "Instagram",
        facebook: "Facebook",
        linkedin: "LinkedIn",
        twitter: "Twitter",
      };
      return {
        icon: social.icon,
        label: platformNames[social.platform] || social.platform,
        url: social.url
      };
    })
    .filter(social => social.icon && social.icon.trim() !== "") // Filter out empty icons
  || [
    { icon: "/Asset 2_Insta.svg", label: "Instagram", url: "#" },
    { icon: "/Asset 3_Facebook.svg", label: "Facebook", url: "#" },
    { icon: "/Asset 4_Linkedin.svg", label: "LinkedIn", url: "#" },
  ];

  return (
    <main className="relative h-[100svh] w-full bg-white text-black font-sans overflow-hidden">
      <Nav />

      {/* Desktop view */}
      <div className="hidden lg:block absolute inset-0 top-[84px]">
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-1 gap-6 px-[120px] pt-[8vh] pb-[8vh] z-10">
          <div className="col-start-3 col-span-3 row-start-1 h-full flex flex-col justify-center -mr-6">
            <h2 className="text-[14px] font-bold uppercase mb-4 tracking-wide">{contactTitle}</h2>
            <p className="font-sans text-[14px] mb-4 leading-[1.4] whitespace-pre-line">
              {contactDescription}
            </p>
            <dl className="space-y-2 mb-16 text-[14px]">
              <div className="flex gap-2">
                <dt className="font-bold w-2">T</dt>
                <dd className="font-bold w-6 text-center">:</dd>
                <dd className="font-sans">{studioData.phone}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-bold w-2">E</dt>
                <dd className="font-bold w-6 text-center">: </dd>
                <dd className="font-sans">{studioData.email}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-bold w-2">W</dt>
                <dd className="font-bold w-6 text-center">:</dd>
                <dd className="font-sans">{studioData.web}</dd>
              </div>
            </dl>
            <h2 className="text-[14px] font-bold uppercase mb-4 tracking-wide">Connect online</h2>
            <div className="flex items-center gap-5">
              {socials.map(({ icon, label, url }) => (
                <a
                  key={label}
                  href={url}
                  aria-label={label}
                  className="flex h-7 w-7 items-center justify-center text-black hover:opacity-70 transition-opacity"
                >
                  {icon ? (
                    <Image src={icon} alt={label} width={24} height={24} />
                  ) : (
                    <span className="text-lg">{label.charAt(0)}</span>
                  )}
                </a>
              ))}
            </div>
          </div>

          <div className="col-start-9 col-span-2 row-start-1 -mx-6 h-full flex flex-col justify-center" style={{ containerType: 'inline-size' }}>
            <h1 className="text-[22cqw] font-bold leading-[0.95] mb-1 tracking-tight uppercase">
              LOCATION
            </h1>
            {mapEmbedUrl ? (
              /* The iframe is oversized 160% and centered inside a clipped
                 frame, so every native Google control (zoom, pegman,
                 fullscreen, "View larger map", terms bar) sits outside the
                 visible box — but the map itself stays interactive and can
                 be dragged/pinned around. */
              <div className="relative aspect-[3/4] w-full mb-4 bg-gray-300 overflow-hidden">
                <iframe
                  src={mapEmbedUrl}
                  title="Studio location map"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute border-0"
                  style={{ width: "160%", height: "160%", left: "-30%", top: "-30%" }}
                />
              </div>
            ) : (
              <PlaceholderImage
                hue={0}
                label="Google Map"
                className="aspect-[3/4] w-full mb-8 bg-gray-300"
                treated={false}
              />
            )}
            <p className="font-extrabold text-[18cqw] leading-[1.15] tracking-tight">
              {studioData.lat}
            </p>
            <p className="font-extrabold text-[18cqw] leading-[1.15] tracking-tight">
              {studioData.lng}
            </p>
          </div>

          {/* Crosshair frame */}
          <div className="col-start-8 col-span-4 row-start-1 relative h-full -z-1">
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-4xl font-light font-fraunces">+</div>
            <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-4xl font-light font-fraunces">+</div>
            <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-4xl font-light font-fraunces">+</div>
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-4xl font-light font-fraunces">+</div>
          </div>
        </div>
      </div>

      {/* Mobile view */}
      <div className="lg:hidden absolute inset-0 top-20 overflow-y-auto p-16">
        {/* Location section first, framed by crosshairs like the desktop layout */}
        <div className="relative py-20 px-15">
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-4xl font-light font-fraunces">+</div>
          <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-4xl font-light font-fraunces">+</div>
          <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-4xl font-light font-fraunces">+</div>
          <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-4xl font-light font-fraunces">+</div>

          <div className="" style={{ containerType: 'inline-size' }}>
            <h1 className="text-[22cqw] font-bold leading-[0.95] mb-1 tracking-tight uppercase">
              LOCATION
            </h1>
            {mapEmbedUrl ? (
              /* Same clipped-frame trick as desktop: oversized iframe,
                 overflow-hidden wrapper — controls hidden, map draggable. */
              <div className="relative aspect-[3/4] w-full mb-4 bg-gray-300 overflow-hidden">
                <iframe
                  src={mapEmbedUrl}
                  title="Studio location map"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute border-0"
                  style={{ width: "160%", height: "160%", left: "-30%", top: "-30%" }}
                />
              </div>
            ) : (
              <PlaceholderImage
                hue={0}
                label="Google Map"
                className="aspect-[3/4] w-full mb-6 bg-gray-300"
                treated={false}
              />
            )}
            <p className="font-extrabold text-[18cqw] leading-[1.15] tracking-tight">
              {studioData.lat}
            </p>
            <p className="font-extrabold text-[18cqw] leading-[1.15] tracking-tight">
              {studioData.lng}
            </p>
          </div>
        </div>

        {/* Come visit us section, below the Location block */}
        <div className="pt-16">
          <h2 className="text-[15px] font-bold uppercase mb-6">{contactTitle}</h2>
          <p className="font-sans text-[14px] leading-[1.6] max-w-[420px] mb-10 whitespace-pre-line">
            {contactDescription}
          </p>
          <dl className="space-y-2 mb-14 text-[14px]">
            <div className="flex gap-2">
              <dt className="font-bold w-4">T</dt>
              <dd className="font-sans">: {studioData.phone}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold w-4">E</dt>
              <dd className="font-sans">: {studioData.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold w-4">W</dt>
              <dd className="font-sans">: {studioData.web}</dd>
            </div>
          </dl>
          <h2 className="text-[15px] font-bold uppercase mb-6">Connect online</h2>
          <div className="flex items-center gap-4 mb-10">
            {socials.map(({ icon, label, url }) => (
              <a
                key={label}
                href={url}
                aria-label={label}
                className="flex h-7 w-7 items-center justify-center text-black hover:opacity-70 transition-opacity"
              >
                {icon ? (
                  <Image src={icon} alt={label} width={22} height={22} />
                ) : (
                  <span className="text-lg">{label.charAt(0)}</span>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}