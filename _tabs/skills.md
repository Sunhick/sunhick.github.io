---
layout: page
icon: fas fa-code
order: 3
title: Skills & Expertise
---

{% for category in site.data.skills %}

### {{ category.category }}

| Skill | Proficiency |
|-------|-------------|
{% for skill in category.skills %}| {{ skill.name }} | {{ skill.level }}% |
{% endfor %}

{% endfor %}

## Currently Learning

- Advanced TLA+ and formal verification methods for distributed systems
- Kubernetes service mesh architecture and custom operators
- Modern security patterns and comprehensive threat modeling
- Performance optimization techniques for large-scale systems
