import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
];

interface UploadResponse {
  success: boolean;
  text?: string;
  error?: string;
  fileName?: string;
  fileType?: string;
}

/**
 * Extract text from uploaded file
 */
async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;

  // Handle text files
  if (fileType === 'text/plain') {
    return await file.text();
  }

  // Handle images - return a placeholder indicating image was uploaded
  // In production, you would use OCR service like Tesseract.js or cloud OCR
  if (fileType.startsWith('image/')) {
    return `[Изображение загружено: ${file.name}]\n\nПожалуйста, опишите содержание изображения или добавьте текстовое описание материала.`;
  }

  // Handle PDF files - return placeholder
  // In production, you would use pdf-parse or similar library
  if (fileType === 'application/pdf') {
    return `[PDF документ загружен: ${file.name}]\n\nПожалуйста, добавьте текстовое описание содержания PDF или ключевые темы для создания урока.`;
  }

  throw new Error('Unsupported file type');
}

/**
 * Validate file
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Файл слишком большой. Максимальный размер: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Неподдерживаемый тип файла. Разрешены: PDF, изображения (JPEG, PNG, GIF, WebP), текстовые файлы`,
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user role
    if (session.user.role !== 'TEACHER' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Only teachers and admins can upload files' },
        { status: 403 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Extract text from file
    const extractedText = await extractTextFromFile(file);

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileName: file.name,
      fileType: file.type,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process file',
      },
      { status: 500 }
    );
  }
}
