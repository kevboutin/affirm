import mongoose, { Schema, Document } from "mongoose";

export interface UserDocument extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    email: string;
    phone?: string;
    locale?: string;
    timezone?: string;
    roles?: Array<mongoose.Types.ObjectId>;
    verifiedEmail?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserUpdateDocument extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    email: string;
    phone?: string;
    locale?: string;
    timezone?: string;
    roles?: Array<string>;
    verifiedEmail?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const UserSchema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        username: { type: String, required: true, unique: true },
        phone: { type: String, required: false },
        roles: { type: Array, required: false },
        locale: { type: String, required: false },
        timezone: { type: String, required: false },
        verifiedEmail: { type: Boolean, default: false },
    },
    { timestamps: true, collection: "users" },
);

const User = mongoose.model<UserDocument>("User", UserSchema);
export default User;
