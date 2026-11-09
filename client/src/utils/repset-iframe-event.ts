
interface RepsetIframeEvent {
    source: "repset";
    version: 1;
    type: "event";
    command: string;
    payload?: unknown;
}

const isRepsetOrigin = (origin: string) => {
    try {
        const { protocol, hostname } = new URL(origin);
        if (import.meta.env.DEV) return hostname === "localhost";

        return protocol === "https:" && (hostname === "repset.io" || hostname.endsWith(".repset.io"));
    } catch {
        return false;
    }
};

export function isRepsetIframeEvent(event: MessageEvent): event is MessageEvent<RepsetIframeEvent> {
    const data = event.data;
    return (
        isRepsetOrigin(event.origin) &&
        typeof data === "object" &&
        data !== null &&
        data.source === "repset" &&
        data.version === 1 &&
        data.type === "event" &&
        typeof data.command === "string"
    );
}
