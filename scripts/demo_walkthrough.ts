import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function runDemo() {
  console.log('\n======================================================');
  console.log('🚀 FinSight CA Practice — Automated Demo & Verification');
  console.log('======================================================\n');

  // Step 1: Health Check
  console.log('🔹 1. Testing Server Health (/api/health)...');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const health = await res.json();
    console.log('   ✅ Server is ONLINE:', health);
  } catch (err: any) {
    console.error('   ❌ Server connection failed:', err.message);
    return;
  }

  // Step 2: AI Copilot Query Test
  console.log('\n🔹 2. Testing FinSight AI Copilot (/api/copilot/chat)...');
  try {
    const res = await fetch(`${BASE_URL}/api/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What is the due date for GSTR-3B?' }],
      }),
    });
    const data = await res.json();
    console.log(`   ✅ Copilot Model: ${data.modelUsed || 'default'}`);
    console.log(`   💬 Response snippet:\n   ${(data.reply || '').split('\n').slice(0, 4).join('\n   ')}...`);
  } catch (err: any) {
    console.error('   ❌ Copilot query failed:', err.message);
  }

  // Step 3: Document Extraction Test
  console.log('\n🔹 3. Testing Document Extraction (/api/copilot/extract-document)...');
  const demoDocPath = path.join(process.cwd(), 'demo-documents', 'Sample_4_GST_REG06_Registration_Certificate.txt');
  if (fs.existsSync(demoDocPath)) {
    try {
      const content = fs.readFileSync(demoDocPath, 'utf8');
      const res = await fetch(`${BASE_URL}/api/copilot/extract-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Sample_4_GST_REG06_Registration_Certificate.txt',
          mimeType: 'text/plain',
          textContent: content,
        }),
      });
      const result = await res.json();
      if (result.extracted) {
        console.log('   ✅ Document Analyzed:');
        console.log(`      - Document Title: ${result.extracted.documentTitle || 'N/A'}`);
        console.log(`      - Detected Category: ${result.extracted.detectedCategory || 'N/A'}`);
        console.log(`      - Party Name: ${result.extracted.partyName || 'N/A'}`);
        console.log(`      - GSTIN: ${result.extracted.gstin || 'N/A'}`);
        console.log(`      - Engine Used: ${result.modelUsed || 'local'}`);
      } else {
        console.log('   ℹ️ Response:', result);
      }
    } catch (err: any) {
      console.error('   ❌ Document extraction failed:', err.message);
    }
  } else {
    console.log('   ℹ️ Demo document not found at', demoDocPath);
  }

  // Step 4: Statutory PAN & GSTIN Verification Logic
  console.log('\n🔹 4. Testing Indian Statutory Validators...');
  const testPan = 'AAAYC1234F';
  const panValid = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(testPan);
  console.log(`   ✅ PAN [${testPan}]: ${panValid ? 'VALID format' : 'INVALID'}`);

  const testGstin = '08AAAYC1234F1Z5';
  const gstinFormatValid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(testGstin);
  console.log(`   ✅ GSTIN [${testGstin}]: ${gstinFormatValid ? 'VALID Rajasthan format (08)' : 'INVALID'}`);

  console.log('\n======================================================');
  console.log('🎉 Demo Script Completed Successfully!');
  console.log(`👉 Access web UI at: ${BASE_URL}`);
  console.log('======================================================\n');
}

runDemo();
