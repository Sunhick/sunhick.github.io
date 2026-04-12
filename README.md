# sunhick.github.io

Personal portfolio and blog built with Jekyll and the Chirpy theme, deployed on GitHub Pages.

## Setup

```bash
bundle install
bundle exec jekyll serve --livereload
```

Open `http://localhost:4000`.

## Writing Posts

Add markdown files to `_posts/` with the naming convention `YYYY-MM-DD-title.md`:

```yaml
---
title: "Post Title"
date: 2026-04-11 12:00:00 -0700
categories: [Category]
tags: [tag1, tag2]
---

Content here.
```

## Topics

- Security — YubiKey 5C, GPG, hardware key management
- Linux — Kernel, Xorg, GNOME, boot-to-desktop integration
- Formal Methods — TLA+, PlusCal, model checking

## Tabs

About, Portfolio, Skills, Contact, Resume, Archives — configured in `_tabs/`.

## Deployment

Push to `main`. GitHub Pages builds and deploys automatically.

## License

[MIT](LICENSE)
