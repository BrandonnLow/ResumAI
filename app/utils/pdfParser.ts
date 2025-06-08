// Basic PDF parsing utilities
// This is a placeholder implementation for PDF text extraction

export const parsePdfText = async (file: File): Promise<string> => {
    // For now, we'll just throw an error to indicate this feature needs implementation
    // In a real implementation, you would use a library like pdf-parse or pdf2pic
    throw new Error('PDF parsing not yet implemented. Please enter information manually.');
};

// Helper function to validate file types
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
    return allowedTypes.includes(file.type);
};

// Helper function to validate file size (in MB)
export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
};