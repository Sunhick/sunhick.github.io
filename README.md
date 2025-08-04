# Sunil Murthy - Personal Portfolio Website

A modern, responsive Jekyll-based portfolio website built with the Hyde theme and optimized for GitHub Pages hosting. This website showcases projects, skills, and professional information in a clean, professional design with a distinctive sidebar layout and warm 3500K color temperature for comfortable viewing.

## 🚀 Features

- **Hyde Theme**: Built on the popular Hyde Jekyll theme with sidebar navigation
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Jekyll-Powered**: Static site generation with easy content management
- **Portfolio Showcase**: Dynamic project display with filtering capabilities
- **Skills Visualization**: Clean skills presentation without progress bars
- **Contact Integration**: Professional contact page with card-based layout
- **Resume Integration**: Both PDF and native HTML resume versions
- **SEO Optimized**: Proper meta tags, structured data, and search engine optimization
- **GitHub Pages Ready**: Seamless deployment with GitHub Pages
- **Dark Theme Support**: Professional dark theme with customizable colors
- **Warm Color Scheme**: 3500K warm background for comfortable reading
- **Development Tools**: Comprehensive Makefile for development workflow

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
│   ├── index.md            # Home page content
│   ├── portfolio.md        # Portfolio showcase
│   └── resume-html.md      # Native HTML resume version
├── public/                  # Static assets (Hyde theme convention)
│   ├── css/                # Stylesheets
│   │   ├── hyde.css        # Hyde theme styles
│   │   ├── hyde-custom.css # Custom theme overrides with warm colors
│   │   └── hyde-custom-clean.css # Alternative clean theme
│   ├── images/             # Images and media files
│   │   └── profile.jpg     # Profile photo (rectangular format)
│   └── resume/             # Resume files
│       └── Sunil_Murthy_Resume.pdf
├── index.html              # Home page with hero section
├── Makefile                # Development workflow automation
├── Gemfile                 # Ruby dependencies
└── README.md               # This file
```

## 🛠️ Setup Instructions

### Prerequisites

- Ruby (version 2.7 or higher)
- Bundler gem
- Git

### Quick Start with Makefile

1. **Clone the repository**
   ```bash
   git clone https://github.com/sunhick/sunhick.github.io.git
   cd sunhick.github.io
   ```

2. **Full development setup**
   ```bash
   make dev
   ```
   This will clean, install dependencies, and start the development server with hot-reload.

3. **View in browser**
   Open `http://localhost:4000` in your browser

### Manual Setup

1. **Install dependencies**
   ```bash
   make install
   # or manually: bundle install
   ```

2. **Start development server**
   ```bash
   make serve
   # or manually: bundle exec jekyll serve --livereload
   ```

3. **Stop server**
   ```bash
   make stop
   ```

## 🔧 Makefile Commands

This project includes a comprehensive Makefile for streamlined development:

### Development Commands
```bash
make serve          # Start development server with hot-reload
make serve-prod     # Start server with production settings
make serve-port PORT=3000  # Start on custom port
make build          # Build for production
make clean          # Clean generated files
make stop           # Stop all running Jekyll instances
```

### Content Creation
```bash
make new-post TITLE="My New Post"    # Create new blog post
make new-page NAME="about"           # Create new page
```

### Deployment & Git
```bash
make deploy         # Build and deploy to GitHub Pages
make push           # Git add, commit, and push
make pull           # Pull latest changes
```

### Shortcuts
```bash
make s              # Shortcut for serve
make b              # Shortcut for build
make c              # Shortcut for clean
make d              # Shortcut for deploy
```

### Utility Commands
```bash
make help           # Show all available commands
make info           # Show environment information
make doctor         # Check for Jekyll issues
make update         # Update dependencies
```

### GitHub Pages Deployment

1. **Deploy using Makefile**
   ```bash
   make deploy
   ```

2. **Manual deployment**
   ```bash
   git add .
   git commit -m "Update portfolio"
   git push origin main
   ```

3. **Automatic deployment**
   - GitHub Pages will automatically build and deploy your site
   - Your site will be available at `https://sunhick.github.io`

## 🎨 Customization Guide

### Color Scheme

The site uses a warm 3500K color temperature for comfortable viewing:

```css
:root {
    --off-white: #fdf6f0;  /* Warm 3500K background */
    --primary-color: #2c3e50;
    --secondary-color: #3498db;
    --accent-color: #e74c3c;
}
```

### Personal Information

1. **Update _config.yml**
   ```yaml
   title: "Sunil Murthy"
   tagline: "Software Engineer"
   description: "Personal portfolio and resume"
   url: "https://sunhick.github.io"

   author:
     name: "Sunil Murthy"
     email: "sunhick@gmail.com"
   ```

2. **Update home page content**
   Edit `_pages/index.md` to customize:
   - Professional summary
   - Technology stack
   - Current focus areas

### Resume Management

This portfolio includes both PDF and HTML resume versions:

1. **PDF Resume**
   - Located at `public/resume/Sunil_Murthy_Resume.pdf`
   - Generated from LaTeX source at `/Users/sunilmur/prv/github/resume`
   - Update using: `make resume-update`

2. **HTML Resume**
   - Native HTML version at `/resume-html/`
   - Matches PDF formatting exactly
   - Includes download link to PDF version
   - Fully searchable and SEO-friendly

3. **Updating Resume Content**
   - Edit LaTeX source files in the resume repository
   - Rebuild PDF and copy to `public/resume/`
   - Update HTML version in `_pages/resume-html.md`

### Styling Features

1. **Warm Color Scheme**
   - 3500K warm background (`#fdf6f0`) for comfortable reading
   - Consistent warm tones throughout the site
   - Professional appearance with cozy feel

2. **Component Styling**
   ```css
   /* Remove containers for clean look */
   .tech-stack, .current-focus {
     background: none;
     border: none;
     padding: 0;
   }

   /* Contact cards with warm background */
   .contact-item {
     background-color: var(--off-white);
     border: 1px solid #e8ddd4;
   }
   ```

3. **Profile Image**
   - Rectangular format (200x250px)
   - Rounded corners with hover effects
   - Responsive sizing for mobile devices

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

## 🎯 Development Workflow

### Daily Development
```bash
# Start development
make serve

# Make changes to files (hot-reload will update automatically)

# Stop server when done
make stop
```

### Content Updates
```bash
# Update home page content
vim _pages/index.md

# Update portfolio projects
vim _pages/portfolio.md

# Update resume
vim _pages/resume-html.md
```

### Deployment
```bash
# Deploy changes
make deploy

# Or manually
make build
make push
```

### Resume Updates
```bash
# Check for resume source updates
make resume-update

# Update HTML resume to match PDF changes
vim _pages/resume-html.md
```

## 🚀 Live Site

The portfolio is live at: **https://sunhick.github.io**

### Key Pages
- **Home**: Professional summary and technology stack
- **Portfolio**: Featured projects and work samples
- **Resume (HTML)**: Native HTML resume with PDF download
- **Contact**: Professional contact information

### Features
- **Responsive Design**: Works on all devices
- **Dark Theme**: Automatic theme switching
- **Warm Colors**: 3500K color temperature for comfortable viewing
- **Fast Loading**: Optimized for performance
- **SEO Friendly**: Proper meta tags and structure

## 📊 Analytics & Monitoring

To add analytics:

1. **Google Analytics**: Add tracking ID to `_config.yml`
2. **GitHub Pages Insights**: Monitor traffic in repository insights
3. **Performance Monitoring**: Use Lighthouse for performance audits

---

**Built with ❤️ using Jekyll, Hyde theme, and deployed on GitHub Pages**
