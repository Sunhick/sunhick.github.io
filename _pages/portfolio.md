---
layout: page
title: Portfolio
permalink: /portfolio/
---

Showcasing projects and technical skills across device management, system architecture, authentication systems, and open-source contributions.

## Resume

<div class="resume-container">
    <div class="resume-header">
        <a href="{{ site.baseurl }}/public/resume/Sunil_Murthy_Resume.pdf" class="btn-download" target="_blank">
            <i class="fas fa-download"></i> Download PDF
        </a>
    </div>
    <div class="resume-viewer">
        <iframe src="{{ site.baseurl }}/public/resume/Sunil_Murthy_Resume_Dark.pdf" title="Resume PDF viewer">
            <div class="pdf-fallback">
                <p>Your browser doesn't support PDF viewing.</p>
                <p><a href="{{ site.baseurl }}/public/resume/Sunil_Murthy_Resume_Dark.pdf" target="_blank">Download the PDF</a> instead.</p>
            </div>
        </iframe>
    </div>
</div>

## Featured Projects

<div class="projects-grid">
{% for project in site.data.projects %}
  {% if project.featured %}
<div class="project-card">
    <div class="project-title">{{ project.title }}</div>
    <p class="project-description">{{ project.description }}</p>
    <div class="project-tech">
        {% for tech in project.technologies %}
        <span class="tech-tag">{{ tech }}</span>
        {% endfor %}
    </div>
    <div class="project-links">
        <a href="{{ project.url }}" target="_blank" rel="noopener"><i class="fab fa-github"></i> Source</a>
        {% if project.demo_url and project.demo_url != "" %}
        <a href="{{ project.demo_url }}" target="_blank" rel="noopener"><i class="fas fa-external-link-alt"></i> Demo</a>
        {% endif %}
    </div>
</div>
  {% endif %}
{% endfor %}
</div>
