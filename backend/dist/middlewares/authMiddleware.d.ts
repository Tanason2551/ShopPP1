import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email?: string;
        role: string;
        dbId: string;
    };
}
export declare const authMiddleware: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const adminOnly: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=authMiddleware.d.ts.map