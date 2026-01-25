declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
    }
  }
}

export {};