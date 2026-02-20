/**
 * Winter is Coming — Dark Blue
 * Based on VS Code "Winter is Coming" by John Papa
 * Background: #011627 | Foreground: #D6DEEB
 */
const theme = {
  plain: {
    color: '#D6DEEB',
    backgroundColor: '#011627',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: '#637777', fontStyle: 'italic' },
    },
    {
      types: ['punctuation'],
      style: { color: '#C792EA' },
    },
    {
      types: ['property', 'tag', 'boolean', 'number', 'constant', 'symbol'],
      style: { color: '#F78C6C' },
    },
    {
      types: ['selector', 'attr-name', 'char', 'builtin', 'inserted'],
      style: { color: '#ADDB67' },
    },
    {
      types: ['string'],
      style: { color: '#ECC48D' },
    },
    {
      types: ['operator', 'entity', 'url'],
      style: { color: '#7FDBCA' },
    },
    {
      types: ['atrule', 'attr-value', 'keyword'],
      style: { color: '#C792EA' },
    },
    {
      types: ['function', 'class-name'],
      style: { color: '#82AAFF' },
    },
    {
      types: ['regex', 'important', 'variable'],
      style: { color: '#D6DEEB' },
    },
    {
      types: ['deleted'],
      style: { color: '#EF5350' },
    },
    {
      types: ['namespace'],
      style: { opacity: 0.7 },
    },
  ],
};

module.exports = theme;
