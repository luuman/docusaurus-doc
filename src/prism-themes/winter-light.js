/**
 * Winter is Coming — Light
 * Based on VS Code "Winter is Coming" by John Papa
 * Background: #FBFCFD | Foreground: #112B3C
 */
const theme = {
  plain: {
    color: '#112B3C',
    backgroundColor: '#F0F4F8',
  },
  styles: [
    {
      types: ['comment', 'prolog', 'doctype', 'cdata'],
      style: { color: '#8899A6', fontStyle: 'italic' },
    },
    {
      types: ['punctuation'],
      style: { color: '#2C4356' },
    },
    {
      types: ['property', 'tag', 'boolean', 'number', 'constant', 'symbol'],
      style: { color: '#D3423E' },
    },
    {
      types: ['selector', 'attr-name', 'char', 'builtin', 'inserted'],
      style: { color: '#2AA298' },
    },
    {
      types: ['string'],
      style: { color: '#A44185' },
    },
    {
      types: ['operator', 'entity', 'url'],
      style: { color: '#2AA298' },
    },
    {
      types: ['atrule', 'attr-value', 'keyword'],
      style: { color: '#00009F' },
    },
    {
      types: ['function', 'class-name'],
      style: { color: '#4876D6' },
    },
    {
      types: ['regex', 'important', 'variable'],
      style: { color: '#112B3C' },
    },
    {
      types: ['deleted'],
      style: { color: '#D3423E' },
    },
    {
      types: ['namespace'],
      style: { opacity: 0.7 },
    },
  ],
};

module.exports = theme;
