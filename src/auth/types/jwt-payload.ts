export type JwtRole = 'ADMIN' | 'SECURITY' | 'AUDITOR' | 'USER'

export interface JwtPayload {
    sub: string;
    email: string;
    role: JwtRole;
}
