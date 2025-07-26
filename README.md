# Sunil Murthy - Personal Portfolio Website

A modern, responsive Jekyll-based portfolio website optimized for GitHub Pages hosting. This website showcases projects, skills, and professional information in a clean, professional design.

## 🚀 Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Jekyll-Powered**: Static site generation with easy content management
- **Portfolio Showcase**: Dynamic project display with filtering capabilities
- **Skills Visualization**: Interactive skill bars and expertise sections
- **Contact Integration**: Professional contact page with form (ready for integration)
- **SEO Optimized**: Proper meta tags, structured data, and search engine optimization
- **GitHub Pages Ready**: Seamless deployment with GitHub Pages

## 📁 Project Structure

```
├── _config.yml              # Jekyll configuration
├── _data/                   # Data files for content management
│   ├── navigation.yml       # Site navigation menu
│   ├── projects.yml         # Portfolio projects data
│   └── skills.yml          # Skills and expertise data
├── _pages/                  # Site pages
│   ├── about.md            # About page
│   ├── contact.md          # Contact page
│   ├── portfolio.md        # Portfolio showcase
│   └── skills.md           # Skills and expertise
├── assets/                  # Static assets
│   ├── css/main.scss       # Main stylesheet with customizations
│   ├── js/main.js          # JavaScript functionality
│   └── images/             # Images and media files
├── .github/workflows/       # GitHub Actions for deployment
└── index.html              # Home page with hero section
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
   description: "Your professional description"
   author:
     name: "Your Name"
     email: "your.email@example.com"
     bio: "Your professional bio"
     location: "Your Location"
   ```

2. **Update social links**
   ```yaml
   author:
     links:
       - label: "GitHub"
         icon: "fab fa-fw fa-github"
         url: "https://github.com/yourusername"
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
   ```

3. **Navigation (_data/navigation.yml)**
   ```yaml
   main:
     - title: "Home"
       url: /
     - title: "About"
       url: /about/
   ```

### Styling Customization

1. **Colors (assets/css/main.scss)**
   ```scss
   :root {
     --primary-color: #2c3e50;
     --secondary-color: #3498db;
     --accent-color: #e74c3c;
   }
   ```

2. **Typography**
   ```scss
   $font-primary: 'Your Font', sans-serif;
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
2. Add front matter with permalink
3. Update navigation in `_data/navigation.yml`

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

## 🎯 Next Steps

After setting up your portfolio:

1. **Customize content** with your personal information
2. **Add your projects** to the portfolio section
3. **Upload images** for profile and projects
4. **Test responsiveness** on different devices
5. **Optimize for SEO** with proper meta descriptions
6. **Set up analytics** (Google Analytics, etc.)
7. **Add a blog section** if desired
8. **Implement contact form** with a service provider

---

**Built with ❤️ using Jekyll and deployed on GitHub Pages**
