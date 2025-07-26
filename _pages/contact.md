---
layout: page
title: Get In Touch
permalink: /contact/
---

<div class="contact-section">
  <h2>Let's Connect</h2>
  <p>I'm always interested in discussing new opportunities, collaborating on interesting projects, or simply connecting with fellow developers and technology enthusiasts. Feel free to reach out through any of the channels below.</p>

  <div class="contact-methods">
    <div class="contact-grid">
      <div class="contact-item">
        <div class="contact-icon">
          <i class="fas fa-envelope"></i>
        </div>
        <div class="contact-info">
          <h3>Email</h3>
          <p>For professional inquiries and collaboration</p>
          <a href="mailto:sunil.murthy@example.com" class="contact-link">sunil.murthy@example.com</a>
        </div>
      </div>

      <div class="contact-item">
        <div class="contact-icon">
          <i class="fab fa-linkedin"></i>
        </div>
        <div class="contact-info">
          <h3>LinkedIn</h3>
          <p>Connect with me professionally</p>
          <a href="https://linkedin.com/in/sunilmurthy" target="_blank" class="contact-link">linkedin.com/in/sunilmurthy</a>
        </div>
      </div>

      <div class="contact-item">
        <div class="contact-icon">
          <i class="fab fa-github"></i>
        </div>
        <div class="contact-info">
          <h3>GitHub</h3>
          <p>Check out my code and projects</p>
          <a href="https://github.com/sunilmurthy" target="_blank" class="contact-link">github.com/sunilmurthy</a>
        </div>
      </div>

      <div class="contact-item">
        <div class="contact-icon">
          <i class="fas fa-map-marker-alt"></i>
        </div>
        <div class="contact-info">
          <h3>Location</h3>
          <p>Based in San Francisco, CA</p>
          <span class="contact-text">Open to remote opportunities</span>
        </div>
      </div>
    </div>
  </div>

  <div class="contact-form-section">
    <h3>Send Me a Message</h3>
    <p><em>Note: This is a static form for demonstration. To make it functional, you would need to integrate with a form handling service like Formspree, Netlify Forms, or similar.</em></p>

    <form class="contact-form" action="#" method="POST">
      <div class="form-group">
        <label for="name">Name *</label>
        <input type="text" id="name" name="name" required>
      </div>

      <div class="form-group">
        <label for="email">Email *</label>
        <input type="email" id="email" name="email" required>
      </div>

      <div class="form-group">
        <label for="subject">Subject</label>
        <input type="text" id="subject" name="subject">
      </div>

      <div class="form-group">
        <label for="message">Message *</label>
        <textarea id="message" name="message" rows="6" required></textarea>
      </div>

      <button type="submit" class="btn btn-primary">Send Message</button>
    </form>
  </div>

  <div class="availability-section">
    <h3>Current Availability</h3>
    <div class="availability-status">
      <div class="status-indicator available"></div>
      <div class="status-text">
        <strong>Available for new opportunities</strong>
        <p>I'm currently open to discussing full-time positions, freelance projects, and consulting opportunities. Let's talk about how we can work together!</p>
      </div>
    </div>
  </div>
</div>

<style>
.contact-section {
  max-width: 800px;
  margin: 0 auto;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2em;
  margin: 2em 0;
}

.contact-item {
  display: flex;
  align-items: flex-start;
  gap: 1em;
  padding: 1.5em;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.contact-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.contact-icon {
  font-size: 2em;
  color: var(--secondary-color);
  min-width: 60px;
  text-align: center;
}

.contact-info h3 {
  margin: 0 0 0.5em 0;
  color: var(--primary-color);
}

.contact-info p {
  margin: 0 0 0.5em 0;
  color: var(--dark-gray);
  font-size: 0.9em;
}

.contact-link {
  color: var(--secondary-color);
  text-decoration: none;
  font-weight: 600;
}

.contact-link:hover {
  color: var(--primary-color);
  text-decoration: underline;
}

.contact-text {
  color: var(--dark-gray);
  font-size: 0.9em;
}

.contact-form-section {
  margin: 3em 0;
  padding: 2em;
  background: var(--light-gray);
  border-radius: 8px;
}

.contact-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-group {
  margin-bottom: 1.5em;
}

.form-group label {
  display: block;
  margin-bottom: 0.5em;
  font-weight: 600;
  color: var(--primary-color);
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75em;
  border: 2px solid #ddd;
  border-radius: 4px;
  font-size: 1em;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--secondary-color);
}

.btn {
  background: var(--secondary-color);
  color: white;
  padding: 0.75em 2em;
  border: none;
  border-radius: 4px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn:hover {
  background: var(--primary-color);
}

.availability-section {
  margin: 3em 0;
  padding: 2em;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.availability-status {
  display: flex;
  align-items: flex-start;
  gap: 1em;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 0.5em;
  flex-shrink: 0;
}

.status-indicator.available {
  background: var(--success-color);
  box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.3);
}

.status-text strong {
  color: var(--primary-color);
  display: block;
  margin-bottom: 0.5em;
}

.status-text p {
  color: var(--dark-gray);
  margin: 0;
}

@media (max-width: 768px) {
  .contact-grid {
    grid-template-columns: 1fr;
    gap: 1.5em;
  }

  .contact-item {
    flex-direction: column;
    text-align: center;
  }

  .availability-status {
    flex-direction: column;
    text-align: center;
  }

  .status-indicator {
    align-self: center;
    margin-top: 0;
    margin-bottom: 1em;
  }
}
</style>
