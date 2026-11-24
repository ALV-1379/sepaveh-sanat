import { describe, expect, it } from 'vitest';
import { contentUrl, publicPath } from './catalog';
import { reorder } from './Editor';

describe('localized paths', () => {
  it('uses Persian at the root and prefixes English', () => {
    expect(publicPath('fa-IR', 'products')).toBe('/products');
    expect(publicPath('en-US', 'products')).toBe('/en/products');
    expect(contentUrl('fa-IR', 'PAGE', 'home')).toBe('/public/content/fa-IR/PAGE/home');
  });
});

describe('page builder', () => {
  it('moves a section while preserving the original order in state', () => {
    const blocks = ['hero', 'products', 'cta'];
    expect(reorder(blocks, 1, 0)).toEqual(['products', 'hero', 'cta']);
    expect(blocks).toEqual(['hero', 'products', 'cta']);
  });
  it('ignores invalid drag operations', () => {
    const blocks = ['hero', 'products'];
    expect(reorder(blocks, -1, 0)).toBe(blocks);
  });
});
