/**
 * rehype-fix-style
 * Converts style="css-string" attributes to React-compatible style objects.
 * Required because GitBook docs use inline HTML with string style attrs,
 * which React SSR rejects (expects objects).
 */
const {visit} = require('unist-util-visit');

function rehypeFixStyle() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.properties?.style && typeof node.properties.style === 'string') {
        const styleStr = node.properties.style;
        const styleObj = {};
        styleStr.split(';').filter(Boolean).forEach((rule) => {
          const colonIdx = rule.indexOf(':');
          if (colonIdx > 0) {
            const prop = rule.slice(0, colonIdx).trim();
            const val = rule.slice(colonIdx + 1).trim();
            // Convert kebab-case to camelCase (e.g. background-color → backgroundColor)
            const camelProp = prop.replace(/-([a-z])/g, (_, l) => l.toUpperCase());
            styleObj[camelProp] = val;
          }
        });
        node.properties.style = styleObj;
      }
    });
  };
}

module.exports = rehypeFixStyle;
