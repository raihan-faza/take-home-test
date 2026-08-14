import { z } from "zod";

export const createUserSchema = z.object({
  fullname: z.string().min(1, "fullname is required"),
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "password is required"),
});

export const updateUserSchema = createUserSchema.partial();

export const loginSchema = z.object({
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "password is required"),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "oldPassword is required"),
  newPassword: z.string().min(1, "newPassword is required"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
