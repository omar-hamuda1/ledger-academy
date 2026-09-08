import { revalidatePath } from "next/cache";

/**
 * Drop the cache on the public pages that list courses. They're ISR
 * (`revalidate = 300`), so without this an admin publishing or editing a
 * course wouldn't see it on the catalog / homepage for up to 5 minutes.
 * `/courses/[slug]` is `force-dynamic`, so it needs no help.
 */
export function revalidateCourseSurfaces() {
  revalidatePath("/");
  revalidatePath("/courses");
}
