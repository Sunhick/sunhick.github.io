/*
 * A small terminal-style interface for browsing the blog.
 *
 * Everything runs in the browser from data that Jekyll embeds in the page
 * (#term-data). Categories become folders, posts become files. All output is
 * added with textContent, never innerHTML, so content can't inject markup.
 */
(function () {
  'use strict';

  const dataEl = document.getElementById('term-data');
  if (!dataEl) return;
  const data = JSON.parse(dataEl.textContent);

  const $ = (id) => document.getElementById(id);
  const term = $('term');
  const screen = $('screen');
  const out = $('scrollback');
  const form = $('command-form');
  const input = $('command');
  const promptEl = $('prompt');
  const titleEl = $('window-title');
  const ghostPre = document.querySelector('.ghost-pre');
  const ghostRest = document.querySelector('.ghost-rest');
  const tabHint = $('tab-hint');

  // Show the terminal and hide the plain fallback.
  term.hidden = false;
  $('plain').hidden = true;

  /* ---------- Filesystem built from site data ---------- */

  const slugify = (s) => String(s).toLowerCase()
    .replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const lastSegment = (url) => url.split('/').filter(Boolean).pop() || url;

  const dirs = new Map(); // folder name -> { label, entries }
  for (const p of data.posts || []) {
    const label = p.category || 'Uncategorized';
    const name = slugify(label);
    if (!dirs.has(name)) dirs.set(name, { label, entries: [] });
    dirs.get(name).entries.push({
      kind: 'post', name: lastSegment(p.url), title: p.title, url: p.url,
      date: p.date, tags: p.tags || [], label,
    });
  }
  const dirNames = [...dirs.keys()].sort();
  const projects = (data.projects || []).map((pr) => ({
    kind: 'project', name: slugify(pr.title), title: pr.title, url: pr.url,
    desc: pr.description || '', tags: pr.tags || [],
  }));
  if (projects.length) {
    dirs.set('projects', { label: 'Projects', entries: projects });
    dirNames.push('projects');
  }
  const rootFiles = (data.pages || []).map((pg) => ({
    kind: 'page', name: pg.name + '.md', title: pg.title, url: pg.url,
  }));
  const allPosts = [...dirs.values()].flatMap((d) => d.entries).filter((e) => e.kind === 'post');
  const allFiles = () => rootFiles.concat(...[...dirs.values()].map((d) => d.entries));

  let cwd = null; // null means ~, otherwise a folder name

  // Resolve a folder argument like "keyboards", "~/keyboards/", "..", "../security".
  function resolveDir(arg) {
    if (arg == null || arg === '' || arg === '~' || arg === '/' || arg === '~/') return { ok: true, dir: null };
    let a = arg.replace(/^~\//, '').replace(/^\//, '').replace(/\/+$/, '');
    if (a === '..') return { ok: true, dir: null };
    if (a === '.') return { ok: true, dir: cwd };
    if (a.startsWith('../')) a = a.slice(3);
    if (a.startsWith('./')) return resolveDir(a.slice(2));
    // Folders only exist at ~, so a folder name works from anywhere.
    return dirs.has(a) ? { ok: true, dir: a } : { ok: false };
  }

  const entriesIn = (dir) => (dir === null ? rootFiles : dirs.get(dir).entries);
  const pathOf = (dir) => (dir === null ? '~' : '~/' + dir);

  // Find files for open/cat. Exact name in a folder first, then a fuzzy match.
  function findFiles(arg) {
    if (!arg) return [];
    const fromHome = /^~\//.test(arg);
    let a = arg.replace(/^~\//, '').replace(/\/+$/, '');
    let dir = fromHome ? null : cwd;
    let name = a;
    const slash = a.lastIndexOf('/');
    if (slash !== -1) {
      const d = resolveDir(a.slice(0, slash) || '~');
      if (!d.ok) return [];
      dir = d.dir;
      name = a.slice(slash + 1);
    }
    const exact = entriesIn(dir).find((e) => e.name === name || e.name === name + '.md');
    if (exact) return [exact];
    const q = name.toLowerCase();
    if (!q) return [];
    let hits = allFiles().filter((e) => e.name.startsWith(q));
    if (!hits.length) hits = allFiles().filter((e) => e.name.includes(q) || e.title.toLowerCase().includes(q));
    return hits;
  }

  // Path to a file, relative to the current folder, for clickable commands.
  function relPath(entry) {
    if (entry.kind === 'page') return cwd === null ? entry.name : '~/' + entry.name;
    const folder = entry.kind === 'project' ? 'projects' : slugify(entry.label);
    return folder === cwd ? entry.name : folder + '/' + entry.name;
  }

  /* ---------- Output helpers ---------- */

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  // Only allow links to this site, https, or mailto.
  function safeHref(href) {
    if (typeof href !== 'string') return null;
    if (href.startsWith('/') && !href.startsWith('//')) return href;
    if (/^https:\/\//i.test(href) || /^mailto:/i.test(href)) return href;
    return null;
  }

  // A part is a string, or { text, cls, cmd } for a clickable command, or { text, cls, href } for a link.
  function render(part) {
    if (part == null) return document.createTextNode('');
    if (typeof part === 'string') return document.createTextNode(part);
    if (part instanceof Node) return part;
    if (part.cmd) {
      const b = el('button', 'cmd ' + (part.cls || ''), part.text);
      b.type = 'button';
      b.addEventListener('click', () => run(part.cmd));
      return b;
    }
    const href = safeHref(part.href);
    if (href) {
      const a = el('a', part.cls || '', part.text);
      a.href = href;
      if (!href.startsWith('/')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      return a;
    }
    return el('span', part.cls || '', part.text);
  }

  function line(...parts) {
    const div = el('div', 'line');
    parts.forEach((p) => div.append(render(p)));
    out.append(div);
    return div;
  }

  function block(cls, children) {
    const div = el('div', cls);
    children.forEach((c) => div.append(c));
    out.append(div);
    return div;
  }

  function row(left, right, cls) {
    const div = el('div', 'row' + (cls ? ' ' + cls : ''));
    const l = el('span');
    const r = el('span');
    [].concat(left).forEach((p) => l.append(render(p)));
    [].concat(right).forEach((p) => r.append(render(p)));
    div.append(l, r);
    return div;
  }

  const gap = () => out.append(el('div', 'gap'));
  const err = (msg) => line({ text: msg, cls: 'err' });
  const scrollDown = () => { screen.scrollTop = screen.scrollHeight; };

  function promptParts() {
    return [
      { text: data.user + '@' + data.host, cls: 'p-user' },
      ':',
      { text: pathOf(cwd), cls: 'p-path' },
      '$ ',
    ];
  }

  function updatePrompt() {
    promptEl.replaceChildren(...promptParts().map(render));
    titleEl.textContent = data.user + '@' + data.host + ': ' + pathOf(cwd);
  }

  /* ---------- Commands ---------- */

  const fileLink = (entry) => ({
    text: entry.name,
    cls: entry.kind === 'page' ? 'file' : '',
    cmd: 'cat ' + relPath(entry),
  });

  function listPosts(entries) {
    entries.forEach((e) => {
      out.append(row({ text: e.date || '', cls: 'dim' }, [fileLink(e), '  ', { text: e.title, cls: 'dim' }], 'wide'));
    });
  }

  function openEntry(entry) {
    const href = safeHref(entry.url);
    if (!href) return err('open: bad link for ' + entry.name);
    if (href.startsWith('/')) {
      line({ text: 'Opening ', cls: 'dim' }, entry.title, { text: ' …', cls: 'dim' });
      window.location.assign(href);
    } else {
      line({ text: 'Opening in a new tab: ', cls: 'dim' }, { text: entry.title, href });
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }

  function chooseOne(cmdName, arg, hits) {
    if (!hits.length) { err(cmdName + ': no such file: ' + arg); return null; }
    if (hits.length === 1) return hits[0];
    line({ text: hits.length + ' matches. Did you mean:', cls: 'warn' });
    hits.slice(0, 12).forEach((h) => out.append(row({ text: cmdName, cls: 'dim' }, [{ text: relPath(h), cmd: cmdName + ' ' + relPath(h) }, '  ', { text: h.title, cls: 'dim' }])));
    return null;
  }

  const commands = {
    help: {
      desc: 'list commands', args: 'cmd',
      run(args) {
        if (args[0] && commands[args[0]]) {
          const c = commands[args[0]];
          return line({ text: args[0], cls: 'accent' }, ' ', { text: c.usage || '', cls: 'dim' }, ' — ', c.desc);
        }
        line('Commands:');
        Object.keys(commands).filter((n) => !commands[n].hidden).forEach((n) => {
          const c = commands[n];
          // Commands that need an argument show their usage when clicked instead of erroring.
          const needsArg = (c.usage || '').startsWith('<');
          out.append(row({ text: n, cmd: needsArg ? 'help ' + n : n, cls: 'accent' }, [c.desc, c.usage ? ' ' : '', { text: c.usage || '', cls: 'dim' }]));
        });
        gap();
        line({ text: 'Tab completes · ↑/↓ history · → accepts a suggestion · Ctrl+L clears', cls: 'dim' });
      },
    },
    ls: {
      desc: 'list a folder', usage: '[folder]', args: 'dir',
      run(args) {
        const d = resolveDir(args[0] != null ? args[0] : '.');
        if (!d.ok) {
          const f = findFiles(args[0]);
          if (f.length === 1) return line(fileLink(f[0]));
          return err('ls: no such folder: ' + args[0]);
        }
        if (d.dir === null) {
          const grid = el('div', 'grid');
          dirNames.forEach((n) => grid.append(render({ text: n + '/', cls: 'dir', cmd: 'cd ' + n })));
          rootFiles.forEach((f) => grid.append(render(fileLink(f))));
          out.append(grid);
          return;
        }
        const folder = dirs.get(d.dir);
        if (d.dir === 'projects') {
          folder.entries.forEach((e) => out.append(row(fileLink(e), { text: e.desc, cls: 'dim' }, 'wide')));
          return;
        }
        listPosts(folder.entries);
      },
    },
    cd: {
      desc: 'change folder', usage: '[folder]', args: 'dir',
      run(args) {
        const d = resolveDir(args[0]);
        if (!d.ok) {
          if (findFiles(args[0]).length) return err('cd: not a folder: ' + args[0] + ' (try open)');
          return err('cd: no such folder: ' + args[0]);
        }
        cwd = d.dir;
        updatePrompt();
        try { window.history.replaceState(null, '', cwd ? '#/' + cwd : window.location.pathname); } catch (e) { /* ignore */ }
      },
    },
    pwd: { desc: 'show the current folder', run() { line(pathOf(cwd)); } },
    cat: {
      desc: 'show details for a post or page', usage: '<file>', args: 'file',
      run(args) {
        if (!args[0]) return err('cat: missing file. Try ls.');
        const e = chooseOne('cat', args[0], findFiles(args[0]));
        if (!e) return;
        line({ text: e.title, cls: 'bold' });
        if (e.kind === 'post') line({ text: e.date + ' · ' + e.label, cls: 'dim' });
        if (e.desc) line(e.desc);
        if (e.tags && e.tags.length) line({ text: e.tags.map((x) => '#' + x).join(' '), cls: 'dim' });
        line({ text: 'open', cmd: 'open ' + relPath(e), cls: 'accent' }, '  ', { text: e.url, href: e.url, cls: 'dim' });
      },
    },
    open: {
      desc: 'open a post, page, or project', usage: '<file>', args: 'file',
      run(args) {
        if (!args[0]) return err('open: missing file. Try ls.');
        const d = resolveDir(args[0]);
        if (d.ok && d.dir !== cwd && args[0] !== '.') return commands.cd.run(args), commands.ls.run([]);
        const e = chooseOne('open', args[0], findFiles(args[0]));
        if (e) openEntry(e);
      },
    },
    recent: {
      desc: 'latest posts', usage: '[n]',
      run(args) {
        const n = Math.max(1, Math.min(50, parseInt(args[0], 10) || 5));
        listPosts(allPosts.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, n));
      },
    },
    find: {
      desc: 'search post titles and tags', usage: '<words>',
      run(args) {
        if (!args.length) return err('find: what should I look for?');
        const words = args.map((w) => w.toLowerCase());
        const hits = allFiles().filter((e) => {
          const hay = (e.title + ' ' + e.name + ' ' + (e.tags || []).join(' ')).toLowerCase();
          return words.every((w) => hay.includes(w));
        });
        if (!hits.length) return line({ text: 'No matches.', cls: 'dim' });
        hits.forEach((h) => out.append(row({ text: h.date || h.kind, cls: 'dim' }, [{ text: relPath(h), cmd: 'cat ' + relPath(h) }, '  ', { text: h.title, cls: 'dim' }], 'wide')));
      },
    },
    tree: {
      desc: 'show every folder and file',
      run() {
        line({ text: '~', cls: 'dir' });
        dirNames.forEach((n, i) => {
          const lastDir = i === dirNames.length - 1 && !rootFiles.length;
          line(lastDir ? '└── ' : '├── ', { text: n + '/', cls: 'dir', cmd: 'cd ' + n });
          const entries = dirs.get(n).entries;
          entries.forEach((e, j) => line(lastDir ? '    ' : '│   ', j === entries.length - 1 ? '└── ' : '├── ', fileLink(e)));
        });
        rootFiles.forEach((f, i) => line(i === rootFiles.length - 1 ? '└── ' : '├── ', fileLink(f)));
      },
    },
    whoami: {
      desc: 'about me',
      run() {
        (data.bio || []).forEach((b) => line(b));
        const about = rootFiles.find((f) => f.name === 'about.md');
        if (about) { gap(); line({ text: 'More: ', cls: 'dim' }, { text: 'open about.md', cmd: 'open ~/about.md' }); }
      },
    },
    neofetch: {
      desc: 'system info, but about me',
      run() {
        const art = el('pre', '', [
          ' ███████ ███    ███',
          ' ██      ████  ████',
          ' ███████ ██ ████ ██',
          '      ██ ██  ██  ██',
          ' ███████ ██      ██',
        ].join('\n'));
        art.setAttribute('aria-hidden', 'true');
        const info = el('div', 'info');
        const head = el('div', 'line');
        head.append(render({ text: data.user + '@' + data.host, cls: 'accent bold' }));
        info.append(head, el('div', 'line dim', '─'.repeat(24)));
        const pairs = (data.fetch || []).concat([
          ['Posts', allPosts.length + ' across ' + (dirNames.length - (projects.length ? 1 : 0)) + ' topics'],
        ]);
        pairs.forEach(([k, v]) => {
          const l = el('div', 'line');
          l.append(el('span', 'k', k), document.createTextNode(': ' + v));
          info.append(l);
        });
        block('fetch', [art, info]);
      },
    },
    contact: {
      desc: 'ways to reach me',
      run() {
        if (data.email) out.append(row({ text: 'email', cls: 'dim' }, { text: data.email, href: 'mailto:' + data.email }));
        (data.links || []).forEach((u) => {
          const label = u.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '');
          out.append(row({ text: label.split('.')[0], cls: 'dim' }, { text: label, href: u }));
        });
      },
    },
    gpg: {
      desc: 'my public key fingerprint',
      run() {
        if (!data.gpg) return line({ text: 'No key listed.', cls: 'dim' });
        line({ text: 'Fingerprint: ', cls: 'dim' }, { text: data.gpg, cls: 'accent' });
      },
    },
    history: {
      desc: 'commands you ran',
      run() { cmdHistory.forEach((h, i) => out.append(row({ text: String(i + 1), cls: 'dim' }, { text: h, cmd: h }))); },
    },
    clear: { desc: 'clear the screen', run() { out.replaceChildren(); } },
    date: { desc: 'print the date', run() { line(new Date().toString()); } },
    echo: { desc: 'print text', usage: '<text>', run(args) { line(args.join(' ')); } },
    exit: {
      desc: 'go back to the normal site',
      run() { line({ text: 'logout', cls: 'dim' }); window.location.assign(data.home || '/'); },
    },

    // Aliases and jokes, not shown in help.
    ll: { hidden: true, args: 'dir', run: (a) => commands.ls.run(a) },
    dir: { hidden: true, args: 'dir', run: (a) => commands.ls.run(a) },
    less: { hidden: true, args: 'file', run: (a) => commands.cat.run(a) },
    man: { hidden: true, args: 'cmd', run: (a) => commands.help.run(a) },
    plain: { hidden: true, run: () => commands.exit.run([]) },
    logout: { hidden: true, run: () => commands.exit.run([]) },
    sudo: { hidden: true, run: () => err('sunil is not in the sudoers file. This incident will be reported.') },
    vim: { hidden: true, run: () => line('Nice try. This is an ', { text: 'Emacs', cls: 'accent' }, ' household. ', { text: '(M-x butterfly)', cls: 'dim' }) },
    emacs: { hidden: true, run: () => line({ text: 'Already running. It always is.', cls: 'dim' }) },
  };

  /* ---------- Running commands ---------- */

  const cmdHistory = [];
  let histIdx = 0;

  function echoCommand(text) {
    line(...promptParts(), text);
  }

  function run(raw) {
    const text = String(raw).trim();
    echoCommand(text);
    if (text) {
      if (cmdHistory[cmdHistory.length - 1] !== text) cmdHistory.push(text);
      const [name, ...args] = text.split(/\s+/);
      const c = commands[name.toLowerCase()];
      if (c) c.run(args);
      else line({ text: 'command not found: ' + name, cls: 'err' }, '. Try ', { text: 'help', cmd: 'help' }, '.');
    }
    histIdx = cmdHistory.length;
    input.value = '';
    updateGhost();
    scrollDown();
    input.focus({ preventScroll: true });
  }

  /* ---------- Completion ---------- */

  const visibleCommands = () => Object.keys(commands).filter((n) => !commands[n].hidden);

  function pathCandidates(kind, partial) {
    const names = (dir) => {
      if (dir === null) {
        const ds = dirNames.map((n) => n + '/');
        return kind === 'dir' ? ds : ds.concat(rootFiles.map((f) => f.name));
      }
      return kind === 'dir' ? [] : entriesIn(dir).map((e) => e.name);
    };
    const slash = partial.lastIndexOf('/');
    if (slash !== -1) {
      const base = partial.slice(0, slash + 1);
      const d = resolveDir(base);
      return d.ok ? names(d.dir).map((n) => base + n) : [];
    }
    return names(cwd).concat(cwd !== null ? ['../'] : []);
  }

  // Returns { parts, partial, options } for the text currently typed.
  function completions(value) {
    const parts = value.split(' ');
    const partial = parts[parts.length - 1];
    let options;
    if (parts.length === 1) {
      options = visibleCommands();
    } else {
      const c = commands[parts[0].toLowerCase()];
      if (!c || !c.args) options = [];
      else if (c.args === 'cmd') options = visibleCommands();
      else options = pathCandidates(c.args, partial);
    }
    return { parts, partial, options: options.filter((o) => o.startsWith(partial)).sort() };
  }

  function commonPrefix(list) {
    let p = list[0] || '';
    for (const s of list) while (!s.startsWith(p)) p = p.slice(0, -1);
    return p;
  }

  let suggestion = '';

  function updateGhost() {
    suggestion = '';
    const v = input.value;
    if (v && !v.endsWith(' ')) {
      const { partial, options } = completions(v);
      if (partial && options.length && options[0] !== partial) suggestion = options[0].slice(partial.length);
    }
    const overflow = input.scrollWidth > input.clientWidth;
    ghostPre.textContent = overflow ? '' : v;
    ghostRest.textContent = overflow ? '' : suggestion;
    tabHint.hidden = !suggestion || overflow;
  }

  function complete() {
    const { parts, partial, options } = completions(input.value);
    if (!options.length) return;
    if (options.length === 1) {
      const done = options[0];
      parts[parts.length - 1] = done + (done.endsWith('/') ? '' : ' ');
      input.value = parts.join(' ');
    } else {
      const pre = commonPrefix(options);
      if (pre.length > partial.length) {
        parts[parts.length - 1] = pre;
        input.value = parts.join(' ');
      } else {
        echoCommand(input.value);
        const grid = el('div', 'grid');
        options.forEach((o) => grid.append(render({ text: o, cls: o.endsWith('/') ? 'dir' : '' })));
        out.append(grid);
        scrollDown();
      }
    }
    updateGhost();
  }

  /* ---------- Events ---------- */

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    run(input.value);
  });

  input.addEventListener('input', updateGhost);

  input.addEventListener('keydown', (e) => {
    const atEnd = input.selectionStart === input.value.length;
    if (e.key === 'Tab' && !e.shiftKey && input.value) {
      // Only capture Tab when there's text, so keyboard users can still tab out of an empty prompt.
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowRight' && atEnd && suggestion) {
      e.preventDefault();
      input.value += suggestion;
      updateGhost();
    } else if (e.key === 'ArrowUp') {
      if (!cmdHistory.length) return;
      e.preventDefault();
      histIdx = Math.max(0, histIdx - 1);
      input.value = cmdHistory[histIdx];
      updateGhost();
    } else if (e.key === 'ArrowDown') {
      if (!cmdHistory.length) return;
      e.preventDefault();
      histIdx = Math.min(cmdHistory.length, histIdx + 1);
      input.value = cmdHistory[histIdx] || '';
      updateGhost();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      out.replaceChildren();
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c' && input.selectionStart === input.selectionEnd) {
      e.preventDefault();
      echoCommand(input.value + '^C');
      input.value = '';
      updateGhost();
      scrollDown();
    } else if (e.key === 'Escape') {
      input.value = '';
      updateGhost();
    }
  });

  // Clicking empty space in the window focuses the prompt, unless you're selecting text.
  term.addEventListener('mouseup', (e) => {
    if (e.target.closest('a, button, input')) return;
    if (window.getSelection().toString()) return;
    input.focus({ preventScroll: true });
  });

  /* ---------- Start ---------- */

  updatePrompt();
  line({ text: 'Last login: ' + new Date().toDateString() + ' on ttys000', cls: 'dim' });
  line('Welcome to ', { text: data.user + '@' + data.host, cls: 'accent' }, ', the blog as a shell.');
  line('Type ', { text: 'help', cmd: 'help' }, ' or try ', { text: 'ls', cmd: 'ls' }, '. Prefer normal pages? ', { text: 'plain view', href: data.home || '/' }, '.');

  // Suggested commands, shown once in the welcome message. They scroll away like any other output.
  if (data.chips && data.chips.length) {
    const chips = el('div', 'chips');
    chips.setAttribute('aria-label', 'Suggested commands');
    data.chips.forEach((c) => {
      const b = el('button', '', c);
      b.type = 'button';
      b.addEventListener('click', () => run(c));
      chips.append(b);
    });
    out.append(chips);
  }
  gap();

  // Deep link: /terminal/#/keyboards opens that folder.
  const m = window.location.hash.match(/^#\/([a-z0-9-]+)\/?$/);
  if (m && dirs.has(m[1])) { run('cd ' + m[1]); run('ls'); }

  input.focus({ preventScroll: true });
})();
