---
layout: page
title: Resume
permalink: /resume/
---

<div class="resume-container">
    <div class="resume-header">
        <div class="resume-actions">
            <a href="{{ site.baseurl }}/public/resume/Sunil_Murthy_Resume.pdf" class="btn-download" target="_blank">
                <i class="fas fa-download"></i> Download PDF
            </a>
        </div>
    </div>

    <div class="resume-viewer">
        <iframe src="{{ site.baseurl }}/public/resume/Sunil_Murthy_Resume.pdf" width="100%" height="100%" frameborder="0" style="width: 100% !important; height: 100% !important;">
            <div class="pdf-fallback">
                <p>Your browser doesn't support PDF viewing or the resume file is not available.</p>
                <p>Please <a href="{{ site.baseurl }}/public/resume/Sunil_Murthy_Resume.pdf" target="_blank">download the PDF</a> instead.</p>
            </div>
        </iframe>
    </div>
</div>

<style>
.resume-container {
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 0.5rem;
    height: calc(100vh - 120px);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

.resume-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #6a9fb5;
    flex-shrink: 0;
}

.resume-actions {
    display: flex;
    gap: 1rem;
}

.btn-download {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: #6a9fb5;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.9rem;
    transition: all 0.3s ease;
    border: none;
    cursor: pointer;
}

.btn-download:hover {
    background-color: #5a8fa5;
    text-decoration: none;
    color: white;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(106, 159, 181, 0.3);
}

.btn-download i {
    margin-right: 0.5rem;
}

.resume-viewer {
    background: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    border: 1px solid #e5e5e5;
    flex: 1;
    width: 100%;
    min-height: 600px;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
}

.resume-viewer iframe {
    width: 100% !important;
    height: 100% !important;
    border: none;
    display: block;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    object-fit: fill;
}

.pdf-fallback {
    padding: 2rem;
    text-align: center;
    background: #f8f9fa;
    color: #6c757d;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
}

.pdf-fallback p {
    margin-bottom: 1rem;
    font-size: 1rem;
}

/* Dark theme adjustments */
.dark-theme .resume-header {
    border-bottom-color: #6a9fb5;
}

.dark-theme .resume-viewer {
    background-color: #2d2d2d;
    border-color: #404040;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dark-theme .pdf-fallback {
    background-color: #1a1a1a;
    color: #b0b0b0;
}

.dark-theme .btn-download {
    background-color: #6a9fb5;
}

.dark-theme .btn-download:hover {
    background-color: #5a8fa5;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .resume-header {
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
        margin-bottom: 0.75rem;
    }

    .resume-actions {
        justify-content: center;
    }

    .btn-download {
        padding: 0.4rem 0.8rem;
        font-size: 0.85rem;
    }

    .resume-container {
        height: calc(100vh - 80px);
        padding: 0.5rem;
    }

    .resume-viewer {
        flex: 1;
        width: 100%;
        min-height: 500px;
    }

    .resume-viewer iframe {
        width: 100% !important;
        height: 100% !important;
    }

    .pdf-fallback {
        padding: 1.5rem 1rem;
    }
}

/* Override any default iframe styling */
.resume-viewer iframe {
    transform: scale(1) !important;
    transform-origin: 0 0 !important;
    zoom: 1 !important;
}

/* Force full width utilization */
.resume-container * {
    box-sizing: border-box;
}

/* Ensure no margins or padding interfere */
.page {
    padding: 0 !important;
    margin: 0 !important;
}

.content {
    padding-top: 2rem !important;
    padding-bottom: 1rem !important;
}

/* Ensure iframe fills available space */
@media (min-width: 769px) {
    .resume-container {
        height: calc(100vh - 100px);
        padding: 0.75rem;
    }

    .resume-viewer {
        flex: 1;
        width: 100%;
    }

    .resume-viewer iframe {
        width: 100% !important;
        height: 100% !important;
    }
}
</style>
