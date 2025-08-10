---
layout: page
title: Skills & Expertise
permalink: /skills/
---

# Technical Skills

{% for category in site.data.skills %}
**{{ category.category }}:** {% for skill in category.skills %}{{ skill.name }}{% unless forloop.last %}, {% endunless %}{% endfor %}

{% endfor %}

## Core Expertise

**Systems & Architecture** - C/C++, system design, performance optimization, distributed systems, memory management

**Enterprise Development** - Java, C#/.NET, Kotlin, Spring Boot, microservices architecture, scalable applications

**Modern Development** - Python, TypeScript, Node.js, Django, FastAPI, RESTful APIs, web frameworks

**Security & Authentication** - Authentication systems, authorization (RBAC), cryptography, digital signatures, security best practices

**Cloud & DevOps** - AWS services, Docker, Kubernetes, CI/CD pipelines, Infrastructure as Code

**Specialized Technologies** - TLA+ formal verification, device management, cell-based architecture, Chromium development, system verification

## Currently Learning

- Advanced TLA+ and formal verification methods for distributed systems
- Kubernetes service mesh architecture and custom operators
- Modern security patterns and comprehensive threat modeling
- Performance optimization techniques for large-scale systems
