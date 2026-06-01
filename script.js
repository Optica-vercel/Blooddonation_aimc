const initApp = () => {

    // 1. Navbar Scroll Transition
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Mobile Nav Toggle
    const mobileToggle = document.getElementById('mobile-toggle');
    const navMenu = document.getElementById('nav-menu');

    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const icon = mobileToggle.querySelector('i');
        if (navMenu.classList.contains('active')) {
            icon.className = 'fa-solid fa-xmark';
        } else {
            icon.className = 'fa-solid fa-bars';
        }
    });

    // Close menu when link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            mobileToggle.querySelector('i').className = 'fa-solid fa-bars';
        });
    });

    // 3. Stats Counter Animation
    const stats = [
        { id: 'stat-donors', target: 900, suffix: '+' },
        { id: 'stat-lives', target: 95, suffix: '+' },
        { id: 'stat-drives', target: 1, suffix: '+', pad: true }
    ];

    const animateStats = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                stats.forEach(stat => {
                    const el = document.getElementById(stat.id);
                    if (!el) return;
                    
                    let current = 0;
                    const duration = 2000; // ms
                    const increment = stat.target / (duration / 16); // ~60fps
                    
                    const updateCounter = () => {
                        current += increment;
                        let rounded = Math.round(current >= stat.target ? stat.target : current);
                        let formatted = rounded.toLocaleString();
                        if (stat.pad && rounded < 10) {
                            formatted = '0' + formatted;
                        }
                        
                        el.textContent = formatted + stat.suffix;
                        
                        if (current < stat.target) {
                            requestAnimationFrame(updateCounter);
                        }
                    };
                    updateCounter();
                });
                observer.disconnect(); // Only animate once
            }
        });
    };

    const statsObserver = new IntersectionObserver(animateStats, {
        threshold: 0.3
    });

    const statsSection = document.getElementById('impact');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // 4. Eligibility Screening Quiz Logic
    const quizModal = document.getElementById('quiz-modal');
    const eligibilityBtn = document.getElementById('check-eligibility-btn');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const quizSteps = document.querySelectorAll('.quiz-step');
    const quizSuccess = document.getElementById('quiz-success');
    const quizFail = document.getElementById('quiz-fail');
    const quizRegisterBtn = document.getElementById('quiz-register-btn');
    const quizCloseBtn = document.getElementById('quiz-close-btn');

    // Open Modal
    if (eligibilityBtn) {
        eligibilityBtn.addEventListener('click', (e) => {
            e.preventDefault();
            resetQuiz();
            quizModal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Lock scroll
        });
    }

    // Close Modal Function
    const closeModal = () => {
        quizModal.classList.remove('active');
        document.body.style.overflow = 'auto'; // Unlock scroll
    };

    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (quizCloseBtn) quizCloseBtn.addEventListener('click', closeModal);

    if (quizRegisterBtn) {
        quizRegisterBtn.addEventListener('click', () => {
            closeModal();
            const contactSection = document.getElementById('contact');
            if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Close modal on click outside modal-card
    if (quizModal) {
        quizModal.addEventListener('click', (e) => {
            if (e.target === quizModal) {
                closeModal();
            }
        });
    }

    // Step navigation inside Quiz
    document.querySelectorAll('.quiz-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const currentStep = btn.closest('.quiz-step');
            currentStep.classList.remove('active');

            if (btn.classList.contains('yes')) {
                const nextStepVal = btn.dataset.next;
                if (nextStepVal === 'success') {
                    quizSuccess.classList.add('active');
                } else {
                    document.querySelector(`.quiz-step[data-step="${nextStepVal}"]`).classList.add('active');
                }
            } else if (btn.classList.contains('no')) {
                quizFail.classList.add('active');
            }
        });
    });

    const resetQuiz = () => {
        quizSteps.forEach(step => step.classList.remove('active'));
        const firstStep = document.querySelector('.quiz-step[data-step="1"]');
        if (firstStep) firstStep.classList.add('active');
    };

    // 5. Decorative Scroll Reveal (Simple Fade-in effect on scroll)
    const revealElements = document.querySelectorAll('.scroll-reveal');
    const revealOnScroll = () => {
        revealElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
            if (rect.top <= viewHeight * 0.85) {
                el.classList.add('active');
            }
        });
    };
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Trigger once on load
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
