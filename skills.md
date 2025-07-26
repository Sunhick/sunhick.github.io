---
layout: page
title: Skills & Expertise
permalink: /skills/
---

## Technical Skills

<div class="skills-section skills-two-column">
  {% for category in site.data.skills %}
    <div class="skill-category fade-in">
      <h3>{{ category.category }}</h3>
      {% for skill in category.skills %}
        <div class="skill-item">
          <div class="skill-icon">
            <i class="{{ skill.icon }}"></i>
          </div>
          <div class="skill-info">
            <div class="skill-name">{{ skill.name }}</div>
            <div class="skill-bar">
              <div class="skill-progress" data-level="{{ skill.level }}" style="width: 0%"></div>
            </div>
          </div>
          <div class="skill-level">{{ skill.level }}%</div>
        </div>
      {% endfor %}
    </div>
  {% endfor %}
</div>

<style>
.skills-two-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin: 2rem 0;
}

.skills-two-column .skill-category {
  margin-bottom: 1.5rem;
}

.skills-two-column .skill-category h3 {
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

/* Responsive: single column on mobile */
@media (max-width: 768px) {
  .skills-two-column {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>

## Core Expertise

**Systems & Architecture**: C/C++, system design, performance optimization, distributed systems
**Enterprise Development**: Java, C#/.NET, Kotlin, Spring Boot, microservices
**Modern Stack**: Python, TypeScript, Node.js, Django, RESTful APIs
**Security**: Authentication systems, cryptography, digital signatures, RBAC
**Cloud & DevOps**: AWS, Docker, Kubernetes, CI/CD, Infrastructure as Code
**Specialized**: TLA+ formal verification, device management, Chromium development

## Currently Learning

- Advanced TLA+ and formal verification methods
- Kubernetes service mesh and operators
- Emerging security patterns and threat modeling

<script>
document.addEventListener('DOMContentLoaded', function() {
  // Animate skill bars
  const animateSkillBars = () => {
    const skillBars = document.querySelectorAll('.skill-progress');
    skillBars.forEach(bar => {
      const level = bar.getAttribute('data-level');
      setTimeout(() => {
        bar.style.width = level + '%';
      }, Math.random() * 1000);
    });
  };

  // Intersection Observer for fade-in animation
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.classList.contains('skill-category')) {
          animateSkillBars();
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll('.fade-in').forEach(el => {
    observer.observe(el);
  });
});
</script>
