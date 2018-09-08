const keyword = [
  // EcmaScript
  'break',
  'if',
  'else',
  'import',
  'as',
  'from',
  'export',
  'return',
  'switch',
  'case',
  'default',
  'const',
  'let',
  'for',
  'continue',
  'do',
  'while',
  'function',

  // s-expression
  'global',
  'module',
  'type',
  'lambda',
];
const punctuator = [
  '+',
  '++',
  '-',
  '--',
  '>>',
  '>>>',
  '<<',
  '=',
  '==',
  '+=',
  '-=',
  '=>',
  '<=',
  '>=',
  '!=',
  '%',
  '*',
  '/',
  '^',
  '&',
  '~',
  '|',
  '!',
  '**',
  ':',
  '(',
  ')',
  '.',
  '{',
  '}',
  ',',
  '[',
  ']',
  ';',
  '>',
  '<',
  '?',
  '||',
  '&&',
  '{',
  '}',
  '...',
];

const type = ['i32', 'i64', 'f32', 'f64', 'bool'];

export const tokens = {
  whitespace: /[ \t]+/,
  comment: [{ match: /\/\/.*?$/ }],
  number: [
    { match: /0[xX][0-9a-fA-F]+/ },
    { match: /0[oO][0-9]+/ },
    { match: /0[bB][01]+/ },
    { match: /(?:[0-9]+(?:\.[0-9]+)?e-?[0-9]+)/ },
    { match: /[0-9]+\.[0-9]+|[0-9]+/ },
  ],
  string: [
    { match: /"(?:\\["\\rn]|[^"\\\n])*?"/, value: x => x.slice(1, -1) },
    { match: /'(?:\\['\\bfnrtv0]|[^'\\\n])*?'/, value: x => x.slice(1, -1) },
  ],
  identifier: {
    match: /[\w]+/,
    keywords: { keyword, type },
  },
  punctuator,
  newline: { match: /\n/, lineBreaks: true },
};
