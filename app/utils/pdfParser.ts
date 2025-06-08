// Basic PDF parsing utilities
// Placeholder implementation for PDF text extraction, will further research on the best library to use
// You'll use pdf-parse or pdf2pic in most cases

export const parsePdfText = async (file: File): Promise<string> => {
    // For now, we'll just throw an error to indicate this feature needs implementation
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