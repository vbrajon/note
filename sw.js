self.addEventListener('install', e => e.waitUntil(
  caches.open('v0')
  .then(cache => cache.addAll([
    '/',
    'p.png',
    'lib/app.css',
    'lib/app.js',
    'lib/md.css',
    'lib/vue-codemirror.js',
    'lib/font-blockway.css',
    'lib/font-montserrat.css',
    'https://rawcss.com/raw.css',
    // Prettier
    'https://unpkg.com/prettier@1.15.1/standalone.js',
    'https://unpkg.com/prettier@1.15.1/parser-html.js',
    'https://unpkg.com/prettier@1.15.1/parser-angular.js',
    'https://unpkg.com/prettier@1.15.1/parser-babylon.js',
    'https://unpkg.com/prettier@1.15.1/parser-postcss.js',
    'https://unpkg.com/prettier@1.15.1/parser-markdown.js',
    'https://unpkg.com/prettier@1.15.1/parser-yaml.js',
    // CodeMirror
    'https://unpkg.com/codemirror@5.41.0/lib/codemirror.css',
    'https://unpkg.com/codemirror@5.41.0/lib/codemirror.js',
    'https://unpkg.com/codemirror@5.41.0/theme/monokai.css',
    'https://unpkg.com/codemirror@5.41.0/keymap/sublime.js',
    'https://unpkg.com/codemirror@5.41.0/mode/htmlmixed/htmlmixed.js',
    'https://unpkg.com/codemirror@5.41.0/mode/xml/xml.js',
    'https://unpkg.com/codemirror@5.41.0/mode/javascript/javascript.js',
    'https://unpkg.com/codemirror@5.41.0/mode/css/css.js',
    'https://unpkg.com/codemirror@5.41.0/mode/markdown/markdown.js',
    'https://unpkg.com/codemirror@5.41.0/addon/selection/active-line.js',
    'https://unpkg.com/codemirror@5.41.0/addon/search/search.js',
    'https://unpkg.com/codemirror@5.41.0/addon/search/searchcursor.js',
    // Git
    'https://unpkg.com/@isomorphic-git/lightning-fs@3.0.3/dist/lightning-fs.min.js',
    'https://isomorphic-git.org/js/pify.js',
    'https://unpkg.com/isomorphic-git@0.51.6/dist/bundle.umd.min.js',
    // Vue
    'https://unpkg.com/vue@2.5.17/dist/vue.min.js',
    'https://unpkg.com/marked@0.5.1/marked.min.js',
  ]))
))

self.addEventListener('fetch', e => e.respondWith(
  fetch(e.request).catch(() => caches.match(e.request))
))
