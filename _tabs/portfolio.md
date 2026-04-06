---
layout: page
icon: fas fa-briefcase
order: 2
title: Portfolio
---

Showcasing projects and technical skills across device management, system architecture, authentication systems, and open-source contributions.

## Resume

[Download PDF Resume](/assets/resume/Sunil_Murthy_Resume.pdf){: .btn .btn-primary }

## Featured Projects

{% for project in site.data.projects %}
{% if project.featured %}

### {{ project.title }}

{{ project.description }}

{% for tech in project.technologies %}`{{ tech }}` {% endfor %}

[Source]({{ project.url }}){: .btn }
{% if project.demo_url and project.demo_url != "" %}[Demo]({{ project.demo_url }}){: .btn }{% endif %}

---

{% endif %}
{% endfor %}
