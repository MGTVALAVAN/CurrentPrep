import { readFileSync, readdirSync } from 'fs';
import path from 'path';

const { PDFParse } = require('pdf-parse');

const PDF_DIR = path.join(process.cwd(), 'src', 'data', 'pyq', 'pdfs');

async function testExtract() {
    const files = readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf')).sort();
    
    const testFiles = [files[0], files[15], files[files.length - 1]];
    
    for (const file of testFiles) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`FILE: ${file}`);
        console.log(`${'='.repeat(60)}`);
        
        const buf = readFileSync(path.join(PDF_DIR, file));
        const parser = new PDFParse(buf);
        const data = await parser.getAll();
        
        console.log(`Pages: ${data.pages}`);
        
        // Get the text from all pages
        const allText = data.content.map((item: any) => item.text || '').join('\n');
        console.log(`Text length: ${allText.length} chars`);
        console.log(`\nFIRST 2000 chars:\n`);
        console.log(allText.substring(0, 2000));
        console.log(`\n--- SNIP ---\n`);
    }
}

testExtract().catch(console.error);
