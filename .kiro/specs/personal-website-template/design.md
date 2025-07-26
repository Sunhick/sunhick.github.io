# Design Document

## Overview

The personal website will be built using an existing Jekyll portfolio theme as the foundation, customized to showcase Sunil Murthy's professional information. The design approach focuses on selecting a well-maintained, GitHub Pages-compatible portfolio theme and customizing it with personal content, branding, and styling preferences. This approach leverages proven design patterns and responsive layouts while allowing for personalization and content management through Jekyll's templating system.

## Architecture

### Theme Selection Criteria
- **GitHub Pages Compatibility**: Must work with GitHub Pages' Jekyll version and plugins
- **Portfolio Focus**: Designed specifically for showcasing projects and professional information
- **Responsive Design**: Mobile-first approach with clean, modern aesthetics
- **Active Maintenance**: Regular updates and community support
- **Customization Friendly**: Easy to modify colors, fonts, and content structure

### Recommended Portfolio Themes
1. **Minimal Mistakes**: Highly customizable, well-documented, GitHub Pages compatible
2. **Beautiful Jekyll**: Clean design, easy setup, portfolio-focused
3. **Academic Pages**: Perfect for professionals, includes CV/resume sections
4. **Portfolios**: Specifically designed for showcasing work and projects

### File Structure (Theme-based)
```
/
├── _config.yml (customized theme configuration)
├── _data/
│   ├── navigation.yml (custom navigation)
│   ├── projects.yml (portfolio projects)
│   └── skills.yml (professional skills)
├── _pages/
│   ├── about.md
│   ├── portfolio.md
│   └── contact.md
├── _posts/ (optional blog posts)
├── assets/
│   ├── images/
│   │   ├── profile.jpg
│   │   └── projects/
│   └── css/
│       └── custom.scss (theme overrides)
├── index.md (home page content)
├── Gemfile (theme dependencies)
└── README.md (customization documentation)
```

### Technology Stack
- **Jekyll Portfolio Theme**: Pre-built, maintained theme as foundation
- **Jekyll**: Static site generator with Liquid templating
- **Theme's CSS Framework**: Leverage existing responsive design
- **SCSS Customization**: Override theme styles for personalization
- **YAML Data Files**: Manage content through structured data
- **GitHub Pages**: Seamless deployment with theme support

## Components and Interfaces

### Theme Customization Approach
The design leverages existing theme components while customizing content and styling to match personal branding requirements.

### 1. Theme Configuration
- **Purpose**: Customize theme settings and site metadata
- **Configuration**: _config.yml with personal information, social links, and theme options
- **Customization**: Site title, description, author information, and theme-specific settings

### 2. Content Pages
- **Home Page**: Landing page with hero section and overview
- **About Page**: Detailed personal and professional information
- **Portfolio Page**: Project showcase with filtering and categorization
- **Contact Page**: Contact information and optional contact form

### 3. Data-Driven Content
- **Projects**: YAML data file for easy project management
- **Skills**: Structured skill categories and proficiency levels
- **Navigation**: Customizable navigation menu structure
- **Social Links**: Centralized social media link management

### 4. Custom Styling
- **Theme Overrides**: Custom SCSS file to modify theme appearance
- **Color Scheme**: Personal brand colors applied through CSS variables
- **Typography**: Custom font selections and sizing
- **Layout Adjustments**: Spacing and component positioning tweaks

### 5. Asset Management
- **Images**: Profile photos, project screenshots, and icons
- **Optimization**: Responsive images and proper alt text
- **Organization**: Structured asset folders for maintainability

## Data Models

### Jekyll Configuration (_config.yml)
```yaml
title: "Sunil Murthy"
description: "Personal website and portfolio"
url: "https://sunilmurthy.github.io"
baseurl: ""

# Theme configuration (example using minimal-mistakes)
remote_theme: "mmistakes/minimal-mistakes@4.24.0"
minimal_mistakes_skin: "default"

# Build settings
markdown: kramdown
highlighter: rouge
plugins:
  - jekyll-feed
  - jekyll-sitemap
  - jekyll-include-cache

# Site settings
author:
  name: "Sunil Murthy"
  email: "sunil@example.com"
  bio: "Software Developer and Technology Enthusiast"
  location: "Your Location"
  avatar: "/assets/images/profile.jpg"

# Social links (theme-specific format)
social:
  type: "Person"
  links:
    - "https://github.com/sunilmurthy"
    - "https://linkedin.com/in/sunilmurthy"

# Theme-specific settings
defaults:
  - scope:
      path: ""
      type: posts
    values:
      layout: single
      author_profile: true
```

### Data Files Structure

