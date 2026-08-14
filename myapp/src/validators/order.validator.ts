import { z } from "zod";

export const orderStatusSchema = z.enum(["created", "start", "done"]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

export const allowedNextStatus: Record<OrderStatus, readonly OrderStatus[]> = {
  created: ["start"],
  start: ["done"],
  done: [],
};

const destinationSchema = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([
    z.number().min(-180).max(180),
    z.number().min(-90).max(90),
  ]),
});

export const createOrderSchema = z.object({
  item: z.string().min(1, "item is required"),
  destination: destinationSchema,
  truckId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "invalid ObjectId")
    .optional(),
  status: orderStatusSchema.optional().default("created"),
});

export const updateOrderSchema = (currentStatus: OrderStatus) =>
  z.object({
    item: z.string().min(1, "item is required").optional(),
    destination: destinationSchema.optional(),
    truckId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "invalid ObjectId")
      .optional(),
    status: orderStatusSchema.optional().superRefine((status, ctx) => {
      if (status === undefined) return;
      const allowed = allowedNextStatus[currentStatus];
      if (!allowed.includes(status)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Cannot transition from "${currentStatus}" to "${status}". Allowed: ${
            allowed.length ? allowed.join(", ") : "none"
          }`,
        });
      }
    }),
  });

export const updateStatusSchema = z.object({
  status: orderStatusSchema,
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<ReturnType<typeof updateOrderSchema>>;
