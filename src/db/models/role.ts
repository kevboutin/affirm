import mongoose, { Schema, Document } from "mongoose";

export interface RoleDocument extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string;
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

const Role = mongoose.model<RoleDocument>("Role", RoleSchema);
export default Role;
