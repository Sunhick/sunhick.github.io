---
layout: page
icon: fas fa-archive
order: 6
title: Archives
---

A timeline of all posts on this site, grouped by year.

{% assign posts_by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}

{% for year in posts_by_year %}

## {{ year.name }}

<ul class="list-unstyled">
{% for post in year.items %}
<li style="margin-bottom: 1rem; padding-left: 1rem; border-left: 2px solid var(--link-color, #007bff);">
  <span style="font-size: 0.85em; color: var(--text-muted-color, #868e96);">
    {{ post.date | date: "%B %d" }}
  </span>
  <br>
  <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
  <br>
  <span style="font-size: 0.8em; color: var(--text-muted-color, #868e96);">
    {% for cat in post.categories %}
      <span>{{ cat }}</span>{% unless forloop.last %} · {% endunless %}
    {% endfor %}
    {% if post.tags.size > 0 %}
      — {% for tag in post.tags %}<code style="font-size: 0.85em;">{{ tag }}</code> {% endfor %}
    {% endif %}
  </span>
</li>
{% endfor %}
</ul>

{% endfor %}
