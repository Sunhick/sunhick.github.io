# Sunil Murthy - Personal Portfolio Website

A modern, responsive Jekyll-based portfolio website built with the Hyde theme and optimized for GitHub Pages hosting. This website showcases projects, skills, and professional information in a clean, professional design with a distinctive sidebar layout.

## 🚀 Features

- **Hyde Theme**: Built on the popular Hyde Jekyll theme with sidebar navigation
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Jekyll-Powered**: Static site generation with easy content management
- **Portfolio Showcase**: Dynamic project display with filtering capabilities
- **Skills Visualization**: Interactive skill bars and expertise sections
- **Contact Integration**: Professional contact page with secure communication options
- **SEO Optimized**: Proper meta tags, structured data, and search engine optimization
- **GitHub Pages Ready**: Seamless deployment with GitHub Pages
- **Dark Theme Support**: Professional dark theme with customizable colors

## 📁 Project Structure

```
├── _config.yml              # Jekyll configuration
├── _data/                   # Data files for content management
│   ├── projects.yml         # Portfolio projects data
│   └── skills.yml          # Skills and expertise data
├── _includes/               # Reusable template components
│   ├── head.html           # HTML head section
│   └── sidebar.html        # Hyde theme sidebar
├── _layouts/                # Page layouts
│   ├── default.html        # Base layout with sidebar
│   ├── page.html           # Standard page layout
│   └── post.html           # Blog post layout
├── _pages/                  # Site pages (organized in subdirectory)
│   ├── about.md            # About page
│   ├── contact.md          # Contact page with GPG integration
│   ├── portfolio.md        # Portfolio showcase
│   ├── resume.md           # Resume with PDF viewer
│   └── skills.md           # Skills and expertise
├── public/                  # Static assets (Hyde theme convention)
│   ├── css/                # Stylesheets
│   │   ├── hyde.css        # Hyde theme styles
│   │   ├── hyde-custom.css # Custom theme overrides
│   │   ├── main.scss       # Main stylesheet with customizations
│   │   ├── poole.css       # Base Poole styles
│   │   └── syntax.css      # Code syntax highlighting
│   ├── images/             # Images and media files
│   │   ├── profile.jpg     # Profile photo
│   │   └── projects/       # Project screenshots
│   ├── js/                 # JavaScript files
│   │   └── main.js         # Custom JavaScript functionality
│   ├── resume/             # Resume files
│   │   └── Sunil_Murthy_Resume.pdf
│   ├── favicon.ico         # Site favicon
│   └── apple-touch-icon-144-precomposed.png
├── index.html              # Home page with hero section
├── Gemfile                 # Ruby dependencies
└── README.md               # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Ruby (version 2.7 or higher)
- Bundler gem
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/your-portfolio.git
   cd your-portfolio
   ```

2. **Install dependencies**
   ```bash
   bundle install --path vendor/bundle
   ```

3. **Run locally**
   ```bash
   bundle exec jekyll serve
   ```

4. **View in browser**
   Open `http://localhost:4000` in your browser

### GitHub Pages Deployment

1. **Enable GitHub Pages**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "GitHub Actions" as the source

2. **Push to main branch**
   ```bash
   git add .
   git commit -m "Initial portfolio setup"
   git push origin main
   ```

3. **Automatic deployment**
   - GitHub Actions will automatically build and deploy your site
   - Your site will be available at `https://yourusername.github.io`

## 🎨 Customization Guide

### Personal Information

1. **Update _config.yml**
   ```yaml
   title: "Your Name"
   tagline: "Your Professional Tagline"
   description: "Your professional description"
   url: "https://yourusername.github.io"

   author:
     name: "Your Name"
     email: "your.email@example.com"

   # Social links (Hyde theme format)
   social:
     github: "yourusername"
     linkedin: "yourprofile"
     email: "your.email@example.com"
   ```

2. **Update navigation**
   ```yaml
   nav:
     - name: "Home"
       url: "/"
     - name: "About"
       url: "/about/"
     - name: "Portfolio"
       url: "/portfolio/"
     - name: "Skills"
       url: "/skills/"
     - name: "Contact"
       url: "/contact/"
   ```

### Content Management

1. **Projects (_data/projects.yml)**
   ```yaml
   - title: "Project Name"
     description: "Project description"
     image: "/public/images/projects/project.jpg"
     url: "https://github.com/yourusername/project"
     technologies: ["HTML", "CSS", "JavaScript"]
     featured: true
   ```

2. **Skills (_data/skills.yml)**
   ```yaml
   - category: "Frontend Development"
     skills:
       - name: "HTML/CSS"
         level: 90
         icon: "fab fa-html5"
       - name: "JavaScript"
         level: 85
         icon: "fab fa-js-square"
   ```