#### Projects Data (_data/projects.yml)
```yaml
- title: "Project Name"
  description: "Brief project description"
  image: "/assets/images/project1.jpg"
  url: "https://github.com/yourusername/project"
  technologies: ["HTML", "CSS", "JavaScript"]
  featured: true

- title: "Another Project"
  description: "Another project description"
  image: "/assets/images/project2.jpg"
  url: "https://github.com/yourusername/project2"
  technologies: ["Jekyll", "SCSS"]
  featured: false
```

#### Skills Data (_data/skills.yml)
```yaml
- category: "Frontend"
  skills:
    - name: "HTML/CSS"
      level: 90
    - name: "JavaScript"
      level: 85
    - name: "React"
      level: 80

- category: "Backend"
  skills:
    - name: "Node.js"
      level: 75
    - name: "Python"
      level: 70
```

#### Social Links (_data/social.yml)
```yaml
- name: "GitHub"
  url: "https://github.com/yourusername"
  icon: "github"

- name: "LinkedIn"
  url: "https://linkedin.com/in/yourprofile"
  icon: "linkedin"
```

### SCSS Variables (_sass/_base.scss)
```scss
// Colors
$primary-color: #2c3e50;
$secondary-color: #3498db;
$accent-color: #e74c3c;
$text-color: #333;
$background-color: #fff;
$section-background: #f8f9fa;

// Typography
$font-primary: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
$font-secondary: Georgia, serif;
$font-size-base: 16px;
$line-height-base: 1.6;

// Spacing
$spacing-xs: 0.5rem;
$spacing-sm: 1rem;
$spacing-md: 2rem;
$spacing-lg: 4rem;
$spacing-xl: 6rem;
```

### Liquid Template Structure
```liquid
<!-- Example of projects section using Liquid -->
<section id="projects">
  <h2>Projects</h2>
  <div class="projects-grid">
    {% for project in site.data.projects %}
      {% if project.featured %}
        <div class="project-card">
          <img src="{{ project.image }}" alt="{{ project.title }}">
          <h3>{{ project.title }}</h3>
          <p>{{ project.description }}</p>
          <div class="technologies">
            {% for tech in project.technologies %}
              <span class="tech-tag">{{ tech }}</span>
            {% endfor %}
          </div>
          <a href="{{ project.url }}" target="_blank">View Project</a>
        </div>
      {% endif %}
    {% endfor %}
  </div>
</section>
```

## Error Handling

### Image Loading
- **Fallback**: CSS background colors for missing images
- **Alt Text**: Descriptive alt attributes for all images
- **Lazy Loading**: Native lazy loading for performance

### JavaScript Failures
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Graceful Degradation**: Navigation works with standard anchor links
- **Error Boundaries**: Try-catch blocks for interactive features

### Browser Compatibility
- **Fallbacks**: CSS fallbacks for older browsers
- **Vendor Prefixes**: Where necessary for CSS properties
- **Feature Detection**: Check for feature support before using

## Testing Strategy

### Manual Testing
1. **Cross-browser Testing**: Chrome, Firefox, Safari, Edge
2. **Device Testing**: Desktop, tablet, mobile viewports
3. **Accessibility Testing**: Keyboard navigation, screen reader compatibility
4. **Performance Testing**: Page load speed, image optimization

### Validation Testing
1. **HTML Validation**: W3C HTML validator
2. **CSS Validation**: W3C CSS validator
3. **Accessibility**: WAVE or similar accessibility checker
4. **Mobile-Friendly**: Google Mobile-Friendly Test

### GitHub Pages Testing
1. **Deployment Test**: Verify all assets load correctly
2. **Path Testing**: Ensure relative paths work in GitHub Pages environment
3. **Performance**: Test loading speed on GitHub Pages servers

### Content Testing
1. **Placeholder Verification**: Ensure all placeholder content is clearly marked
2. **Customization Testing**: Verify CSS variables work for theming
3. **Responsive Testing**: Test all breakpoints and layouts

## Design Decisions and Rationales

### Single Page Application Approach
- **Decision**: Use smooth scrolling single-page design
- **Rationale**: Modern user experience, easy navigation, perfect for personal websites

### CSS Custom Properties for Theming
- **Decision**: Use CSS variables for colors, fonts, and spacing
- **Rationale**: Easy customization without deep CSS knowledge

### Minimal JavaScript
- **Decision**: Use vanilla JavaScript sparingly
- **Rationale**: Fast loading, no dependency management, GitHub Pages friendly

### Mobile-First Responsive Design
- **Decision**: Design for mobile first, then enhance for larger screens
- **Rationale**: Mobile traffic dominance, better performance on mobile devices

### Semantic HTML Structure
- **Decision**: Use proper HTML5 semantic elements
- **Rationale**: Better accessibility, SEO benefits, cleaner code structure

### Jekyll Static Site Generator
- **Decision**: Use Jekyll with Liquid templating and YAML data files
- **Rationale**: Native GitHub Pages support, powerful templating system, easy content management through data files, SCSS preprocessing, and maintainable modular structure
