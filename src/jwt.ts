import { JWTPayload, jwtVerify, KeyObject, SignJWT } from "jose";
import { RoleDocument } from "./db/models/role";

export interface AffirmTokenPayload extends JWTPayload {
    sub: string;
    email: string;
    aud: string;
    exp: number;
    iat: number;
    iss: string;
    locale?: string;
    nbf: number;
    roles?: RoleDocument[];
    timezone?: string;
    username: string;
}

export namespace jwt {
    export function create(
        payload: JWTPayload,
        algorithm: string,
        privateKey: KeyObject,
    ) {
        return new SignJWT(payload)
            .setProtectedHeader({ alg: algorithm, typ: "JWT", kid: "sst" })
            .sign(privateKey);
    }

    export function verify<T>(
        token: string,
        publicKey: KeyObject,
        algorithms: string[],
        issuer: string,
        audience: string,
    ) {
        return jwtVerify<T>(token, publicKey, {
            algorithms,
            issuer,
            audience,
        });
    }
}
