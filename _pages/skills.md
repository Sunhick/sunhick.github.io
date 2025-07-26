---
layout: page
title: Skills & Expertise
permalink: /skills/
---

<div class="skills-section">
  <h2>Technical Skills</h2>
  <p>Here's an overview of my technical skills and expertise across different areas of software development. I'm constantly learning and expanding my skill set to stay current with industry trends and best practices.</p>

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

  <div class="additional-skills">
    <h3>Additional Expertise</h3>
    <div class="expertise-grid">
      <div class="expertise-item">
        <h4><i class="fas fa-code"></i> Software Development</h4>
        <ul>
          <li>Agile/Scrum methodologies</li>
          <li>Test-driven development (TDD)</li>
          <li>Code review and pair programming</li>
          <li>Version control with Git</li>
        </ul>
      </div>

      <div class="expertise-item">
        <h4><i class="fas fa-cloud"></i> DevOps & Deployment</h4>
        <ul>
          <li>CI/CD pipeline setup</li>
          <li>Docker containerization</li>
          <li>AWS cloud services</li>
          <li>Server configuration and monitoring</li>
        </ul>
      </div>

      <div class="expertise-item">
        <h4><i class="fas fa-users"></i> Collaboration & Leadership</h4>
        <ul>
          <li>Team leadership and mentoring</li>
          <li>Technical documentation</li>
          <li>Client communication</li>
          <li>Project management</li>
        </ul>
      </div>

      <div class="expertise-item">
        <h4><i class="fas fa-lightbulb"></i> Problem Solving</h4>
        <ul>
          <li>Algorithm design and optimization</li>
          <li>Database design and optimization</li>
          <li>Performance tuning</li>
          <li>Security best practices</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
.additional-skills {
  margin-top: 3em;
  padding-top: 2em;
  border-top: 2px solid var(--light-gray);
}

.expertise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2em;
  margin-top: 2em;
}

.expertise-item {
  background: white;
  padding: 1.5em;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border-left: 4px solid var(--secondary-color);
}

.expertise-item h4 {
  color: var(--primary-color);
  margin-bottom: 1em;
  display: flex;
  align-items: center;
  gap: 0.5em;
}

.expertise-item ul {
  list-style: none;
  padding: 0;
}

.expertise-item li {
  padding: 0.25em 0;
  color: var(--dark-gray);
  position: relative;
  padding-left: 1.5em;
}

.expertise-item li:before {
  content: "▸";
  color: var(--secondary-color);
  position: absolute;
  left: 0;
}

@media (max-width: 768px) {
  .expertise-grid {
    grid-template-columns: 1fr;
    gap: 1.5em;
  }
}
</style>

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

        // Animate skill bars when skills section becomes visible
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
