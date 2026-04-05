---
layout: page
title: Skills & Expertise
permalink: /skills/
---

<div class="skills-grid">
{% for category in site.data.skills %}
<div class="skill-category-card fade-in">
    <h3><i class="{{ category.skills[0].icon }}"></i> {{ category.category }}</h3>
    {% for skill in category.skills %}
    <div class="skill-item">
        <div class="skill-icon"><i class="{{ skill.icon }}"></i></div>
        <div class="skill-info">
            <div class="skill-name">{{ skill.name }}</div>
            <div class="skill-bar">
                <div class="skill-progress" data-level="{{ skill.level }}"></div>
            </div>
        </div>
        <div class="skill-level">{{ skill.level }}%</div>
    </div>
    {% endfor %}
</div>
{% endfor %}
</div>

## Currently Learning

- Advanced TLA+ and formal verification methods for distributed systems
- Kubernetes service mesh architecture and custom operators
- Modern security patterns and comprehensive threat modeling
- Performance optimization techniques for large-scale systems
