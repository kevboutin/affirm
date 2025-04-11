import { InferSchemaType, Schema, Document, Types, model } from "mongoose";
import { RoleDocument } from "./role";

export interface UserDocument extends Document {
    _id: Types.ObjectId;
    username: string;
    password?: string;
    email: string;
    phone?: string;
    locale?: string;
    timezone?: string;
    roles?: Array<Types.ObjectId>;
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
    _id: Types.ObjectId;
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
    _id: Types.ObjectId;
    username: string;
    email: string;
    phone?: string | null;
    locale?: string | null;
    timezone?: string | null;
    roles?: Array<Types.ObjectId> | null;
    verifiedEmail: boolean;
    verifiedPhone: boolean;
    authType: string;
    idpClient?: string | null;
    idpMetadata?: string | null;
    idpSub?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface RedactedUserPlainObject {
    _id: Types.ObjectId;
    username: string;
    email: string;
    phone?: string | null;
    locale?: string | null;
    timezone?: string | null;
    roles?: Array<Types.ObjectId> | null;
    verifiedEmail: boolean;
    verifiedPhone: boolean;
    authType: string;
    idpClient?: string | null;
    idpMetadata?: string | null;
    idpSub?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface RedactedUserDocumentWithRoles extends Document {
    _id: Types.ObjectId;
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

export interface UserCreateDocument extends Document {
    username: string;
    password?: string;
    email: string;
    phone?: string;
    locale?: string;
    timezone?: string;
    roles?: Array<string>;
    verifiedEmail?: boolean;
    verifiedPhone?: boolean;
    authType?: "oidc" | "oauth";
    idpClient?: string;
    idpMetadata?: string;
    idpSub?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface UserUpdateDocument extends Document {
    _id: Types.ObjectId;
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
            type: [Types.ObjectId],
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

type User = InferSchemaType<typeof UserSchema>;
const User = model<User>("User", UserSchema);
export default User;
