---
layout: page
title: Portfolio
permalink: /portfolio/
---

<div class="projects-section">
  <h2>Featured Projects</h2>
  <p>Here are some of my recent projects that showcase my skills in web development, mobile applications, and software engineering. Each project demonstrates different aspects of my technical expertise and problem-solving abilities.</p>

  <div class="projects-grid">
    {% for project in site.data.projects %}
      {% if project.featured %}
        <div class="project-card fade-in">
          {% if project.image %}
            <img src="{{ project.image }}" alt="{{ project.title }}" class="project-image">
          {% else %}
            <div class="project-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2em;">
              {{ project.title }}
            </div>
          {% endif %}

          <div class="project-content">
            <h3 class="project-title">{{ project.title }}</h3>
            <p class="project-description">{{ project.description }}</p>

            <div class="project-tech">
              {% for tech in project.technologies %}
                <span class="tech-tag">{{ tech }}</span>
              {% endfor %}
            </div>

            <div class="project-links">
              {% if project.url %}
                <a href="{{ project.url }}" target="_blank" class="btn btn-primary">
                  <i class="fab fa-github"></i> View Code
                </a>
              {% endif %}
              {% if project.demo_url %}
                <a href="{{ project.demo_url }}" target="_blank" class="btn btn-outline">
                  <i class="fas fa-external-link-alt"></i> Live Demo
                </a>
              {% endif %}
            </div>
          </div>
        </div>
      {% endif %}
    {% endfor %}
  </div>

  <h2>Other Projects</h2>
  <div class="other-projects">
    {% for project in site.data.projects %}
      {% unless project.featured %}
        <div class="project-item">
          <h4><a href="{{ project.url }}" target="_blank">{{ project.title }}</a></h4>
          <p>{{ project.description }}</p>
          <div class="project-tech">
            {% for tech in project.technologies %}
              <span class="tech-tag">{{ tech }}</span>
            {% endfor %}
          </div>
        </div>
      {% endunless %}
    {% endfor %}
  </div>
</div>

<style>
.other-projects {
  margin-top: 3em;
}

.project-item {
  border-left: 4px solid var(--secondary-color);
  padding-left: 1.5em;
  margin-bottom: 2em;
}

.project-item h4 {
  margin-bottom: 0.5em;
  color: var(--primary-color);
}

.project-item h4 a {
  text-decoration: none;
  color: inherit;
}

.project-item h4 a:hover {
  color: var(--secondary-color);
}

.project-item p {
  margin-bottom: 1em;
  color: var(--dark-gray);
}
</style>

<script>
// Add fade-in animation on scroll
document.addEventListener('DOMContentLoaded', function() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
  });
});
</script>
