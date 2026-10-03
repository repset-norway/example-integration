
interface RepsetIframeEvent {
    source: "repset";
    version: 1;
    type: "event";
    command: string;
    payload?: unknown;
}

export function isRepsetIframeEvent(data: unknown): data is RepsetIframeEvent {
    return (
        typeof data === "object" &&
        data !== null &&
        (data as any).source === "repset" &&
        (data as any).version === 1 &&
        (data as any).type === "event" &&
        typeof (data as any).command === "string"
    );
}
