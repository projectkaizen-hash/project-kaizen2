import {createImageUrlBuilder} from '@sanity/image-url'
import {client} from './sanity'

const builder = createImageUrlBuilder(client)

// Minimal shape for whatever Sanity image reference/asset object we pass in —
// avoids `any` without depending on a submodule path that isn't exported by
// the installed @sanity/image-url version.
export type SanityImageSource = Record<string, unknown> | string;

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}
