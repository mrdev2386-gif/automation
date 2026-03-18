/**
 * Initialize worker monitoring
 */
export function initializeWorkerMonitoring(): void;
/**
 * Stop heartbeat
 */
export function stopHeartbeat(): Promise<void>;
/**
 * Increment active jobs
 */
export function incrementActiveJobs(): void;
/**
 * Decrement active jobs
 */
export function decrementActiveJobs(): void;
/**
 * Check for dead workers
 */
export function checkDeadWorkers(): Promise<number>;
//# sourceMappingURL=workerMonitoringService.d.ts.map