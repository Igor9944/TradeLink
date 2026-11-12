import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';

interface InvoicePdfData {
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  client: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  supplier: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    productName: string;
    quantity: number;
    priceHT: number;
    totalHT: number;
  }>;
  totalHT: number;
  totalTax: number;
  totalTTC: number;
  currency: string;
  lang: 'fr' | 'en' | 'ar';
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = join(process.cwd(), 'uploads', 'invoices');
  }

  /**
   * Générer une facture PDF avec QR Code
   */
  async generateInvoicePDF(data: InvoicePdfData): Promise<string> {
    try {
      // Créer le dossier si nécessaire
      await mkdir(this.uploadDir, { recursive: true });

      const filePath = join(this.uploadDir, `${data.invoiceNumber}.pdf`);
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = createWriteStream(filePath);

      doc.pipe(stream);

      // Générer QR Code
      const verifyUrl = `${this.configService.get('APP_URL')}/verify/invoice/${data.invoiceNumber}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl);

      // Extraire le base64 du data URL
      const qrCodeBase64 = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const qrCodeBuffer = Buffer.from(qrCodeBase64, 'base64');

      // Configuration selon la langue
      const isRTL = data.lang === 'ar';
      const texts = this.getTranslations(data.lang);

      // En-tête avec QR Code
      doc.fontSize(24).text(texts.invoice, { align: isRTL ? 'right' : 'center' });
      doc.image(qrCodeBuffer, doc.page.width - 150, 50, { width: 100 });

      doc.moveDown();
      doc.fontSize(12);

      // Informations facture
      const align = isRTL ? 'right' : 'left';
      doc.text(`${texts.invoiceNumber}: ${data.invoiceNumber}`, { align });
      doc.text(`${texts.date}: ${data.date.toLocaleDateString(data.lang)}`, { align });
      doc.text(`${texts.dueDate}: ${data.dueDate.toLocaleDateString(data.lang)}`, { align });

      doc.moveDown();

      // Informations client et fournisseur
      const startY = doc.y;
      
      // Client (gauche)
      doc.text(`${texts.client}:`, 50, startY, { underline: true, align: 'left' });
      doc.text(data.client.name, 50, doc.y + 5);
      doc.text(data.client.email, 50, doc.y + 5);
      if (data.client.phone) doc.text(data.client.phone, 50, doc.y + 5);

      // Fournisseur (droite)
      doc.text(`${texts.supplier}:`, 320, startY, { underline: true, align: 'left' });
      doc.text(data.supplier.name, 320, startY + 20);
      doc.text(data.supplier.email, 320, startY + 35);
      if (data.supplier.phone) doc.text(data.supplier.phone, 320, startY + 50);

      doc.y = startY + 100;
      doc.moveDown(2);

      // Tableau des articles
      this.drawTable(doc, data, texts, isRTL);

      // Totaux
      doc.moveDown();
      const totalsX = isRTL ? 50 : 400;
      doc.fontSize(11);
      doc.text(`${texts.totalHT}: ${data.totalHT.toFixed(2)} ${data.currency}`, totalsX, doc.y);
      doc.text(`${texts.tax}: ${data.totalTax.toFixed(2)} ${data.currency}`, totalsX, doc.y + 20);
      doc.fontSize(14).font('Helvetica-Bold');
      doc.text(`${texts.totalTTC}: ${data.totalTTC.toFixed(2)} ${data.currency}`, totalsX, doc.y + 40);

      // Pied de page avec lien de vérification
      doc.fontSize(9).font('Helvetica');
      doc.text(texts.verifyInvoice, 50, doc.page.height - 80, {
        align: 'center',
        link: verifyUrl,
        underline: true,
      });
      doc.text(verifyUrl, { align: 'center' });

      doc.end();

      await new Promise<void>((resolve, reject) => {
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      });

      this.logger.log(`Invoice PDF generated: ${filePath}`);

      return filePath;
    } catch (error) {
      this.logger.error(`PDF generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Dessiner le tableau des articles
   */
  private drawTable(doc: PDFKit.PDFDocument, data: InvoicePdfData, texts: any, isRTL: boolean) {
    const tableTop = doc.y;
    const itemX = isRTL ? 400 : 50;
    const qtyX = isRTL ? 280 : 250;
    const priceX = isRTL ? 180 : 350;
    const totalX = isRTL ? 50 : 450;

    // En-têtes
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(texts.description, itemX, tableTop);
    doc.text(texts.quantity, qtyX, tableTop);
    doc.text(texts.priceUnit, priceX, tableTop);
    doc.text(texts.total, totalX, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Lignes d'articles
    doc.font('Helvetica').fontSize(9);
    let y = tableTop + 25;

    data.items.forEach((item) => {
      doc.text(item.productName, itemX, y, { width: 180 });
      doc.text(item.quantity.toString(), qtyX, y);
      doc.text(item.priceHT.toFixed(2), priceX, y);
      doc.text(item.totalHT.toFixed(2), totalX, y);
      y += 20;
    });

    doc.moveTo(50, y).lineTo(550, y).stroke();
  }

  /**
   * Traductions selon la langue
   */
  private getTranslations(lang: 'fr' | 'en' | 'ar') {
    const translations = {
      fr: {
        invoice: 'FACTURE',
        invoiceNumber: 'Numéro',
        date: 'Date',
        dueDate: 'Date d\'échéance',
        client: 'Client',
        supplier: 'Fournisseur',
        description: 'Désignation',
        quantity: 'Qté',
        priceUnit: 'P.U.',
        total: 'Total',
        totalHT: 'Total HT',
        tax: 'TVA 19%',
        totalTTC: 'Total TTC',
        verifyInvoice: 'Vérifiez cette facture en ligne :',
      },
      en: {
        invoice: 'INVOICE',
        invoiceNumber: 'Number',
        date: 'Date',
        dueDate: 'Due Date',
        client: 'Client',
        supplier: 'Supplier',
        description: 'Description',
        quantity: 'Qty',
        priceUnit: 'Unit Price',
        total: 'Total',
        totalHT: 'Subtotal',
        tax: 'VAT 19%',
        totalTTC: 'Total',
        verifyInvoice: 'Verify this invoice online:',
      },
      ar: {
        invoice: 'فاتورة',
        invoiceNumber: 'رقم',
        date: 'تاريخ',
        dueDate: 'تاريخ الاستحقاق',
        client: 'عميل',
        supplier: 'مورد',
        description: 'الوصف',
        quantity: 'الكمية',
        priceUnit: 'سعر الوحدة',
        total: 'المجموع',
        totalHT: 'المجموع الفرعي',
        tax: 'ضريبة القيمة المضافة 19%',
        totalTTC: 'المجموع الكلي',
        verifyInvoice: 'تحقق من هذه الفاتورة على الإنترنت:',
      },
    };

    return translations[lang];
  }
}
