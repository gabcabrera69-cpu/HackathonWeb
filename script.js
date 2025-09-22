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
let lastScrollY = window.pageYOffset;

window.addEventListener('scroll', () => {
    const currentScrollY = window.pageYOffset;

    if (currentScrollY > lastScrollY && currentScrollY > 50) {
        // Scrolling down
        topNav.classList.add('top-nav--hidden');
    } else {
        // Scrolling up or at the top
        topNav.classList.remove('top-nav--hidden');
    }
    lastScrollY = currentScrollY;
});
