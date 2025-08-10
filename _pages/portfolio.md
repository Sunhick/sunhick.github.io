---
layout: page
title: Portfolio
permalink: /portfolio/
---

## My Projects

Here's a showcase of my work across different domains including device management, system architecture, authentication systems, and contributions to open-source projects. Each project demonstrates my expertise in various programming languages and technologies.

### Featured Projects

<div class="projects-grid">
  {% for project in site.data.projects %}
    {% if project.featured %}
      <div class="project-card">
        <h3 class="project-title">{{ project.title }}</h3>
        <p class="project-description">{{ project.description }}</p>

        <div class="project-links">
          {% if project.url %}
            <a href="{{ project.url }}" target="_blank">View Code</a>
          {% endif %}
        </div>
      </div>
    {% endif %}
  {% endfor %}
</div>

### All Projects

{% assign categories = site.data.projects | map: 'category' | uniq | sort %}

{% for category in categories %}
  <h4>{{ category }}</h4>
  <ul>
    {% for project in site.data.projects %}
      {% if project.category == category %}
        <li>
          <strong><a href="{{ project.url }}" target="_blank">{{ project.title }}</a></strong>
          - {{ project.description }}
          <br>
          <small>
            Technologies:
            {% for tech in project.technologies %}
              {{ tech }}{% unless forloop.last %}, {% endunless %}
            {% endfor %}
          </small>
        </li>
      {% endif %}
    {% endfor %}
  </ul>
{% endfor %}

### Contact for Collaboration

Interested in collaborating on a project or discussing opportunities? Feel free to reach out:

- **Email:** [sunhick@gmail.com](mailto:sunhick@gmail.com)
- **GitHub:** [github.com/sunhick](https://github.com/sunhick)
- **LinkedIn:** [linkedin.com/in/sunhick](https://linkedin.com/in/sunhick)
