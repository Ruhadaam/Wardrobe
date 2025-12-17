/**
 * Converts a snake_case or kebab-case string to Title Case.
 * Example: "business_casual" -> "Business Casual"
 */
export const formatLabel = (text: string | undefined | null): string => {
    if (!text) return '';

    // Replace underscores and hyphens with spaces
    const spaced = text.replace(/[_-]/g, ' ');

    // Capitalize first letter of each word
    return spaced.replace(/\b\w/g, (char) => char.toUpperCase());
};
