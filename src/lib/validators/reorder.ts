import { z } from "zod";

// Move a module or lesson one step within its parent (swap `order` with the
// adjacent sibling). Used by PATCH /api/modules/[id] and /api/lessons/[id].
export const moveSchema = z.object({
  action: z.literal("move"),
  direction: z.enum(["up", "down"]),
});
