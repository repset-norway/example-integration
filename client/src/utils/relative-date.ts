
export function relativeDate(date: Date | string): string {
    const diffMs = Date.now() - new Date(date).getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    if (days > 0) return rtf.format(-days, "day");
    if (hours > 0) return rtf.format(-hours, "hour");
    if (minutes > 0) return rtf.format(-minutes, "minute");
    return rtf.format(-seconds, "second");
}

export function formatDateTimeHuman(date: Date | string) {
    return new Date(date).toLocaleString("nb-NO", {
        day: "numeric",
        month: "short",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
}
