import bcrypt from "bcrypt";
import { User } from "../models/user.model.ts";
import {
  createUserSchema,
  updateUserSchema,
  loginSchema,
  changePasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type LoginInput,
  type ChangePasswordInput,
} from "../validators/user.validator.ts";
import { SALT_ROUNDS } from "../constant/constant.ts";

export async function CreateUser(input: CreateUserInput) {
  const data = createUserSchema.parse(input);
  const password = await bcrypt.hash(data.password, SALT_ROUNDS);
  return User.create({ ...data, password });
}

export async function GetUsers() {
  return User.find();
}

export async function GetUserById(id: string) {
  return User.findById(id);
}

export async function UpdateUser(id: string, input: UpdateUserInput) {
  const data = updateUserSchema.parse(input);
  if (data.password) {
    data.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }
  return User.findByIdAndUpdate(id, data, { new: true });
}

export async function DeleteUser(id: string) {
  return User.findByIdAndDelete(id);
}

export async function Register(input: CreateUserInput) {
  const data = createUserSchema.parse(input);
  const existing = await User.findOne({ username: data.username });
  if (existing) {
    return null;
  }
  const password = await bcrypt.hash(data.password, SALT_ROUNDS);
  try {
    return await User.create({ ...data, password });
  } catch (err) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === 11000
    ) {
      return null;
    }
    throw err;
  }
}

export async function Login(input: LoginInput) {
  const data = loginSchema.parse(input);
  const user = await User.findOne({ username: data.username });
  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    return null;
  }
  return user;
}

export async function ChangePassword(
  userId: string,
  input: ChangePasswordInput,
) {
  const data = changePasswordSchema.parse(input);
  const user = await User.findById(userId);
  if (!user) {
    return "not_found" as const;
  }
  if (!(await bcrypt.compare(data.oldPassword, user.password))) {
    return "invalid_old_password" as const;
  }
  user.password = await bcrypt.hash(data.newPassword, SALT_ROUNDS);
  await user.save();
  return "ok" as const;
}
