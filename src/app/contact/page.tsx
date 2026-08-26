import Nav from "@/components/Nav";
import PlaceholderImage from "@/components/PlaceholderImage";
import { studio } from "@/lib/data";
import Image from "next/image";

export default function ContactPage() {
  const socials = [
    { icon: "/Asset 2_Insta.svg", label: "Instagram" },
    { icon: "/Asset 3_Facebook.svg", label: "Facebook" },
    { icon: "/Asset 4_Linkedin.svg", label: "LinkedIn" },
  ];

  return (
    <main className="relative h-[100svh] w-full bg-white text-black font-sans overflow-hidden">
      <Nav />

      {/* Desktop view */}
      <div className="hidden lg:block absolute inset-0 top-[84px]">
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-1 gap-6 px-[120px] pt-[8vh] pb-[8vh] z-10">
          <div className="col-start-3 col-span-3 row-start-1 h-full flex flex-col justify-center -mr-6">
            <h2 className="text-[14px] font-bold uppercase mb-5 tracking-wide">Come visit us</h2>
            <p className="font-sans text-[14px] leading-[1.7] mb-5">
              Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed
              diam nonummy nibh euismod tincidunt ut laoreet dolore magna
              aliquam erat volutpat. Ut wisi enim ad minim veniam, quis
              nostrud exerci tation ullamcorper suscipit lobortis nisl ut
            </p>
            <dl className="space-y-3 mb-16 text-[13px]">
              <div className="flex gap-2">
                <dt className="font-bold w-2">T</dt>
                <dd className="font-bold w-6 text-center">:</dd>
                <dd className="font-sans">{studio.phone}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-bold w-2">E</dt>
                <dd className="font-bold w-6 text-center">: </dd>
                <dd className="font-sans">{studio.email}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-bold w-2">W</dt>
                <dd className="font-bold w-6 text-center">:</dd>
                <dd className="font-sans">{studio.web}</dd>
              </div>
            </dl>
            <h2 className="text-[14px] font-bold uppercase mb-6 tracking-wide">Connect online</h2>
            <div className="flex items-center gap-5">
              {socials.map(({ icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="flex h-7 w-7 items-center justify-center text-black hover:opacity-70 transition-opacity"
                >
                  <Image src={icon} alt={label} width={24} height={24} />
                </a>
              ))}
            </div>
          </div>

          <div className="col-start-9 col-span-2 row-start-1 -mx-6 h-full flex flex-col justify-center">
            <h1 className="text-[51px] font-extrabold leading-[0.95] mb-1 tracking-tight uppercase">
              LOCATION
            </h1>
            <PlaceholderImage
              hue={0}
              label="Google Map"
              className="aspect-[3/4] w-full mb-8 bg-gray-300"
              treated={false}
            />
            <p className="font-extrabold text-[42px] leading-[1.15] tracking-tight">
              {studio.lat}
            </p>
            <p className="font-extrabold text-[42px] leading-[1.15] tracking-tight">
              {studio.lng}
            </p>
          </div>

          {/* Crosshair frame */}
          <div className="col-start-8 col-span-4 row-start-1 relative h-full">
            <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-2xl font-light text-black/40">+</div>
            <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-2xl font-light text-black/40">+</div>
            <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-2xl font-light text-black/40">+</div>
            <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-2xl font-light text-black/40">+</div>
          </div>
        </div>
      </div>

      {/* Mobile view */}
      <div className="lg:hidden absolute inset-0 top-20 overflow-y-auto px-8 pt-8 pb-16">
        {/* Location section first, framed by crosshairs like the desktop layout */}
        <div className="relative py-20 px-16">
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 text-xl font-light text-black/40">+</div>
          <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 text-xl font-light text-black/40">+</div>
          <div className="absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 text-xl font-light text-black/40">+</div>
          <div className="absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 text-xl font-light text-black/40">+</div>

          <div className="">
            <h1 className="text-[44px] font-extrabold leading-[0.95] mb-6 tracking-tight uppercase">
              LOCATION
            </h1>
            <PlaceholderImage
              hue={0}
              label="Google Map"
              className="aspect-square w-full mb-6 bg-gray-300"
              treated={false}
            />
            <p className="font-extrabold text-[26px] leading-[1.15] tracking-tight">
              {studio.lat}
            </p>
            <p className="font-extrabold text-[26px] leading-[1.15] tracking-tight">
              {studio.lng}
            </p>
          </div>
        </div>

        {/* Come visit us section, below the Location block */}
        <div className="pt-16">
          <h2 className="text-[15px] font-bold uppercase mb-6">Come visit us</h2>
          <p className="font-sans text-[14px] leading-[1.6] max-w-[420px] mb-10">
            Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed
            diam nonummy nibh euismod tincidunt ut laoreet dolore magna
            aliquam erat volutpat. Ut wisi enim ad minim veniam, quis
            nostrud exerci tation ullamcorper suscipit lobortis nisl ut
          </p>
          <dl className="space-y-2 mb-14 text-[14px]">
            <div className="flex gap-2">
              <dt className="font-bold w-4">T</dt>
              <dd className="font-sans">: {studio.phone}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold w-4">E</dt>
              <dd className="font-sans">: {studio.email}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold w-4">W</dt>
              <dd className="font-sans">: {studio.web}</dd>
            </div>
          </dl>
          <h2 className="text-[15px] font-bold uppercase mb-6">Connect online</h2>
          <div className="flex items-center gap-4 mb-10">
            {socials.map(({ icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="flex h-7 w-7 items-center justify-center text-black hover:opacity-70 transition-opacity"
              >
                <Image src={icon} alt={label} width={22} height={22} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}