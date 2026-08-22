"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkerJob, WorkerOk, WorkerReply } from "./worker-protocol";
import type { JsonErrorPosition } from "./types";

export interface JobFailure {
    error: string;
    position?: JsonErrorPosition;
}

type Pending = {
    resolve: (value: WorkerOk) => void;
    reject: (reason: JobFailure) => void;
};

/**
 * One worker per hook instance, lazily created on first job.
 *
 * Jobs carry an incrementing id; replies for superseded ids are dropped, which
 * is how typing fast never renders a stale result. `cancelAll` bumps the
 * generation so in-flight replies are ignored without tearing the worker down.
 */
export function useJsonWorker() {
    const workerRef = useRef<Worker | null>(null);
    const pendingRef = useRef(new Map<number, Pending>());
    const nextIdRef = useRef(1);
    const [busy, setBusy] = useState(false);

    const ensureWorker = useCallback((): Worker => {
        if (workerRef.current) return workerRef.current;
        const worker = new Worker(new URL("./json.worker.ts", import.meta.url), { type: "module" });
        worker.onmessage = (event: MessageEvent<WorkerReply>) => {
            const reply = event.data;
            const pending = pendingRef.current.get(reply.id);
            if (!pending) return; // superseded or cancelled
            pendingRef.current.delete(reply.id);
            if (pendingRef.current.size === 0) setBusy(false);
            if (reply.ok) pending.resolve(reply.result);
            else pending.reject({ error: reply.error, position: reply.position });
        };
        worker.onerror = (event) => {
            const failure: JobFailure = { error: event.message || "JSON worker crashed" };
            for (const pending of pendingRef.current.values()) pending.reject(failure);
            pendingRef.current.clear();
            setBusy(false);
        };
        workerRef.current = worker;
        return worker;
    }, []);

    useEffect(() => {
        // capture the maps up front — the refs are read during cleanup, after render
        const pending = pendingRef.current;
        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
            pending.clear();
        };
    }, []);

    const run = useCallback(
        <J extends Omit<WorkerJob, "id">>(job: J): Promise<WorkerOk> => {
            const worker = ensureWorker();
            const id = nextIdRef.current++;
            setBusy(true);
            return new Promise<WorkerOk>((resolve, reject) => {
                pendingRef.current.set(id, { resolve, reject });
                worker.postMessage({ ...job, id } as WorkerJob);
            });
        },
        [ensureWorker],
    );

    /** Drop every in-flight job. Used when the input changes under a running job. */
    const cancelAll = useCallback(() => {
        pendingRef.current.clear();
        setBusy(false);
    }, []);

    /**
     * A hung job means a pathological document. Terminating is the only way out
     * of a blocked worker, so hard-reset and let the next call recreate it.
     */
    const reset = useCallback(() => {
        workerRef.current?.terminate();
        workerRef.current = null;
        pendingRef.current.clear();
        setBusy(false);
    }, []);

    return { run, cancelAll, reset, busy };
}
