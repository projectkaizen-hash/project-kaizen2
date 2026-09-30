// FS Lightbox ships without TypeScript types. The props used here follow the
// library's documented API: `toggler` (open/close), `sources` (media urls)
// and `slide` (1-based index to open at).
declare module "fslightbox-react" {
  import type { ComponentType } from "react";

  export interface FsLightboxProps {
    toggler: boolean;
    sources?: string[];
    slide?: number;
    [key: string]: unknown;
  }

  const FsLightbox: ComponentType<FsLightboxProps>;
  export default FsLightbox;
}
