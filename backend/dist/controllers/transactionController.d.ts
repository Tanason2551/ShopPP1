import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
export declare const createTransaction: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const cancelTransaction: (req: AuthRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getTransactions: (req: Request, res: Response) => Promise<void>;
export declare const getSalesReportByProduct: (req: Request, res: Response) => Promise<void>;
export declare const getDeepSummary: (req: Request, res: Response) => Promise<void>;
export declare const getDailySummary: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=transactionController.d.ts.map