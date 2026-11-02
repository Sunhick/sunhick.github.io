---
layout: page
icon: fas fa-briefcase
order: 2
title: Portfolio
---

A few things I've built outside of work, from hardware to security experiments and everyday tools.

<style>
  /* Two plain text columns split by a thin vertical rule; one column on narrow screens. */
  .projects { columns: 2; column-gap: 3rem; column-rule: 1px solid var(--main-border-color, #ccc); }
  .projects .project { break-inside: avoid; margin-bottom: 1.5rem; }
  .projects .project p { margin: 0 0 0.25rem; }
  @media (max-width: 768px) { .projects { columns: 1; } }
</style>

<div class="projects">
{% for project in site.data.projects %}
  {%- assign main_link = project.url | default: project.writeup -%}
  <div class="project">
    <p><strong><a href="{{ main_link | relative_url }}">{{ project.title | escape }}</a></strong></p>
    <p>{{ project.description | escape }}</p>
    <p>
      {%- if project.url %}<a href="{{ project.url }}">Source</a>{% endif -%}
      {%- if project.url and project.writeup %} · {% endif -%}
      {%- if project.writeup %}<a href="{{ project.writeup | relative_url }}">Write-up</a>{% endif -%}
    </p>
  </div>
{% endfor %}
</div>

More experiments and older projects are on [GitHub](https://github.com/Sunhick?tab=repositories).
