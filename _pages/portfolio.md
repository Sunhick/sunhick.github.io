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

        <div class="project-tech">
          {% for tech in project.technologies %}
            <span class="tech-tag">{{ tech }}</span>
          {% endfor %}
        </div>

        <div class="project-links">
          {% if project.url %}
            <a href="{{ project.url }}" target="_blank">View Code</a>
          {% endif %}
          {% if project.demo_url %}
            <a href="{{ project.demo_url }}" target="_blank">Live Demo</a>
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

### Programming Languages & Technologies

Based on my project portfolio, here are the main technologies I work with:

**Systems Programming:** C, C++
**Enterprise Development:** Java, C#/.NET Core
**Modern Development:** Kotlin, TypeScript, Python
**Web Technologies:** Node.js, React, Django, FastAPI
**Cloud & DevOps:** AWS, Docker, Kubernetes
**Databases:** PostgreSQL, MongoDB, Redis
**Security:** OpenPGP, JWT, OAuth2, Cryptography
**Formal Methods:** TLA+, System Verification
**Browser Technologies:** Chromium, V8, WebAssembly

### Open Source Contributions

I'm an active contributor to the open-source community with contributions to:

- **Chromium Project** - Performance improvements and web platform features
- **Developer Tools** - TypeScript utilities and VS Code extensions
- **System Utilities** - Python automation and administration tools
- **Security Tools** - GPG and cryptographic utilities

### Contact for Collaboration

Interested in collaborating on a project or discussing opportunities? Feel free to reach out:

- **Email:** [sunhick@gmail.com](mailto:sunhick@gmail.com)
- **GitHub:** [github.com/sunhick](https://github.com/sunhick)
- **LinkedIn:** [linkedin.com/in/sunhick](https://linkedin.com/in/sunhick)
