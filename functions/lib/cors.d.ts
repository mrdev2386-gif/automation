/**
 * Global CORS wrapper for all HTTP endpoints
 */
export function withCors(handler: any): (req: any, res: any) => void;
/**
 * Wrapper for callable functions when using emulator
 */
export function withCallableCors(handler: any): (data: any, context: any) => Promise<any>;
/**
 * HTTP wrapper that delegates to callable function logic
 */
export function createCallableHttpWrapper(callableHandler: any): (req: any, res: any) => void;
/**
 * CORS Utilities Module
 * Centralized CORS middleware and wrappers for all HTTP endpoints
 */
export const cors: (req: import("cors").CorsRequest, res: {
    statusCode?: number | undefined;
    setHeader(key: string, value: string): any;
    end(): any;
}, next: (err?: any) => any) => void;
//# sourceMappingURL=cors.d.ts.map