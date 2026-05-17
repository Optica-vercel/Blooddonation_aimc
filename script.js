const initApp = () => {
    // Initialize Supabase Client
    const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

    // 1. Fetch live urgent requirements
    const fetchUrgentRequirements = async () => {
        if (!supabase) return;
        const { data, error } = await supabase
            .from('urgent_requirements')
            .select('*')
            .order('is_urgent', { ascending: false })
            .order('units_needed', { ascending: false });
        
        if (error) {
            console.error('Error fetching urgent requirements:', error);
            return;
        }

        const urgentGrid = document.querySelector('.blood-types-grid');
        if (urgentGrid) {
            urgentGrid.innerHTML = '';
            // Only show up to 4 elements
            data.slice(0, 4).forEach(req => {
                const badge = document.createElement('div');
                badge.className = `blood-type-badge ${req.is_urgent ? 'urgent' : ''}`;
                badge.innerHTML = `${req.blood_group} <span class="req">Need ${req.units_needed} unit${req.units_needed > 1 ? 's' : ''}</span>`;
                urgentGrid.appendChild(badge);
            });
        }
    };
    fetchUrgentRequirements();

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
        { id: 'stat-donors', target: 1240, suffix: '+' },
        { id: 'stat-lives', target: 3890, suffix: '+' },
        { id: 'stat-drives', target: 45, suffix: '+' }
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
                        if (current >= stat.target) {
                            el.textContent = Math.round(stat.target).toLocaleString() + stat.suffix;
                        } else {
                            el.textContent = Math.round(current).toLocaleString() + stat.suffix;
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
    eligibilityBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetQuiz();
        quizModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock scroll
    });

    // Close Modal Function
    const closeModal = () => {
        quizModal.classList.remove('active');
        document.body.style.overflow = 'auto'; // Unlock scroll
    };

    modalCloseBtn.addEventListener('click', closeModal);
    quizCloseBtn.addEventListener('click', closeModal);

    quizRegisterBtn.addEventListener('click', () => {
        closeModal();
        document.getElementById('register').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
            document.getElementById('reg-name').focus();
        }, 800);
    });

    // Close modal on click outside modal-card
    quizModal.addEventListener('click', (e) => {
        if (e.target === quizModal) {
            closeModal();
        }
    });

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
        document.querySelector('.quiz-step[data-step="1"]').classList.add('active');
    };

    // 5. Toast Notification System
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    const showToast = (message, isSuccess = true) => {
        toastMessage.textContent = message;
        const icon = toast.querySelector('.toast-icon');
        
        if (isSuccess) {
            icon.className = 'fa-solid fa-circle-check toast-icon';
            toast.style.borderLeftColor = '#10B981';
        } else {
            icon.className = 'fa-solid fa-circle-xmark toast-icon';
            toast.style.borderLeftColor = '#EF4444';
        }
        
        toast.classList.add('active');
        
        setTimeout(() => {
            toast.classList.remove('active');
        }, 4000);
    };

    // 6. Interactive Registration Form Submission
    const registrationForm = document.getElementById('donor-registration-form');
    registrationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value;
        const blood = document.getElementById('reg-blood').value;
        const phone = document.getElementById('reg-phone').value;
        const batch = document.getElementById('reg-year').value;
        
        const btn = registrationForm.querySelector('button[type="submit"]');
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Saving to Network...';
        
        if (supabase) {
            const { error } = await supabase
                .from('donor_registrations')
                .insert([{
                    full_name: name,
                    blood_group: blood,
                    phone: phone,
                    academic_batch: batch
                }]);
            
            btn.disabled = false;
            btn.innerHTML = originalContent;

            if (error) {
                showToast(`Failed to register: ${error.message}`, false);
                return;
            }

            showToast(`Thank you ${name}! You are registered as an active ${blood} donor.`, true);
            registrationForm.reset();
        } else {
            // Fallback for demo
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalContent;
                showToast(`Demo Mode: Thank you ${name}! Registered as an active ${blood} donor.`, true);
                registrationForm.reset();
            }, 1000);
        }
    });

    // 7. Interactive Emergency Blood Request Form Submission
    const requestForm = document.getElementById('blood-request-form');
    requestForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const patient = document.getElementById('req-patient').value;
        const blood = document.getElementById('req-blood-group').value;
        const units = parseInt(document.getElementById('req-units').value);
        const contact = document.getElementById('req-contact').value;
        
        const btn = requestForm.querySelector('button[type="submit"]');
        const originalContent = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Dispatching Broadcast...';
        
        if (supabase) {
            const { error } = await supabase
                .from('blood_requests')
                .insert([{
                    patient_description: patient,
                    blood_group: blood,
                    units_needed: units,
                    contact_number: contact
                }]);
            
            btn.disabled = false;
            btn.innerHTML = originalContent;

            if (error) {
                showToast(`Failed to dispatch request: ${error.message}`, false);
                return;
            }

            showToast(`Emergency Broadcast dispatched for ${units} units of ${blood}!`, true);
            fetchUrgentRequirements(); // Reload live list immediately
            requestForm.reset();
        } else {
            // Fallback for demo
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = originalContent;
                showToast(`Demo Mode: Emergency Broadcast dispatched for ${units} units of ${blood}!`, true);
                requestForm.reset();
            }, 1000);
        }
    });

    // Decorative Scroll Reveal (Simple Fade-in effect on scroll)
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
