import fs from 'node:fs';
import crypto from 'node:crypto';
import process from 'node:process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const endpoint = required('PREVIEW_MIGRATION_URL');
if (!endpoint.startsWith('https://')) throw new Error('PREVIEW_MIGRATION_URL must use HTTPS');
if (process.env.PREVIEW_MIGRATION_URL.includes('?')) throw new Error('PREVIEW_MIGRATION_URL must not include query parameters');
const secret = required('PREVIEW_MIGRATION_SECRET');
const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const ownerEmail = required('PREVIEW_MIGRATION_OWNER_EMAIL');
const operationId = process.env.PREVIEW_MIGRATION_OPERATION_ID || `catalog-${Date.now()}`;
const batchSize = Math.min(Math.max(Number(process.env.PREVIEW_MIGRATION_BATCH_SIZE || 25), 1), 50);
const storeName = process.env.PREVIEW_MIGRATION_STORE_NAME || 'Hive Pratas';
const slug = process.env.PREVIEW_MIGRATION_SLUG || 'hive';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function loadFirebaseCredentials() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }
  const path = required('GOOGLE_APPLICATION_CREDENTIALS');
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function numberOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeStatus(value) {
  return String(value || '').toLowerCase() === 'inativo' ? 'INATIVO' : 'ATIVO';
}

function sign(body, timestamp, nonce) {
  const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${nonce}.${bodyHash}`).digest('hex');
}

async function sendBatch(batch) {
  const body = JSON.stringify(batch);
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-preview-migration-timestamp': String(timestamp),
      'x-preview-migration-nonce': nonce,
      'x-preview-migration-signature': sign(body, timestamp, nonce),
      ...(vercelBypassSecret ? { 'x-vercel-protection-bypass': vercelBypassSecret } : {}),
    },
    body,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`batch ${batch.batchId} failed with HTTP ${response.status}`);
  return JSON.parse(text);
}

async function main() {
  if (!getApps().length) initializeApp({ credential: cert(loadFirebaseCredentials()) });
  const auth = getAuth();
  const db = getFirestore();
  const identity = await auth.getUserByEmail(ownerEmail);
  const [categorySnapshot, productSnapshot] = await Promise.all([
    db.collection('categories').where('userId', '==', identity.uid).get(),
    db.collection('products').where('userId', '==', identity.uid).get(),
  ]);
  if (categorySnapshot.size !== 8 || productSnapshot.size !== 478) {
    throw new Error('Unexpected Firebase catalog counts; refusing to migrate');
  }

  const categories = categorySnapshot.docs.map((doc) => ({ legacyId: doc.id, name: String(doc.data().name || '').trim() })).filter((item) => item.name);
  const categoriesByName = new Map(categories.map((item) => [item.name, item.legacyId]));
  const products = productSnapshot.docs.map((doc) => {
    const data = doc.data();
    const variants = Array.isArray(data.variantes) ? data.variantes.map((variant, index) => ({
      legacyId: `${doc.id}:variant:${index}`,
      skuSuffix: String(variant.sku_sufixo || `VAR-${index + 1}`),
      adjustmentValue: numberOr(variant.valor_ajuste, 0),
      measurement: variant.medida ? String(variant.medida) : null,
      stock: Math.max(0, Math.trunc(numberOr(variant.estoque, 0))),
      onDemand: Boolean(variant.sob_consulta),
    })) : [];
    return {
      legacyId: doc.id,
      name: String(data.name || '').trim(),
      code: data.code ? String(data.code) : null,
      categoryLegacyId: categoriesByName.get(String(data.category || '').trim()) || null,
      subcategory: data.subcategory ? String(data.subcategory) : null,
      description: data.description ? String(data.description) : null,
      imageUrl: data.imageUrl ? String(data.imageUrl) : null,
      salePrice: numberOr(data.salePrice, 0),
      costPrice: numberOr(data.costPrice, 0),
      quantity: Math.max(0, Math.trunc(numberOr(data.quantity, 0))),
      status: normalizeStatus(data.status),
      variants,
    };
  });
  if (products.some((product) => !product.name || !product.categoryLegacyId)) throw new Error('Invalid product data; refusing to migrate');

  const config = { storeName, slug };
  const results = [];
  results.push(await sendBatch({ operationId, batchId: 'categories', config, categories, products: [] }));
  for (let index = 0; index < products.length; index += batchSize) {
    const batchNumber = String(Math.floor(index / batchSize) + 1).padStart(2, '0');
    results.push(await sendBatch({ operationId, batchId: `products-${batchNumber}`, config, categories: [], products: products.slice(index, index + batchSize) }));
  }
  process.stdout.write(JSON.stringify({ operationId, categories: categories.length, products: products.length, batches: results.length }));
}

main().catch((error) => {
  console.error(`Preview migration failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  process.exitCode = 1;
});
