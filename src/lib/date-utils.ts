export const parseLocalDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    // Handle "YYYY-MM-DD" manually to ensure local time construction
    // This avoids the UTC interpretation of ISO date strings
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    }
    return new Date(dateStr);
};

export const formatDateDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = parseLocalDate(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};
