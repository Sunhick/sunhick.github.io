---
layout: page
title: Portfolio
permalink: /portfolio/
---

# My Projects

Work across device management, system architecture, authentication systems, and open-source contributions.

## Featured Projects

{% for project in site.data.projects %}
  {% if project.featured %}
**[{{ project.title }}]({{ project.url }})**
{{ project.description }}

  {% endif %}
{% endfor %}

## All Projects

<div class="projects-text-columns" markdown="1">
{% assign categories = site.data.projects | map: 'category' | uniq | sort %}
{% for category in categories %}
### {{ category }}
{% for project in site.data.projects %}
  {% if project.category == category %}
- **[{{ project.title }}]({{ project.url }})** - {{ project.description }}
  {% endif %}
{% endfor %}
{% endfor %}
</div>
