
export function getInitials(name: string): string {
    if (!name) return "";

    const words = name
        .trim()
        .split(/\s+/)
        .filter((word) => /[a-zA-Z]/.test(word)); // Filter out non-letter words

    if (words.length === 0) return "";

    if (words.length === 1) {
        const letters = words[0].replace(/[^a-zA-Z]/g, "");
        return letters.slice(0, 2).toUpperCase();
    }

    const first = words[0][0];
    const last = words[words.length - 1][0];
    return (first + last).toUpperCase();
}
