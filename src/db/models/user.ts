import mongoose, { Schema, Document } from "mongoose";
import { RoleDocument } from "./role";

export interface UserDocument extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    password?: string;
    email: string;
    phone?: string;
    locale?: string;
    timezone?: string;
    roles?: Array<mongoose.Types.ObjectId>;
    verifiedEmail: boolean;
    verifiedPhone: boolean;
    authType: string;
    idpClient?: string;
    idpMetadata?: string;
    idpSub?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserDocumentWithRoles extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    password?: string;
    email: string;
    phone?: string;
    locale?: string;
    timezone?: string;
    roles: Array<RoleDocument>;
    verifiedEmail: boolean;
    verifiedPhone: boolean;
    authType: string;
    idpClient?: string;
    idpMetadata?: string;
    idpSub?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface RedactedUserDocument extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    email: string;
    phone?: string;
    locale?: string;
    timezone?: string;
    roles?: Array<mongoose.Types.ObjectId>;
    verifiedEmail: boolean;
    verifiedPhone: boolean;
    authType: string;
    idpClient?: string;
    idpMetadata?: string;
    idpSub?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface RedactedUserDocumentWithRoles extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    email: string;
    phone?: string;
    locale?: string;
    timezone?: string;
    roles: Array<RoleDocument>;
    verifiedEmail: boolean;
    verifiedPhone: boolean;
    authType: string;
    idpClient?: string;
    idpMetadata?: string;
    idpSub?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserUpdateDocument extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    password?: string;
    email: string;
    phone?: string;
    locale?: string;
    timezone?: string;
    roles?: Array<string>;
    verifiedEmail?: boolean;
    verifiedPhone?: boolean;
    authType?: string;
    idpClient?: string;
    idpMetadata?: string;
    idpSub?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const UserSchema = new Schema(
    {
        authType: {
            type: String,
            enum: ["oidc", "oauth"],
            default: "oauth",
        },
        email: { type: String, required: true, unique: true },
        idpClient: { type: String, required: false },
        idpMetadata: { type: String, required: false },
        idpSub: { type: String, required: false },
        locale: { type: String, required: false },
        password: { type: String, required: false },
        phone: { type: String, required: false },
        roles: {
            type: [Schema.ObjectId],
            required: false,
            ref: "Role",
        },
        timezone: { type: String, required: false },
        username: { type: String, required: true, unique: true },
        verifiedEmail: { type: Boolean, default: false },
        verifiedPhone: { type: Boolean, default: false },
    },
    { timestamps: true, collection: "users" },
);

const User = mongoose.model<UserDocument>("User", UserSchema);
export default User;
