export interface ParsedResult {
  type: 'income' | 'expense' | 'transfer';
  amount: number | null;
  description: string;
  categoryHint: string | null;
  accountHint: string | null;
  confidence: number;
}

export function parseIndonesianTransaction(input: string): ParsedResult {
  const text = input.trim().toLowerCase();

  let amount: number | null = null;
  let type: 'income' | 'expense' | 'transfer' = 'expense';
  let accountHint: string | null = null;
  let categoryHint: string | null = null;

  // 1. Account hints detection
  if (text.includes('gopay')) accountHint = 'gopay';
  else if (text.includes('ovo')) accountHint = 'ovo';
  else if (text.includes('dana')) accountHint = 'dana';
  else if (text.includes('bca')) accountHint = 'bca';
  else if (text.includes('mandiri')) accountHint = 'mandiri';
  else if (text.includes('tunai') || text.includes('cash')) accountHint = 'cash';

  // 2. Transaction type detection
  if (
    text.includes('uang saku') || 
    text.includes('gaji') || 
    text.includes('dapat') || 
    text.includes('pemasukan') || 
    text.includes('transfer masuk')
  ) {
    type = 'income';
  } else if (text.includes('transfer ke') || text.includes('kirim ke')) {
    type = 'transfer';
  }

  // 3. Category hints detection
  if (text.includes('makan') || text.includes('kopi') || text.includes('nasi') || text.includes('minum')) {
    categoryHint = 'Food & Drinks';
  } else if (text.includes('parkir') || text.includes('bensin') || text.includes('gojek') || text.includes('grab')) {
    categoryHint = 'Transportation';
  } else if (text.includes('belanja') || text.includes('tokopedia') || text.includes('shopee')) {
    categoryHint = 'Shopping';
  } else if (text.includes('bayar') || text.includes('listrik') || text.includes('pulsa')) {
    categoryHint = 'Bills & Utilities';
  }

  // 4. Amount parsing (ribu/rb/k, juta/jt, or plain numbers)
  const ribuMatch = text.match(/(\d+(?:[\.,]\d+)?)\s*(?:ribu|rb|k)/);
  const jutaMatch = text.match(/(\d+(?:[\.,]\d+)?)\s*(?:juta|jt)/);
  const rawNumberMatch = text.match(/\b\d{3,9}\b/);

  if (ribuMatch) {
    amount = Math.round(parseFloat(ribuMatch[1].replace(',', '.')) * 1000);
  } else if (jutaMatch) {
    amount = Math.round(parseFloat(jutaMatch[1].replace(',', '.')) * 1000000);
  } else if (rawNumberMatch) {
    amount = parseInt(rawNumberMatch[0], 10);
  }

  // Clean description
  let description = input;
  if (amount) {
    description = description.replace(/\d+(?:[\.,]\d+)?\s*(?:ribu|rb|k|juta|jt)?/gi, '').trim();
  }

  const confidence = amount !== null ? 0.85 : 0.3;

  return {
    type,
    amount,
    description: description || input,
    categoryHint,
    accountHint,
    confidence,
  };
}