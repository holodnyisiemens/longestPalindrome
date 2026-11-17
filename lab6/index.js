'use strict';

const { SuffixTree } = require('./suffixTree');
const { longestPalindrome } = require('./longestPalindrome');

console.log('--- Примеры: наибольший палиндром ---');
const examples = [
  'abracadabra',
  'bananas',
  'forgeeksskeegfor',
  'abaaba',
  'abcbaxyz',
  'xabay',
  'aa',
  'abc',
  'a',
  '',
];
for (const s of examples) {
  const r = longestPalindrome(s);
  console.log(
    `${JSON.stringify(s).padEnd(20)} -> ${JSON.stringify(r.palindrome)}` +
      ` (длина ${r.length}, начало ${r.start})`
  );
}

console.log('\n--- Самопроверка на случайных строках (сравнение с грубой силой) ---');
function bruteLongest(s) {
  const isPal = (i, j) => {
    while (i < j) if (s[i++] !== s[j--]) return false;
    return true;
  };
  for (let len = s.length; len >= 1; len--) {
    for (let i = 0; i + len <= s.length; i++) {
      if (isPal(i, i + len - 1)) {
        return { palindrome: s.slice(i, i + len), start: i, length: len };
      }
    }
  }
  return { palindrome: '', start: -1, length: 0 };
}

const TESTS = 500;
let passed = 0;
for (let t = 0; t < TESTS; t++) {
  const len = Math.floor(Math.random() * 61);
  const alphabet = Math.random() < 0.3 ? 'ab' : 'abc';
  let s = '';
  for (let k = 0; k < len; k++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  const got = longestPalindrome(s);
  const want = bruteLongest(s);
  if (got.length !== want.length) {
    console.log(
      `ОШИБКА: s=${JSON.stringify(s)} получено ${JSON.stringify(got)}, ожидалось ${JSON.stringify(want)}`
    );
    break;
  }
  passed++;
}
console.log(`пройдено ${passed}/${TESTS} тестов`);

console.log('\n--- Суффиксное дерево для "banana$" (сжатый бор всех суффиксов) ---');
console.log(dump(new SuffixTree('banana$')));

console.log('--- Производительность ---');
const big = Array.from({ length: 2000 }, () => 'abcd'[Math.floor(Math.random() * 4)]).join('');
const t0 = Date.now();
const r = longestPalindrome(big);
console.log(
  `строка длины ${big.length}: дерево + поиск за ${Date.now() - t0} мс, палиндром длины ${r.length}`
);

// Вывод дерева: отступ = глубина, на ребрах - метки-подстроки.
function dump(tree, limit = 50) {
  const lines = [];
  let shown = 0;
  const rec = (node, indent) => {
    for (const edge of node.children.values()) {
      if (shown >= limit) return;
      shown++;
      const label = tree.text.slice(edge.start, edge.end + 1);
      const tail = edge.target.isLeaf ? `  (лист: суффикс ${edge.target.suffixIndex})` : '';
      lines.push(indent + label + tail);
      rec(edge.target, indent + '  ');
    }
  };
  rec(tree.root, '');
  return lines.join('\n');
}
