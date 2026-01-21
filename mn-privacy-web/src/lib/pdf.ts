import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { LetterContent } from './templates';

const MARGIN = 72; // 1 inch in points
const LINE_HEIGHT = 14;
const FONT_SIZE = 11;
const TITLE_FONT_SIZE = 12;

export async function generatePDF(letter: LetterContent): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  let page = pdfDoc.addPage([612, 792]); // Letter size
  const { width, height } = page.getSize();
  let y = height - MARGIN;

  const drawText = (text: string, options: { font?: typeof timesRoman; size?: number; bold?: boolean } = {}) => {
    const font = options.bold ? timesBold : (options.font || timesRoman);
    const size = options.size || FONT_SIZE;

    page.drawText(text, {
      x: MARGIN,
      y,
      size,
      font,
      color: rgb(0, 0, 0),
    });
    y -= LINE_HEIGHT;
  };

  const drawWrappedText = (text: string, options: { font?: typeof timesRoman; size?: number } = {}) => {
    const font = options.font || timesRoman;
    const size = options.size || FONT_SIZE;
    const maxWidth = width - 2 * MARGIN;

    const words = text.split(' ');
    let line = '';

    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const testWidth = font.widthOfTextAtSize(testLine, size);

      if (testWidth > maxWidth && line) {
        page.drawText(line, {
          x: MARGIN,
          y,
          size,
          font,
          color: rgb(0, 0, 0),
        });
        y -= LINE_HEIGHT;

        // Check if we need a new page
        if (y < MARGIN) {
          page = pdfDoc.addPage([612, 792]);
          y = height - MARGIN;
        }

        line = word;
      } else {
        line = testLine;
      }
    }

    if (line) {
      page.drawText(line, {
        x: MARGIN,
        y,
        size,
        font,
        color: rgb(0, 0, 0),
      });
      y -= LINE_HEIGHT;
    }
  };

  // Date
  drawText(letter.date);
  y -= LINE_HEIGHT;

  // Recipient
  drawText(letter.recipientName, { bold: true });
  drawWrappedText(letter.recipientAddress);
  y -= LINE_HEIGHT;

  // Subject
  drawText(`Re: ${letter.subject}`, { bold: true, size: TITLE_FONT_SIZE });
  y -= LINE_HEIGHT;

  // Body
  const paragraphs = letter.body.split('\n');
  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      y -= LINE_HEIGHT / 2;
      continue;
    }

    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
      // Bold text (headers)
      drawText(paragraph.replace(/\*\*/g, ''), { bold: true });
    } else if (paragraph.startsWith('---')) {
      // Separator
      y -= LINE_HEIGHT / 2;
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: width - MARGIN, y },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= LINE_HEIGHT;
    } else if (paragraph.match(/^\d+\.\s/)) {
      // Numbered list item
      drawWrappedText(paragraph);
    } else {
      drawWrappedText(paragraph);
    }

    // Check if we need a new page
    if (y < MARGIN) {
      page = pdfDoc.addPage([612, 792]);
      y = height - MARGIN;
    }
  }

  return pdfDoc.save();
}

export async function generateMergedPDF(letters: LetterContent[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const letter of letters) {
    const letterPdfBytes = await generatePDF(letter);
    const letterPdf = await PDFDocument.load(letterPdfBytes);
    const pages = await mergedPdf.copyPages(letterPdf, letterPdf.getPageIndices());
    pages.forEach(page => mergedPdf.addPage(page));
  }

  return mergedPdf.save();
}

export function downloadPDF(bytes: Uint8Array, filename: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate filename for a letter
export function getLetterFilename(brokerName: string, requestTypes: string[]): string {
  const sanitized = brokerName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const types = requestTypes.join('-').substring(0, 20);
  const date = new Date().toISOString().split('T')[0];
  return `MCDPA_${sanitized}_${types}_${date}.pdf`;
}
