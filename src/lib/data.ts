import {client} from './sanity'
import {defineQuery} from 'next-sanity'
import type {PortableTextBlock} from '@portabletext/types'
import {urlFor, type SanityImageSource} from './image'

export interface Project {
  _id?: string;
  slug: string | { _type: string; current: string };
  name: string;
  category: { _id: string; name: string; categorySlug: string } | null;
  subcategory?: Array<{_id: string; name: string; subcategorySlug: string}> | null;
  description?: PortableTextBlock[] | null;
  info?: PortableTextBlock[] | null;
  thumbnail: SanityImageSource;
  images: SanityImageSource[];
}

export interface ProjectWithUrls {
  _id: string;
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  subcategorySlugs: string[];
  description: PortableTextBlock[] | null;
  info: PortableTextBlock[] | null;
  thumbnail: string;
  images: string[];
}

/**
 * Category is now a CMS document referenced by projects. The GROQ join
 * resolves the reference to a {_id, name, slug} object.
 */
export interface Category {
  _id: string;
  name: string;
  slug: string;
  order: number;
}

const CATEGORIES_QUERY = defineQuery(
  `*[_type == "category"] | order(order asc) {
    _id,
    name,
    "slug": slug.current,
    order
  }`
)

const PROJECTS_QUERY = defineQuery(`*[_type == "project"] | order(name asc) {
  _id,
  slug,
  name,
  category->{ _id, name, "categorySlug": slug.current },
  subcategory[]->{ _id, name, "subcategorySlug": slug.current },
  description,
  info,
  thumbnail,
  images
}`)

const PEOPLE_QUERY = defineQuery(`*[_type == "person"] {
  _id,
  slug,
  name,
  order,
  title,
  bio,
  image
}`)

export interface ProcessStep {
  _id: string;
  order: number;
  heading: PortableTextBlock[] | null;
  image: SanityImageSource | null;
}

const PROCESS_STEPS_QUERY = defineQuery(`*[_type == "processStep"] | order(order asc) {
  _id,
  order,
  heading,
  image
}`)

/**
 * Homepage singleton: intro text plus the ordered featured-projects list.
 * The reference array is dereferenced so each entry is a full project doc
 * (missing/broken references come back null and are filtered in getHomepage).
 */
const HOMEPAGE_QUERY = defineQuery(`*[_type == "homepage"][0] {
  _id,
  introText,
  featuredProjects[]->{
    _id,
    slug,
    name,
    category->{ _id, name, "categorySlug": slug.current },
    subcategory[]->{ _id, name, "subcategorySlug": slug.current },
    description,
    thumbnail,
    images
  }
}`)

const STUDIO_QUERY = defineQuery(`*[_type == "studio"][0] {
  _id,
  contactTitle,
  contactDescription,
  phone,
  email,
  web,
  lat,
  lng,
  address,
  socials
}`)

function toProjectWithUrls(project: Project): ProjectWithUrls {
  const slugValue = typeof project.slug === 'string' ? project.slug : project.slug?.current || project._id || 'unknown'
  const idValue = project._id || slugValue

  return {
    _id: idValue,
    slug: slugValue,
    name: project.name,
    categorySlug: project.category?.categorySlug ?? '',
    categoryName: project.category?.name ?? '',
    // A project can reference duplicate subcategory docs; unique by slug so
    // the frontend filter matches predictably.
    subcategorySlugs: [
      ...new Set((project.subcategory ?? []).map((s) => s.subcategorySlug).filter(Boolean)),
    ],
    description: project.description ?? null,
    info: project.info ?? null,
    thumbnail: urlFor(project.thumbnail).url() || '',
    images: project.images.map(img => urlFor(img).url() || ''),
  }
}

export interface Subcategory {
  _id: string;
  name: string;
  slug: string;
  parentCategorySlug: string;
  order: number;
}

const SUBCATEGORIES_QUERY = defineQuery(
  `*[_type == "subcategory"] | order(order asc) {
    _id,
    name,
    "slug": slug.current,
    "parentCategorySlug": parent->slug.current,
    order
  }`
)

/**
 * The same sub-category can exist twice in the dataset (e.g. created once by
 * hand and once by the migration script, under different document ids). Group
 * duplicates by parent category + lower-cased name and keep the first, so the
 * filter rows never show the same label twice.
 */
