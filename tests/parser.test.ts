import { describe, it, expect } from 'vitest';
import { parseIndonesianTransaction } from '../services/parser';

describe('Indonesian Transaction Parser', () => {
  it('parses informal amount with "ribu"', () => {
    const res = parseIndonesianTransaction('kopi 18 ribu pakai GoPay');
    expect(res.amount).toBe(18000);
    expect(res.type).toBe('expense');
    expect(res.accountHint).toBe('gopay');
    expect(res.categoryHint).toBe('Food & Drinks');
  });

  it('parses informal amount with "juta"', () => {
    const res = parseIndonesianTransaction('gaji 5.5 juta BCA');
    expect(res.amount).toBe(5500000);
    expect(res.type).toBe('income');
    expect(res.accountHint).toBe('bca');
  });

  it('parses explicit cash transaction', () => {
    const res = parseIndonesianTransaction('bayar parkir 3000 tunai');
    expect(res.amount).toBe(3000);
    expect(res.type).toBe('expense');
    expect(res.accountHint).toBe('cash');
    expect(res.categoryHint).toBe('Transportation');
  });
});