### Styling Customization

1. **Colors (public/css/main.scss)**
   ```scss
   :root {
     --primary-color: #2c3e50;
     --secondary-color: #3498db;
     --accent-color: #e74c3c;
     --success-color: #27ae60;
     --text-color: #2c3e50;
     --light-gray: #ecf0f1;
     --dark-gray: #34495e;
   }
   ```

2. **Hyde Theme Customization (public/css/hyde-custom.css)**
   ```css
   /* Custom sidebar colors */
   .sidebar {
     background-color: #your-color;
   }

   /* Custom link colors */
   .sidebar-nav-item {
     color: #your-color;
   }
   ```

### Adding Images

1. **Profile photo**: Add `profile.jpg` to `/public/images/`
2. **Project images**: Add to `/public/images/projects/`
3. **Update image paths** in data files and pages

## 📝 Content Guidelines

### Writing Project Descriptions
- Keep descriptions concise but informative
- Highlight key technologies and achievements
- Include both GitHub links and live demo URLs when available

### Skills Section
- Use percentage values (0-100) for skill levels
- Choose appropriate Font Awesome icons
- Group skills into logical categories

### About Page
- Write in first person
- Include professional background and interests
- Mention current availability and goals

## 🔧 Advanced Customization

### Adding New Pages

1. Create a new file in `_pages/`
   ```markdown
   ---
   layout: page
   title: "New Page"
   permalink: /new-page/
   ---

   Your content here...
   ```

2. Update navigation in `_config.yml`
   ```yaml
   nav:
     - name: "New Page"
       url: "/new-page/"
   ```

### Custom Layouts

1. Create layout files in `_layouts/`
2. Use Liquid templating for dynamic content
3. Reference in page front matter

### Form Integration

The contact form is currently static. To make it functional:

1. **Formspree**: Add `action="https://formspree.io/f/your-form-id"`
2. **Netlify Forms**: Add `netlify` attribute to form tag
3. **Custom backend**: Implement your own form handling service

## 🚀 Performance Optimization

- Images are lazy-loaded by default
- CSS and JavaScript are minified in production
- Responsive images for different screen sizes
- Optimized for Core Web Vitals

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Jekyll documentation](https://jekyllrb.com/docs/)
2. Review [GitHub Pages documentation](https://docs.github.com/en/pages)
3. Open an issue in this repository

## 🎨 Hyde Theme Customization

### Theme Colors
The Hyde theme supports multiple color schemes. You can change the theme by adding a class to the `<body>` tag in `_layouts/default.html`:

- `theme-base-08` - Red
- `theme-base-09` - Orange
- `theme-base-0a` - Yellow
- `theme-base-0b` - Green
- `theme-base-0c` - Cyan
- `theme-base-0d` - Blue (current)
- `theme-base-0e` - Magenta
- `theme-base-0f` - Brown

### Sidebar Customization
Edit `_includes/sidebar.html` to customize:
- Site title and tagline
- Navigation links
- Social media links
- Additional sidebar content

## 🔒 Security Features

This portfolio includes several security features:

- **GPG Integration**: Contact page includes GPG public key for secure communications
- **Digital Fingerprint**: Verification of identity through cryptographic proof
- **Secure Asset Loading**: All assets loaded over HTTPS
- **Content Security**: No external dependencies that could compromise security

## 🎯 Next Steps

After setting up your portfolio:

1. **Customize content** with your personal information in `_config.yml`
2. **Add your projects** to `_data/projects.yml`
3. **Upload images** to `public/images/` and `public/images/projects/`
4. **Update skills** in `_data/skills.yml`
5. **Customize colors** in `public/css/hyde-custom.css`
6. **Add your resume** to `public/resume/`
7. **Test responsiveness** on different devices
8. **Set up analytics** (Google Analytics, etc.)
9. **Optimize for SEO** with proper meta descriptions
10. **Deploy to GitHub Pages**

## 🚀 Deployment

This site is configured for automatic deployment to GitHub Pages:

1. Push changes to the `main` branch
2. GitHub Actions will automatically build and deploy
3. Site will be available at `https://yourusername.github.io`

## 📊 Analytics & Monitoring

To add analytics:

1. **Google Analytics**: Add tracking ID to `_config.yml`
2. **GitHub Pages Insights**: Monitor traffic in repository insights
3. **Performance Monitoring**: Use Lighthouse for performance audits

---

**Built with ❤️ using Jekyll, Hyde theme, and deployed on GitHub Pages**
