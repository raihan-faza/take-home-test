import { Schema } from "mongoose";

export const UserSchema = new Schema(
  {
    fullname: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc: unknown, ret: any) => {
        delete ret.password;
        return ret;
      },
    },
  },
);