function dedupeSubcategories(subcategories: Subcategory[]): Subcategory[] {
  const byKey = new Map<string, Subcategory>()
  for (const s of subcategories) {
    const key = `${s.parentCategorySlug}::${s.name.trim().toLowerCase()}`
    if (!byKey.has(key)) byKey.set(key, s)
  }
  if (byKey.size < subcategories.length) {
    console.log(`Deduped subcategories: ${subcategories.length} -> ${byKey.size}`)
  }
  return [...byKey.values()]
}

export async function getSubcategories(): Promise<Subcategory[]> {
  try {
    console.log('Fetching subcategories from Sanity...')
    const fetched = await client.fetch<Subcategory[]>(SUBCATEGORIES_QUERY)
    const subcategories = dedupeSubcategories(fetched)
    console.log('Fetched subcategories:', subcategories.length)
    return subcategories
  } catch (error) {
    console.error('Error fetching subcategories from Sanity:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return []
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    console.log('Fetching categories from Sanity...')
    const categories = await client.fetch<Category[]>(CATEGORIES_QUERY)
    console.log('Fetched categories:', categories.length)
    return categories
  } catch (error) {
    console.error('Error fetching categories from Sanity:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return []
  }
}

export async function getProjects(): Promise<ProjectWithUrls[]> {
  try {
    console.log('Fetching projects from Sanity...')
    const projects = await client.fetch<Project[]>(PROJECTS_QUERY)
    console.log('Fetched projects:', projects.length)

    return projects.map(toProjectWithUrls)
  } catch (error) {
    console.error('Error fetching projects from Sanity:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return []
  }
}

export interface Homepage {
  _id?: string;
  introText?: string;
  featuredProjects?: ProjectWithUrls[];
}

/**
 * Fetches the homepage singleton: its intro text and the ordered list of
 * featured projects (via the reference array, resolved to full projects).
 */
export async function getHomepage(): Promise<Homepage | null> {
  try {
    console.log('Fetching homepage from Sanity...')
    const data = await client.fetch<{
      _id: string;
      introText?: string;
      featuredProjects?: Project[];
    }>(HOMEPAGE_QUERY)
    console.log('Fetched homepage:', data ? data._id : null)

    if (!data) return null
    return {
      _id: data._id,
      introText: data.introText,
      featuredProjects: data.featuredProjects?.map(toProjectWithUrls),
    }
  } catch (error) {
    console.error('Error fetching homepage from Sanity:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return null
  }
}

export async function getPeople(): Promise<PersonWithUrls[]> {
  try {
    console.log('Fetching people from Sanity...')
    const people = await client.fetch<Person[]>(PEOPLE_QUERY)
    console.log('Fetched people:', people.length)

    const peopleWithUrls = people.map(person => {
      const slugValue = typeof person.slug === 'string' ? person.slug : person.slug?.current || person._id || 'unknown'

      return {
        slug: slugValue,
        name: person.name,
        order: person.order,
        title: person.title,
        bio: person.bio,
        image: urlFor(person.image).url() || '',
      }
    })

    // CMS `order` field sorts the team list (1 = top). People without an
    // order value go last, keeping alphabetical order among themselves.
    return peopleWithUrls.sort(
      (a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name)
    )
  } catch (error) {
    console.error('Error fetching people from Sanity:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return []
  }
}

export async function getStudio(): Promise<Studio | null> {
  try {
    console.log('Fetching studio from Sanity...')
    const studio = await client.fetch<Studio>(STUDIO_QUERY)
    console.log('Fetched studio:', studio)
    return studio
  } catch (error) {
    console.error('Error fetching studio from Sanity:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return null
  }
}

export async function getProcessSteps(): Promise<ProcessStep[]> {
  try {
    console.log('Fetching process steps from Sanity...')
    const steps = await client.fetch<ProcessStep[]>(PROCESS_STEPS_QUERY)
    console.log('Fetched process steps:', steps.length)
    return steps
  } catch (error) {
    console.error('Error fetching process steps from Sanity:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return []
  }
}

export interface Person {
  _id?: string;
  slug: string | { _type: string; current: string };
  name: string;
  order?: number;
  title: string;
  bio: string;
  image: SanityImageSource;
}

export interface PersonWithUrls {
  slug: string;
  name: string;
  order?: number;
  title: string;
  bio: string;
  image: string;
}export interface Studio {
  _id?: string;
  contactTitle?: string;
  contactDescription?: string;
  phone: string;
  email: string;
  web: string;
  lat: string;
  lng: string;
  address?: string;
  socials?: Array<{
    platform: string;
    url: string;
    icon: string;
  }>;
}
