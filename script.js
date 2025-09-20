// --- Website Navigation Logic ---
const sections = document.querySelectorAll('main [id]');
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveSection() {
    let current = '';
    const scrollPosition = window.pageYOffset + window.innerHeight / 3;

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


