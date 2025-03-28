import { InferSchemaType, Schema, Document, model, Types } from "mongoose";

export interface RoleDocument extends Document {
    _id: Types.ObjectId;
    name: string;
    description?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

const RoleSchema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String, required: false },
    },
    { timestamps: true, collection: "roles" },
);

type Role = InferSchemaType<typeof RoleSchema>;
const Role = model<Role>("Role", RoleSchema);
export default Role;
