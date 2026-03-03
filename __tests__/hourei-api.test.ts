import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LAW_TYPE_LABELS,
  LAW_TYPE_COLORS,
  extractText,
  extractArticles,
} from '../lib/hourei-api';
import type { LawNode } from '../types/hourei';

describe('LAW_TYPE_LABELS', () => {
  it('法令種別の日本語ラベルが正しく定義されている', () => {
    expect(LAW_TYPE_LABELS['Constitution']).toBe('憲法');
    expect(LAW_TYPE_LABELS['Act']).toBe('法律');
    expect(LAW_TYPE_LABELS['CabinetOrder']).toBe('政令');
    expect(LAW_TYPE_LABELS['MinisterialOrdinance']).toBe('省令');
    expect(LAW_TYPE_LABELS['Rule']).toBe('規則');
    expect(LAW_TYPE_LABELS['Misc']).toBe('その他');
  });
});

describe('LAW_TYPE_COLORS', () => {
  it('各法令種別にカラーが定義されている', () => {
    const types = ['Constitution', 'Act', 'CabinetOrder', 'MinisterialOrdinance', 'Rule', 'Misc'];
    types.forEach(type => {
      expect(LAW_TYPE_COLORS[type]).toBeDefined();
      expect(LAW_TYPE_COLORS[type].bg).toBeDefined();
      expect(LAW_TYPE_COLORS[type].text).toBeDefined();
    });
  });
});

describe('extractText', () => {
  it('文字列をそのまま返す', () => {
    expect(extractText('テスト')).toBe('テスト');
  });

  it('配列の文字列を結合する', () => {
    expect(extractText(['テスト', '1', '2'])).toBe('テスト12');
  });

  it('ノードのchildrenからテキストを抽出する', () => {
    const node: LawNode = {
      tag: 'Sentence',
      attr: {},
      children: ['この法律は', 'テストです'],
    };
    expect(extractText(node)).toBe('この法律はテストです');
  });

  it('ネストしたノードからテキストを抽出する', () => {
    const node: LawNode = {
      tag: 'Paragraph',
      attr: {},
      children: [
        {
          tag: 'Sentence',
          attr: {},
          children: ['第一条'],
        },
        '　この法律は',
      ],
    };
    expect(extractText(node)).toBe('第一条　この法律は');
  });
});

describe('extractArticles', () => {
  it('法令本文から条文を抽出する', () => {
    const lawFullText: LawNode = {
      tag: 'Law',
      attr: {},
      children: [
        {
          tag: 'LawBody',
          attr: {},
          children: [
            {
              tag: 'MainProvision',
              attr: {},
              children: [
                {
                  tag: 'Article',
                  attr: { Num: '1', Delete: 'false', Hide: 'false' },
                  children: [
                    {
                      tag: 'ArticleCaption',
                      attr: {},
                      children: ['（目的）'],
                    },
                    {
                      tag: 'ArticleTitle',
                      attr: {},
                      children: ['第一条'],
                    },
                    {
                      tag: 'Paragraph',
                      attr: { Num: '1', Hide: 'false', OldStyle: 'false' },
                      children: [
                        {
                          tag: 'Sentence',
                          attr: {},
                          children: ['この法律は、テストの目的のために制定する。'],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    const articles = extractArticles(lawFullText);
    expect(articles).toHaveLength(1);
    expect(articles[0].num).toBe('1');
    expect(articles[0].caption).toBe('（目的）');
    expect(articles[0].title).toBe('第一条');
    expect(articles[0].paragraphs).toHaveLength(1);
    expect(articles[0].paragraphs[0]).toContain('この法律は');
  });

  it('条文がない場合は空配列を返す', () => {
    const emptyNode: LawNode = {
      tag: 'Law',
      attr: {},
      children: [],
    };
    expect(extractArticles(emptyNode)).toHaveLength(0);
  });

  it('nullやundefinedに対して安全に動作する', () => {
    expect(extractArticles(null)).toHaveLength(0);
    expect(extractArticles(undefined)).toHaveLength(0);
  });
});
