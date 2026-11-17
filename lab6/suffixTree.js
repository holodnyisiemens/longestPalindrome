'use strict';

/**
 * Суффиксное дерево - сжатый бор (trie) всех суффиксов строки.
 *
 * Строится вставкой суффиксов один за другим (по аналогии с бором):
 * при спуске по ребру, если вставляемый суффикс расходится с меткой ребра,
 * ребро разбивается (split) новым внутренним узлом - так бор превращается
 * в сжатое дерево, где на каждом ребре хранится не один символ, а подстрока
 * (границы [start..end] в исходном тексте).
 *
 * Построение: O(n^2) время / O(n) память (алгоритм Укконена даёт O(n),
 * здесь - наглядная версия «бор + разбиение рёбер»).
 *
 * Дополнительно - двоичные подъёмы для LCA, что позволяет отвечать
 * на запросы LCE (longest common extension) за O(log n).
 */

class Node {
  constructor(id) {
    this.id = id;
    this.children = new Map(); // первый символ метки ребра -> Edge
    this.suffixIndex = -1;     // для листа: позиция суффикса в тексте
    this.strDepth = 0;         // длина строки-пути от корня (в символах)
  }

  get isLeaf() {
    return this.suffixIndex >= 0;
  }
}

class SuffixTree {
  constructor(text) {
    this.text = text;
    this.nodes = [];
    this.leafAt = new Array(text.length).fill(-1);
    this.root = new Node(0);
    this.nodes.push(this.root);

    for (let i = 0; i < text.length; i++) {
      this._insertSuffix(i);
    }
    this._prepareLca();
  }

  _newNode() {
    const node = new Node(this.nodes.length);
    this.nodes.push(node);
    return node;
  }

  // Вставка суффикса text[suf..]: как в боре, но с разбиением рёбер.
  _insertSuffix(suf) {
    const text = this.text;
    const n = text.length;
    let node = this.root;
    let i = suf;

    while (i < n) {
      const c = text[i];
      const edge = node.children.get(c);

      if (!edge) {
        // Ветвления нет - как в обычном боре: новый лист.
        const leaf = this._newNode();
        leaf.suffixIndex = suf;
        this.leafAt[suf] = leaf.id;
        node.children.set(c, { start: i, end: n - 1, target: leaf });
        return;
      }

      // Спускаемся по метке ребра, пока символы совпадают.
      let j = edge.start;
      while (j <= edge.end && text[j] === text[i]) {
        j++;
        i++;
      }

      if (j > edge.end) {
        node = edge.target; // ребро пройдено целиком - спускаемся ниже
      } else {
        // Расхождение посередине ребра: разбиваем его внутренним узлом.
        const split = this._newNode();
        const oldTarget = edge.target;
        const oldEnd = edge.end;
        edge.end = j - 1; // верхняя часть ребра остаётся как была
        edge.target = split;
        split.children.set(text[j], { start: j, end: oldEnd, target: oldTarget });

        const leaf = this._newNode(); // остаток вставляемого суффикса
        leaf.suffixIndex = suf;
        this.leafAt[suf] = leaf.id;
        split.children.set(text[i], { start: i, end: n - 1, target: leaf });
        return;
      }
    }
  }

  // Обход в глубину: родители, глубины (в рёбрах) и строковые глубины узлов.
  _prepareLca() {
    const count = this.nodes.length;
    const parent = new Array(count);
    const level = new Array(count);

    const stack = [this.root];
    parent[0] = 0; // корень - сам себе родитель
    level[0] = 0;

    while (stack.length) {
      const v = stack.pop();
      for (const edge of v.children.values()) {
        const u = edge.target;
        parent[u.id] = v.id;
        level[u.id] = level[v.id] + 1;
        u.strDepth = v.strDepth + edge.end - edge.start + 1;
        stack.push(u);
      }
    }

    const log = Math.ceil(Math.log2(count)) + 1;
    const up = [parent];
    for (let k = 1; k < log; k++) {
      up.push(up[k - 1].map((p) => up[k - 1][p]));
    }

    this._level = level;
    this._up = up;
  }

  // Наименьший общий предок узлов u и v (по их id), O(log n).
  lca(u, v) {
    const up = this._up;
    const level = this._level;
    if (level[u] < level[v]) {
      [u, v] = [v, u];
    }
    let diff = level[u] - level[v];
    for (let k = up.length - 1; k >= 0; k--) {
      if ((diff >> k) & 1) u = up[k][u];
    }
    if (u === v) return u;
    for (let k = up.length - 1; k >= 0; k--) {
      if (up[k][u] !== up[k][v]) {
        u = up[k][u];
        v = up[k][v];
      }
    }
    return up[0][u];
  }

  /**
   * LCE(a, b) - длина наибольшего общего префикса суффиксов,
   * начинающихся в позициях a и b текста. Это строковая глубина
   * их LCA. O(log n).
   */
  lce(a, b) {
    const ancestor = this.lca(this.leafAt[a], this.leafAt[b]);
    return this.nodes[ancestor].strDepth;
  }
}

module.exports = { SuffixTree, Node };
