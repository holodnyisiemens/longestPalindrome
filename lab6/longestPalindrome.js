'use strict';

const { SuffixTree } = require('./suffixTree');

// Разделитель, гарантированно отсутствующий в строке.
function pickSeparator(used) {
  let code = 35; // '#'
  while (used.has(String.fromCharCode(code))) code++;
  const sep = String.fromCharCode(code);
  used.add(sep);
  return sep;
}

/**
 * Наибольший палиндром в строке s (как подстрока) через суффиксное дерево.
 *
 * Идея. Пусть R = reverse(s). Строим обобщённое суффиксное дерево строки
 * s + sep1 + R + sep2. Зеркальное отражение позиции i в s - это позиция
 * в R, поэтому палиндром с центром вокруг i - это общий префикс
 * «правой» и «зеркально левой» частей, то есть LCE двух суффиксов:
 *
 *   нечётный (центр - символ i): LCE(s[i+1..], R[n-i..]) = d
 *                                -> палиндром s[i-d .. i+d],   длина 2d+1
 *   чётный  (центр между c-1 и c): LCE(s[c..], R[n-c..]) = d
 *                                -> палиндром s[c-d .. c+d-1], длина 2d
 *
 * Разделители sep1, sep2 не дают LCE «выйти» за границы половин строки,
 * поэтому граничные случаи проверять не нужно. LCE отвечается деревом
 * через LCA за O(log n), центров 2n-1, итого поиск O(n log n).
 */
function longestPalindrome(s) {
  const n = s.length;
  if (n === 0) return { palindrome: '', start: -1, length: 0 };

  const used = new Set(s);
  const sep1 = pickSeparator(used);
  const sep2 = pickSeparator(used);

  const reversed = s.split('').reverse().join('');
  const tree = new SuffixTree(s + sep1 + reversed + sep2);

  const rAt = (p) => n + 1 + p; // позиция в R -> индекс в объединённом тексте

  let bestLen = 1; // один символ - всегда палиндром
  let bestStart = 0;
  const consider = (len, start) => {
    if (len > bestLen) {
      bestLen = len;
      bestStart = start;
    }
  };

  for (let i = 0; i < n; i++) {
    // нечётные длины: центр - символ s[i]
    const d = i === n - 1 ? 0 : tree.lce(i + 1, rAt(n - i));
    consider(2 * d + 1, i - d);
  }

  for (let c = 1; c < n; c++) {
    // чётные длины: центр - между s[c-1] и s[c]
    const d = tree.lce(c, rAt(n - c));
    consider(2 * d, c - d);
  }

  return {
    palindrome: s.slice(bestStart, bestStart + bestLen),
    start: bestStart,
    length: bestLen,
  };
}

module.exports = { longestPalindrome };
