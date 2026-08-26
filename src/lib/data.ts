import {client} from './sanity'
import {defineQuery} from 'next-sanity'
import {createImageUrlBuilder} from '@sanity/image-url'

const builder = createImageUrlBuilder(client)

// Minimal shape for whatever Sanity image reference/asset object we pass in —
// avoids `any` without depending on a submodule path that isn't exported by
// the installed @sanity/image-url version.
type SanityImageSource = Record<string, unknown> | string;

function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

export type ProjectType = "competition" | "building" | "interior";
export type ProjectCategory = "architecture" | "graphic design" | "speculatives";

export interface Project {
  _id?: string;
  slug: string | { _type: string; current: string };
  name: string;
  type: ProjectType;
  category: ProjectCategory;
  categoryLabel: string;
  year: string;
  team: string[];
  thumbnail: SanityImageSource;
  images: SanityImageSource[];
  link?: {
    label: string;
    href: string;
  };
}

export interface ProjectWithUrls {
  _id: string;
  slug: string;
  name: string;
  type: ProjectType;
  category: ProjectCategory;
  categoryLabel: string;
  year: string;
  team: string[];
  thumbnail: string;
  images: string[];
  link?: {
    label: string;
    href: string;
  };
}

const PROJECTS_QUERY = defineQuery(`*[_type == "project"] | order(name asc) {
  _id,
  slug,
  name,
  type,
  category,
  categoryLabel,
  year,
  team,
  thumbnail,
  images,
  link
}`)

const PEOPLE_QUERY = defineQuery(`*[_type == "person"] | order(name asc) {
  _id,
  slug,
  name,
  title,
  bio,
  image
}`)

