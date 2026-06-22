import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert the File object to an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Parse the PDF using the new class API
    const parser = new PDFParse({ data: arrayBuffer });
    const textResult = await parser.getText();
    const infoResult = await parser.getInfo();
    await parser.destroy();

    return NextResponse.json({
      text: textResult.text,
      info: infoResult.info || null,
      numpages: textResult.total
    });
  } catch (error) {
    console.error('PDF parsing error:', error);
    return NextResponse.json({ error: 'Failed to parse PDF file' }, { status: 500 });
  }
}
