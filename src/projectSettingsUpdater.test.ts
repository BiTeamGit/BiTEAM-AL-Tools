import { describe, it, expect } from 'vitest';
import { swapExtension, ensureCodeCops } from './projectSettingsUpdater';

const DEVOPS = 'cosmoconsult.cosmo-azure-devops';
const ALPACA = 'cosmoconsult.cosmo-alpaca';

describe('swapExtension', () => {
  it('replaces cosmo-azure-devops with cosmo-alpaca', () => {
    const recs = [DEVOPS, 'some.other'];
    expect(swapExtension(recs)).toBe(true);
    expect(recs).toContain(ALPACA);
    expect(recs).not.toContain(DEVOPS);
  });
  it('removes cosmo-azure-devops when cosmo-alpaca already present', () => {
    const recs = [DEVOPS, ALPACA];
    expect(swapExtension(recs)).toBe(true);
    expect(recs).toHaveLength(1);
    expect(recs[0]).toBe(ALPACA);
  });
  it('returns false and leaves array unchanged when cosmo-azure-devops absent', () => {
    const recs = [ALPACA, 'some.other'];
    expect(swapExtension(recs)).toBe(false);
    expect(recs).toHaveLength(2);
  });
  it('returns false for empty array', () => {
    expect(swapExtension([])).toBe(false);
  });
});

describe('ensureCodeCops', () => {
  const REQUIRED = ['CodeCop', 'UICop', 'PerTenantExtensionCop'];

  it('returns false when all required cops present', () => {
    expect(ensureCodeCops([...REQUIRED])).toBe(false);
  });
  it('returns false when required cops present plus extras', () => {
    expect(ensureCodeCops([...REQUIRED, 'ExtraCop'])).toBe(false);
  });
  it('returns full list when one cop is missing', () => {
    expect(ensureCodeCops(['CodeCop', 'UICop'])).toEqual(REQUIRED);
  });
  it('returns full list for empty array', () => {
    expect(ensureCodeCops([])).toEqual(REQUIRED);
  });
  it('returns full list when value is not an array', () => {
    expect(ensureCodeCops(undefined)).toEqual(REQUIRED);
    expect(ensureCodeCops(null)).toEqual(REQUIRED);
    expect(ensureCodeCops('string')).toEqual(REQUIRED);
  });
});
