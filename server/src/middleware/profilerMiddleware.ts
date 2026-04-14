import type { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export interface ProfilerData {
  startTime: bigint;
  dbTime: bigint;
  queryCount: number;
}

export const profilerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();
  
  // Initialize profiling data for this request
  res.locals.profiler = {
    startTime,
    dbTime: BigInt(0),
    queryCount: 0,
  } as ProfilerData;

  // Listen for the response to finish
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationNs = endTime - startTime;
    const durationMs = Number(durationNs) / 1_000_000;
    
    const profiler = res.locals.profiler as ProfilerData;
    const dbTimeMs = Number(profiler.dbTime) / 1_000_000;

    // Log the request summary
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: durationMs.toFixed(2),
      dbTimeMs: dbTimeMs.toFixed(2),
      queryCount: profiler.queryCount,
    }, `${req.method} ${req.originalUrl} - ${durationMs.toFixed(2)}ms`);
  });

  next();
};
