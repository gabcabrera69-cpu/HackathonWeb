// --- Website Navigation Logic (for index.html) ---
const isHomePage = document.querySelector('#about');

if (isHomePage) {
    const sections = document.querySelectorAll('main [id]');
    // On mobile, only the top-nav is visible. On desktop, both are.
    const navLinks = document.querySelectorAll('.side-nav .nav-link');

    function updateActiveSection() {
        let current = '';
        const scrollPosition = window.pageYOffset + window.innerHeight / 1.5;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            const sectionBottom = sectionTop + sectionHeight;

            // Check if the scroll position is within the section's bounds
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                current = section.getAttribute('id');
            }
        });

        // If no section is in view, optionally set a default or keep the last active
        if (!current && sections.length > 0) {
            const lastSection = sections[sections.length - 1];
            if (scrollPosition >= lastSection.offsetTop) {
                current = lastSection.getAttribute('id'); // Handle case where scrolled past last section
            }
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', updateActiveSection);
    // Run initially to set active section on page load
    updateActiveSection();
}

// --- Hide/Show Top Nav on Scroll ---
const topNav = document.querySelector('.top-nav');
const sideNav = document.querySelector('.side-nav');
const heroSection = document.querySelector('.hero-section');
const chatbotContainer = document.querySelector('.chatbot-container');

// This logic should only apply to the homepage which has a hero section.
if (heroSection) {
    function toggleNavOnScroll() {
        // Use window.innerHeight as it's equivalent to 100vh
        if (window.pageYOffset > window.innerHeight * 0.95) { // Show nav just before hero is fully gone
            topNav.classList.add('top-nav--visible');
            sideNav.classList.add('side-nav--visible');
            chatbotContainer.classList.add('chatbot-container--visible');
        } else {
            topNav.classList.remove('top-nav--visible');
            sideNav.classList.remove('side-nav--visible');
            chatbotContainer.classList.remove('chatbot-container--visible');
        }
    }

    window.addEventListener('scroll', toggleNavOnScroll);
} else if (topNav) {
    // For other pages, make the top nav visible by default.
    topNav.classList.add('top-nav--visible');
    if (chatbotContainer) {
        chatbotContainer.classList.add('chatbot-container--visible');
    }
}

// --- Fade-in sections on scroll ---
const sectionsToFade = document.querySelectorAll('.fade-in-section');

const observerOptions = {
    root: null, // relative to the viewport
    rootMargin: '0px',
    threshold: 0.1 // Trigger when 10% of the section is visible
};

const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

sectionsToFade.forEach(section => {
    observer.observe(section);
});

// --- Animate Logo on Scroll ---
const logoContainer = document.querySelector('.logo-container');
if (heroSection && logoContainer) {
    function animateLogo() {
        // Add the scrolled class after scrolling a small amount (e.g., 50px)
        if (window.pageYOffset > 50) {
            logoContainer.classList.add('logo-container--scrolled');
        } else {
            logoContainer.classList.remove('logo-container--scrolled');
        }
    }

    window.addEventListener('scroll', animateLogo);
}
