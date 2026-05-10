import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare const createRestockBill: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getRestockBills: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=restockController.d.ts.map