export async function getProjects(): Promise<ProjectWithUrls[]> {
  try {
    console.log('Fetching projects from Sanity...')
    const projects = await client.fetch<Project[]>(PROJECTS_QUERY)
    console.log('Fetched projects:', projects.length)

    return projects.map(project => {
      const slugValue = typeof project.slug === 'string' ? project.slug : project.slug?.current || project._id || 'unknown'
      const idValue = project._id || slugValue

      return {
        _id: idValue,
        slug: slugValue,
        name: project.name,
        type: project.type,
        category: project.category,
        categoryLabel: project.categoryLabel,
        year: project.year,
        team: project.team,
        thumbnail: urlFor(project.thumbnail).url() || '',
        images: project.images.map(img => urlFor(img).url() || ''),
        link: project.link,
      }
    })
  } catch (error) {
    console.error('Error fetching projects from Sanity:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return []
  }
}

export async function getPeople(): Promise<PersonWithUrls[]> {
  try {
    console.log('Fetching people from Sanity...')
    const people = await client.fetch<Person[]>(PEOPLE_QUERY)
    console.log('Fetched people:', people.length)

    return people.map(person => {
      const slugValue = typeof person.slug === 'string' ? person.slug : person.slug?.current || person._id || 'unknown'

      return {
        slug: slugValue,
        name: person.name,
        title: person.title,
        bio: person.bio,
        image: urlFor(person.image).url() || '',
      }
    })
  } catch (error) {
    console.error('Error fetching people from Sanity:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return []
  }
}

const CMS = "https://cms.obys.agency/uploads";

export const projects: Project[] = [
  {
    slug: "makhno",
    name: "Makhno",
    type: "building",
    category: "architecture",
    categoryLabel: "Architecture, Furniture > Creative Direction, Web Design/Dev",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/Makhno_Thumbnail_e6008952f7.webp`,
    images: [
      `${CMS}/4_d60deabfc7.webp`,
      `${CMS}/3_61eaa2ef0e.webp`,
      `${CMS}/2_f63b7e3ace.webp`,
      `${CMS}/5_dc16a1c3ba.webp`,
      `${CMS}/1_07dad2a9f2.webp`,
    ],
    link: { label: "Live Website", href: "https://makhnostudio.com/" },
  },
  {
    slug: "source-unknown",
    name: "Source Unknown",
    type: "competition",
    category: "graphic design",
    categoryLabel: "Fashion > Web Design/Dev",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/Source_Unknown_Thumbnail_7e7a08561b.webp`,
    images: [
      `${CMS}/2_4f6e7c9601.webp`,
      `${CMS}/3_358aa19c90.webp`,
      `${CMS}/4_6a16cdb6e5.webp`,
      `${CMS}/1_361f0c4de4.webp`,
    ],
    link: { label: "Live Website", href: "https://sourceunknown.com/" },
  },
  {
    slug: "autex",
    name: "Autex",
    type: "building",
    category: "architecture",
    categoryLabel: "Architecture > Web Design",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/1_fae12fb704.webp`,
    images: [
      `${CMS}/2_34f333eab7.webp`,
      `${CMS}/3_b6e46a4e81.webp`,
      `${CMS}/4_0a67c74b1c.webp`,
      `${CMS}/1_fae12fb704.webp`,
    ],
    link: { label: "Live Website", href: "https://www.autexacoustics.com/" },
  },
  {
    slug: "odins-crow",
    name: "Odin's Crow",
    type: "competition",
    category: "graphic design",
    categoryLabel: "Fashion, Photography > Creative Direction, Web Design/Dev",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/Odin_s_Crow_Thumbnail_4dc8764e8a.webp`,
    images: [
      `${CMS}/2_a987f8efea.webp`,
      `${CMS}/4_121c62dd28.webp`,
      `${CMS}/3_99212447a5.webp`,
      `${CMS}/1_26952c8565.webp`,
    ],
    link: { label: "Live Website", href: "https://www.odins-crow.com/" },
  },
  {
    slug: "olga-prudka",
    name: "Olga Prudka",
    type: "competition",
    category: "graphic design",
    categoryLabel: "Photography, Fashion > Web Design/Dev, Identity",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/Olga_Prudka_Thumbnail_73c88a2131.webp`,
    images: [
      `${CMS}/2_9f1fea89b4.webp`,
      `${CMS}/3_c94451e427.webp`,
      `${CMS}/4_3680b29405.webp`,
      `${CMS}/1_d30add58d2.webp`,
    ],
    link: { label: "Live Website", href: "https://olgaprudka.com/" },
  },
  {
    slug: "yulia",
    name: "Yulia",
    type: "competition",
    category: "graphic design",
    categoryLabel: "Fashion > Web Design/Dev, Identity",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/Yulia_Thumbnail_3226edc489.webp`,
    images: [
      `${CMS}/2_8849fc7278.webp`,
      `${CMS}/3_f53389314e.webp`,
      `${CMS}/4_a0943eba84.webp`,
      `${CMS}/1_4c3b04956d.webp`,
    ],
    link: { label: "Live Website", href: "https://www.yulia.world/" },
  },
  {
    slug: "the-ways-we-work-miro",
    name: "The Ways We Work (Miro)",
    type: "interior",
    category: "graphic design",
    categoryLabel: "Technology > Web Design/Dev",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/Miro_Thumbnail_413fefb05d.webp`,
    images: [
      `${CMS}/2_2c11ce7d00.webp`,
      `${CMS}/3_b29c10c1bd.webp`,
      `${CMS}/4_e152df3fce.webp`,
      `${CMS}/1_ec45b1254e.webp`,
    ],
    link: { label: "Live Website", href: "https://miro.com/ways-we-work/" },
  },
  {
    slug: "design-education-series",
    name: "Design Education Series",
    type: "interior",
    category: "speculatives",
    categoryLabel: "Education > Concept, Web Design/Dev, Identity",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/DES_Thumbnail_41ecc849b9.webp`,
    images: [
      `${CMS}/4_1096f7705f.webp`,
      `${CMS}/2_0317dfd5fa.webp`,
      `${CMS}/3_1f827da6a8.webp`,
      `${CMS}/1_5ac4cf38db.webp`,
      `${CMS}/5_6042623bdc.webp`,
    ],
    link: { label: "Live Website", href: "https://des.obys.agency/" },
  },
  {
    slug: "obys-design-books",
    name: "Obys' Design Books",
    type: "interior",
    category: "speculatives",
    categoryLabel: "Education > Concept, Web Design/Dev, Identity",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/ODB_Thumbnail_ed9b4aa0f3.webp`,
    images: [
      `${CMS}/4_540fbc8831.webp`,
      `${CMS}/2_6b1e569493.webp`,
      `${CMS}/3_ec493d851b.webp`,
      `${CMS}/1_6e800534a8.webp`,
    ],
    link: { label: "Live Website", href: "https://library.obys.agency/" },
  },
  {
    slug: "eminente",
    name: "Eminente",
    type: "competition",
    category: "graphic design",
    categoryLabel: "Fashion, Photography > Creative Direction, Web Design/Dev",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/Eminente_Thumbnail_d7767e1666.webp`,
    images: [
      `${CMS}/1_22e4391710.webp`,
      `${CMS}/3_4fe51a6040.webp`,
      `${CMS}/4_1dc327c5c6.webp`,
      `${CMS}/2_f6a2ac9943.webp`,
      `${CMS}/4_540fbc8831.webp`,
      `${CMS}/2_6b1e569493.webp`,
      `${CMS}/3_ec493d851b.webp`,
      `${CMS}/1_6e800534a8.webp`,
       `${CMS}/2_b422b21b3e.webp`,
      `${CMS}/3_0f85b8fe4c.webp`,
      `${CMS}/4_401129b850.webp`,
      `${CMS}/1_69944f25df.webp`,
    ],
    link: { label: "Live Website", href: "https://eminente.art/" },
  },
  {
    slug: "abetka",
    name: "Abetka",
    type: "interior",
    category: "speculatives",
    categoryLabel: "Culture > Concept, Web Design/Dev, Identity",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/Abetka_Thumbnail_25b7c61177.webp`,
    images: [
      `${CMS}/2_b422b21b3e.webp`,
      `${CMS}/3_0f85b8fe4c.webp`,
      `${CMS}/4_401129b850.webp`,
      `${CMS}/1_69944f25df.webp`,
    ],
    link: { label: "Live Website", href: "https://abetkaua.com/en/" },
  },
  {
    slug: "black-sheep",
    name: "BlackSheep",
    type: "building",
    category: "architecture",
    categoryLabel: "Architecture, Development > Creative Direction, Web Design/Dev",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/Black_Sheep_Thumbnail_09c8874314.webp`,
    images: [
      `${CMS}/3_2f959fd1d3.webp`,
      `${CMS}/1_3ac0a44266.webp`,
      `${CMS}/2_0a2374c087.webp`,
    ],
  },
  {
    slug: "salience-labs",
    name: "Salience Labs",
    type: "interior",
    category: "graphic design",
    categoryLabel: "Technology > Web Design/Dev, 3D",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/1_176ec7aa0f.webp`,
    images: [
      `${CMS}/2_da3bcf5a7b.webp`,
      `${CMS}/3_2630a74643.webp`,
      `${CMS}/4_417f96fdb9.webp`,
      `${CMS}/1_176ec7aa0f.webp`,
    ],
    link: {
      label: "Case Study",
      href: "https://www.behance.net/gallery/245642205/Salience-Labs-Brand-identity-website-pitch-deck",
    },
  },
  {
    slug: "ai-modernism-of-kharkiv",
    name: "AI Modernism of Kharkiv",
    type: "interior",
    category: "speculatives",
    categoryLabel: "Culture, Side Project > Concept, Web Design/Dev, Identity",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/AIM_Thumbnail_de091a7b48.webp`,
    images: [
      `${CMS}/2_f97f768226.webp`,
      `${CMS}/3_88a574ff0f.webp`,
      `${CMS}/4_13f0898c4e.webp`,
      `${CMS}/1_1516452be2.webp`,
    ],
    link: { label: "Live Website", href: "https://aim.obys.agency/" },
  },
  {
    slug: "glyphic-biotechnologies",
    name: "Glyphic Biotechnologies",
    type: "competition",
    category: "graphic design",
    categoryLabel: "Technology, Biotech > Creative Direction, Web Design/Dev, 3D",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/Glyphic_Biotechnologies_Thumbnail_50ecd8bb9a.webp`,
    images: [
      `${CMS}/2_ef1c47d529.webp`,
      `${CMS}/3_b09a548288.webp`,
      `${CMS}/4_a9b3dd1da7.webp`,
      `${CMS}/1_7cca9955f2.webp`,
    ],
    link: { label: "Live Website", href: "https://www.glyphic.bio/" },
  },
  {
    slug: "porsche-taycan",
    name: "Porsche Taycan",
    type: "building",
    category: "architecture",
    categoryLabel: "Automotive > Web Design/Dev",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/4_1eae03d525.webp`,
    images: [
      `${CMS}/3_605599b9bb.webp`,
      `${CMS}/2_44df5053d1.webp`,
      `${CMS}/1_d8491c4cc7.webp`,
      `${CMS}/4_1eae03d525.webp`,
    ],
  },
  {
    slug: "ayocin-atmos-lamp",
    name: "Ayocin (Atmos Lamp)",
    type: "building",
    category: "graphic design",
    categoryLabel: "Technology, Furniture > Creative Direction, Web Design/Dev",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/Ayocin_Thumbnail_0965a26e06.webp`,
    images: [
      `${CMS}/2_558cb379ff.webp`,
      `${CMS}/3_3dbf0836e3.webp`,
      `${CMS}/4_da975008dc.webp`,
      `${CMS}/1_7f4b53ffe6.webp`,
    ],
    link: { label: "Live Website", href: "https://ayocin.com/" },
  },
  {
    slug: "grids",
    name: "Grids",
    type: "interior",
    category: "speculatives",
    categoryLabel: "Education, Side Project > Concept, Web Design/Dev, Identity",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/Grids_Thumbnail_674aa5712c.webp`,
    images: [
      `${CMS}/3_3b02e49a1a.webp`,
      `${CMS}/4_f66498ddfd.webp`,
      `${CMS}/5_56a1f766fb.webp`,
      `${CMS}/1_c0361f2f3c.webp`,
      `${CMS}/2_f3f1143b0a.webp`,
    ],
    link: { label: "Live Website", href: "https://grids.obys.agency/" },
  },
  {
    slug: "peter-lindbergh",
    name: "Peter Lindbergh",
    type: "competition",
    category: "graphic design",
    categoryLabel: "Fashion, Photography > Concept, Web Design/Dev",
    year: "",
    team: ["Obys Agency"],
    thumbnail: `${CMS}/Peter_Thumbnail_bee0ce3a78.webp`,
    images: [
      `${CMS}/1_2321985242.webp`,
      `${CMS}/3_5b21762fd9.webp`,
      `${CMS}/4_215ada8649.webp`,
      `${CMS}/2_e41ffd064d.webp`,
    ],
    link: { label: "Live Website", href: "https://peterlindbergh.obys.agency/" },
  },
];

export interface Person {
  _id?: string;
  slug: string | { _type: string; current: string };
  name: string;
  title: string;
  bio: string;
  image: SanityImageSource;
}

export interface PersonWithUrls {
  slug: string;
  name: string;
  title: string;
  bio: string;
  image: string;
}

export const people: Person[] = [
  {
    slug: "bm-tahammul-kabir",
    name: "B.M. Tahammul Kabir",
    title: "Founding Partner",
    bio: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim.",
    image: "",
  },
  {
    slug: "ridwan-noor",
    name: "Ridwan Noor",
    title: "Founding Partner",
    bio: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim.",
    image: "",
  },
  {
    slug: "ahnaf-araf",
    name: "Ahnaf Araf",
    title: "Associate",
    bio: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim.",
    image: "",
  },
  {
    slug: "full-name-1",
    name: "Full Name",
    title: "Title",
    bio: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim.",
    image: "",
  },
  {
    slug: "full-name-2",
    name: "Full Name",
    title: "Title",
    bio: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim.",
    image: "",
  },
  {
    slug: "full-name-3",
    name: "Full Name",
    title: "Title",
    bio: "Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim.",
    image: "",
  },
];

export const studio = {
  phone: "+880 1971 306540",
  email: "office@project-kaizen.net",
  web: "www.project-kaizen.net",
  lat: "23°47'42.3\"N",
  lng: "90°23'55.3\"E",
};