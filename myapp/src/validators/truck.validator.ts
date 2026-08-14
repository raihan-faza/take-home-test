import { z } from "zod";

export const createTruckSchema = z.object({
  policeNumber: z.number(),
  truckType: z.string().min(1, "truckType is required"),
  location: z.object({
    type: z.literal("Point"),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-90).max(90),
    ]),
  }),
});

export const updateTruckSchema = createTruckSchema
  .omit({ location: true })
  .partial();

export type CreateTruckInput = z.infer<typeof createTruckSchema>;
export type UpdateTruckInput = z.infer<typeof updateTruckSchema>;

export const updateTruckLocationSchema = createTruckSchema.pick({
  location: true,
});

export type UpdateTruckLocationInput = z.infer<
  typeof updateTruckLocationSchema
>;
