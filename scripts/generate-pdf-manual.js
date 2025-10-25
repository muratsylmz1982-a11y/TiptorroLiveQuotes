/**
 * TTQuotes PDF Manual Generator
 * Konvertiert die HTML-Benutzeranleitung in eine druckbare PDF-Datei
 * 
 * Usage: node scripts/generate-pdf-manual.js
 */

const fs = require('fs');
const path = require('path');

// Puppeteer für PDF-Generierung
let puppeteer;
try {
    puppeteer = require('puppeteer');
} catch (e) {
    console.error('❌ Puppeteer ist nicht installiert!');
    console.error('📦 Bitte installieren: npm install --save-dev puppeteer');
    process.exit(1);
}

// Standardmäßig USER_GUIDE, kann über CLI-Argument überschrieben werden
const docType = process.argv[2] || 'user';

const HTML_PATHS = {
    user: path.join(__dirname, '..', 'docs', 'USER_GUIDE.html'),
    support: path.join(__dirname, '..', 'docs', 'SUPPORT_INSTALLATION.html')
};

const PDF_PATHS = {
    user: path.join(__dirname, '..', 'docs', 'TTQuotes_Benutzerhandbuch_v1.2.5.pdf'),
    support: path.join(__dirname, '..', 'docs', 'TTQuotes_Support_Installation_v1.2.5.pdf')
};

const HTML_PATH = HTML_PATHS[docType];
const PDF_PATH = PDF_PATHS[docType];

/**
 * Generiert PDF aus HTML-Datei
 */
async function generatePDF() {
    const docName = docType === 'support' ? 'Support Installation' : 'Benutzerhandbuch';
    console.log(`🚀 TTQuotes PDF Generator - ${docName}`);
    console.log('================================\n');

    // Prüfe ob HTML-Datei existiert
    if (!fs.existsSync(HTML_PATH)) {
        console.error(`❌ HTML-Datei nicht gefunden: ${HTML_PATH}`);
        process.exit(1);
    }

    console.log(`📄 HTML-Quelle: ${HTML_PATH}`);
    console.log(`📑 PDF-Ziel: ${PDF_PATH}\n`);

    let browser;
    try {
        console.log('🌐 Starte Headless Browser...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        console.log('📖 Öffne HTML-Seite...');
        const page = await browser.newPage();
        
        // Lade HTML-Datei
        await page.goto(`file://${HTML_PATH}`, {
            waitUntil: 'networkidle0'
        });

        console.log('🎨 Generiere PDF....');
        
        // PDF-Optionen
        await page.pdf({
            path: PDF_PATH,
            format: 'A4',
            printBackground: true,
            margin: {
                top: '20mm',
                right: '15mm',
                bottom: '20mm',
                left: '15mm'
            },
            displayHeaderFooter: true,
            headerTemplate: `
                <div style="font-size: 10px; color: #737373; text-align: center; width: 100%; padding: 10px 0;">
                    <span style="color: #269947; font-weight: 700;">TTQuotes</span> - ${docName} v1.2.5
                </div>
            `,
            footerTemplate: `
                <div style="font-size: 9px; color: #737373; text-align: center; width: 100%; padding: 10px 0;">
                    <span style="color: #269947;">©</span> 2025 Torro Tec GmbH • Seite <span class="pageNumber"></span> von <span class="totalPages"></span>
                </div>
            `
        });

        console.log('✅ PDF erfolgreich generiert!\n');

        // Zeige Dateigröße
        const stats = fs.statSync(PDF_PATH);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`📊 Dateigröße: ${fileSizeMB} MB`);
        console.log(`📁 Speicherort: ${PDF_PATH}\n`);

        console.log('🎉 Fertig! Die PDF-Datei ist bereit.');

    } catch (error) {
        console.error('❌ Fehler bei PDF-Generierung:', error);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Script ausführen
if (require.main === module) {
    generatePDF().catch(error => {
        console.error('❌ Unerwarteter Fehler:', error);
        process.exit(1);
    });
}

module.exports = { generatePDF };

