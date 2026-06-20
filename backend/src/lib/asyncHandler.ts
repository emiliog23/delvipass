import { Request, Response, NextFunction } from "express";

type AsyncFn<T extends Request = Request> = (req: T, res: Response, next: NextFunction) => Promise<void>;

export function asyncHandler<T extends Request = Request>(fn: AsyncFn<T>) {
  return (req: T, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
