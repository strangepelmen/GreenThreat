let plantsData = [];
let currentStep = 1;
const userSelections = { type: null, season: null, habitat: null, features: [] };
let gsapReady = false;
let scrollObserver = null;
let statCountersInitialized = false;
let modalListenersBound = false;
let lastFocusedElement = null;

function waitForGSAP() {
    return new Promise((resolve) => {
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
            gsapReady = true;
            resolve();
        } else {
            const check = setInterval(() => {
                if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
                    gsap.registerPlugin(ScrollTrigger);
                    gsapReady = true;
                    clearInterval(check);
                    resolve();
                }
            }, 50);
            setTimeout(() => { clearInterval(check); resolve(); }, 3000);
        }
    });
}

async function loadPlantsData() {
    try {
        const response = await fetch('data.json');
        plantsData = await response.json();
    } catch (error) {
        plantsData = [];
    }
    await waitForGSAP();
    initializeApp();
}

function parseHash() {
    const raw = window.location.hash.substring(1);
    if (!raw) return { pageId: 'home', filter: null };
    const [pageId, query] = raw.split('?');
    let filter = null;
    if (query) {
        const params = new URLSearchParams(query);
        filter = params.get('filter');
    }
    const validPages = ['home', 'catalog', 'identifier', 'action', 'about'];
    return {
        pageId: validPages.includes(pageId) ? pageId : 'home',
        filter
    };
}

function applyCatalogFilter(filter) {
    const filterTags = document.querySelectorAll('.filter-tag');
    filterTags.forEach(t => t.classList.remove('active'));
    const filterTag = document.querySelector(`.filter-tag[data-filter="${filter}"]`);
    if (filterTag) {
        filterTag.classList.add('active');
        refreshCatalogView();
        setTimeout(() => setupScrollReveal(), 50);
    }
}

function initializeApp() {
    updateDynamicStats();
    setupTheme();
    setupNavigation();
    setupMobileNav();
    setupHeaderThemeToggle();
    setupModalListeners();
    renderPlantCatalog();
    setupCatalogFilters();
    setupIdentifier();
    setupActionTabs();
    initializeFooter();
    setupButtonListeners();
    setupScrollReveal();
    setupNavbarScroll();
    setupSpotlightCards();
    animateHeroEntrance();
    animateSVGPaths();
    setupStatCounters();
    setupParallax();

    const { pageId, filter } = parseHash();
    if (filter && pageId === 'catalog') {
        document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
        const filterTag = document.querySelector(`.filter-tag[data-filter="${filter}"]`);
        if (filterTag) filterTag.classList.add('active');
    }
    showPage(pageId);
}

function updateDynamicStats() {
    const types = new Set(plantsData.map(p => p.type));
    const dangerLevels = new Set(plantsData.map(p => p.dangerLevel));
    const methodCount = plantsData.reduce((sum, p) => sum + (p.controlMethods?.length || 0), 0);

    const statMap = {
        plants: plantsData.length,
        'danger-levels': dangerLevels.size,
        methods: methodCount,
        types: types.size
    };

    document.querySelectorAll('.stat-number[data-stat]').forEach(el => {
        const key = el.dataset.stat;
        if (statMap[key] !== undefined) {
            el.dataset.target = statMap[key];
            if (key === 'methods' && statMap[key] >= 30) {
                el.dataset.suffix = '+';
            } else if (key === 'methods') {
                delete el.dataset.suffix;
            }
            el.textContent = '0';
        }
    });
}

function setupTheme() {
    const desktopThemeSwitch = document.getElementById('desktopThemeSwitch');
    const mobileThemeSwitch = document.getElementById('mobileThemeSwitch');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDark.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }

    function toggleTheme(e) {
        e.stopPropagation();
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeColor(newTheme);
    }

    function updateThemeColor(theme) {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.content = theme === 'dark' ? '#0F1A14' : '#1B3A2D';
    }

    updateThemeColor(document.documentElement.getAttribute('data-theme') || 'light');

    desktopThemeSwitch?.addEventListener('click', toggleTheme);
    mobileThemeSwitch?.addEventListener('click', toggleTheme);

    prefersDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const theme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            updateThemeColor(theme);
        }
    });
}

function setupNavbarScroll() {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    function onScroll() {
        const scrollY = window.scrollY;
        if (scrollY > 20) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        lastScroll = scrollY;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

function setupMobileNav() {
    document.querySelectorAll('.bottom-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (navigator.vibrate) navigator.vibrate(10);
            showPage(link.dataset.page);
        });
    });
}

function setupHeaderThemeToggle() {
    const toggles = document.querySelectorAll('.nav-theme-btn');
    toggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            const meta = document.querySelector('meta[name="theme-color"]');
            if (meta) meta.content = newTheme === 'dark' ? '#0F1A14' : '#1B3A2D';
        });
    });
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navOverlay = document.getElementById('navOverlay');
    const navLogo = document.querySelector('.nav-logo');

    function toggleMenu() {
        const isActive = navMenu.classList.contains('active');
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        navOverlay.classList.toggle('active');
        navToggle.setAttribute('aria-expanded', !isActive);
        document.body.style.overflow = !isActive ? 'hidden' : '';
    }

    navToggle.addEventListener('click', toggleMenu);
    navOverlay.addEventListener('click', toggleMenu);

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.innerWidth <= 768 && navMenu.classList.contains('active')) {
                toggleMenu();
            }
            showPage(link.getAttribute('href').substring(1));
        });
    });

    if (navLogo) {
        navLogo.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('home');
        });
    }

    window.addEventListener('hashchange', () => {
        const { pageId, filter } = parseHash();
        const currentPage = document.querySelector('.page.active');
        if (currentPage?.id === pageId) {
            if (filter && pageId === 'catalog') applyCatalogFilter(filter);
            return;
        }
        showPage(pageId);
        if (filter && pageId === 'catalog') {
            setTimeout(() => applyCatalogFilter(filter), 100);
        }
    });
}

function setupButtonListeners() {
    document.querySelector('.catalog-link').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('catalog');
    });

    document.querySelector('.identifier-link').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('identifier');
    });

    document.querySelector('.critical-link').addEventListener('click', (e) => {
        e.preventDefault();
        applyCatalogFilter('critical');
        showPage('catalog');
    });

    document.querySelector('.identify-link').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('identifier');
    });

    document.querySelector('.report-link').addEventListener('click', (e) => {
        e.preventDefault();
        showPage('action');
    });
}

const PAGE_ORDER = ['home', 'catalog', 'identifier', 'action', 'about'];

function showPage(pageId) {
    const currentPage = document.querySelector('.page.active');
    const targetPage = document.getElementById(pageId);
    if (!targetPage || currentPage === targetPage) return;

    const isInitial = !currentPage;

    const currentIdx = currentPage ? PAGE_ORDER.indexOf(currentPage.id) : -1;
    const targetIdx = PAGE_ORDER.indexOf(pageId);
    const slideRight = currentIdx >= 0 && targetIdx > currentIdx;

    if (currentPage) {
        const exitOffset = slideRight ? '-30px' : '30px';
        currentPage.style.opacity = '0';
        currentPage.style.transform = `translateX(${exitOffset})`;
        currentPage.style.transition = 'opacity 0.25s var(--ease-out), transform 0.25s var(--ease-out)';
        setTimeout(() => {
            currentPage.classList.remove('active');
            currentPage.style.opacity = '';
            currentPage.style.transform = '';
            currentPage.style.transition = '';
        }, 250);
    }

    setTimeout(() => {
        targetPage.classList.add('active');

        if (!isInitial) {
            const enterOffset = slideRight ? '30px' : '-30px';
            targetPage.style.opacity = '0';
            targetPage.style.transform = `translateX(${enterOffset})`;
            requestAnimationFrame(() => {
                targetPage.style.transition = 'opacity 0.35s var(--ease-out), transform 0.35s var(--ease-out)';
                targetPage.style.opacity = '1';
                targetPage.style.transform = 'translateX(0)';
                setTimeout(() => {
                    targetPage.style.opacity = '';
                    targetPage.style.transform = '';
                    targetPage.style.transition = '';
                }, 350);
            });
        }

        if (window.location.hash !== `#${pageId}`) {
            history.replaceState(null, '', `#${pageId}`);
        }

        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.remove('active');
            if (l.getAttribute('href') === `#${pageId}`) l.classList.add('active');
        });

        document.querySelectorAll('.bottom-nav-link').forEach(l => {
            l.classList.remove('active');
            if (l.dataset.page === pageId) l.classList.add('active');
        });

        if (pageId === 'catalog') refreshCatalogView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => {
            setupScrollReveal();
            if (pageId === 'home') {
                animateSVGPaths();
                setupStatCounters();
            }
        }, 100);
    }, currentPage ? 250 : 0);
}

function setupScrollReveal() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
        document.querySelectorAll('.reveal-up').forEach(el => {
            el.classList.add('revealed');
        });
        return;
    }

    if (scrollObserver) scrollObserver.disconnect();

    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const parent = el.parentElement;
                const siblings = parent ? Array.from(parent.querySelectorAll('.reveal-up')) : [el];
                const idx = siblings.indexOf(el);
                const delay = idx * 80;
                setTimeout(() => {
                    el.classList.add('revealed');
                }, delay);
                scrollObserver.unobserve(el);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal-up:not(.revealed)').forEach(el => {
        scrollObserver.observe(el);
    });
}

function animateHeroEntrance() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const heroElements = document.querySelectorAll('#home .reveal-up');

    if (prefersReduced || !gsapReady) {
        heroElements.forEach(el => el.classList.add('revealed'));
        return;
    }

    gsap.fromTo(heroElements,
        { opacity: 0, y: 30 },
        {
            opacity: 1, y: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
            delay: 0.2,
            onComplete: function() {
                heroElements.forEach(el => el.classList.add('revealed'));
            }
        }
    );
}

function animateSVGPaths() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paths = document.querySelectorAll('.draw-path');
    const circles = document.querySelectorAll('.draw-circle');

    if (prefersReduced || !gsapReady) {
        paths.forEach(p => { p.style.strokeDashoffset = '0'; });
        circles.forEach(c => { c.style.strokeDashoffset = '0'; });
        return;
    }

    paths.forEach((path, i) => {
        const length = path.getTotalLength ? path.getTotalLength() : 1000;
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        gsap.to(path, {
            strokeDashoffset: 0,
            duration: 1.5 + (i * 0.15),
            ease: 'power2.out',
            delay: 0.3 + (i * 0.1)
        });
    });

    circles.forEach((circle, i) => {
        const radius = parseFloat(circle.getAttribute('r')) || 10;
        const circumference = 2 * Math.PI * radius;
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = circumference;
        gsap.to(circle, {
            strokeDashoffset: 0,
            duration: 1,
            ease: 'power2.out',
            delay: 1.2 + (i * 0.2)
        });
    });
}

function setupStatCounters() {
    if (statCountersInitialized) return;
    statCountersInitialized = true;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const statNumbers = document.querySelectorAll('#home .stat-number[data-target]');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                const suffix = el.dataset.suffix || '';

                if (prefersReduced || !gsapReady) {
                    el.textContent = target + suffix;
                    observer.unobserve(el);
                    return;
                }

                const obj = { val: 0 };
                gsap.to(obj, {
                    val: target,
                    duration: 1.5,
                    ease: 'power2.out',
                    onUpdate: function() {
                        el.textContent = Math.round(obj.val) + suffix;
                    },
                    onComplete: function() {
                        el.textContent = target + suffix;
                    }
                });
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    statNumbers.forEach(el => observer.observe(el));
}

function setupSpotlightCards() {
    document.querySelectorAll('.bento-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            card.style.setProperty('--mouse-x', `${x}%`);
            card.style.setProperty('--mouse-y', `${y}%`);
        });
    });
}

function renderPlantCatalog(filteredPlants = null) {
    const catalogContainer = document.getElementById('plantCatalog');
    const noResults = document.getElementById('noResults');
    const plantsToRender = filteredPlants || plantsData;

    catalogContainer.innerHTML = '';

    if (plantsToRender.length === 0) {
        catalogContainer.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    catalogContainer.style.display = 'grid';
    noResults.style.display = 'none';

    plantsToRender.forEach((plant, index) => {
        const plantCard = createPlantCard(plant, index);
        catalogContainer.appendChild(plantCard);
    });

    document.querySelectorAll('.plant-card').forEach(card => {
        card.addEventListener('click', function() {
            showPlantDetails(this.dataset.id);
        });
    });

    setTimeout(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

        document.querySelectorAll('.plant-card.reveal-up:not(.revealed)').forEach(el => {
            observer.observe(el);
        });
    }, 50);
}

function createPlantCard(plant, index = 0) {
    const card = document.createElement('div');
    card.className = 'plant-card reveal-up';
    card.dataset.id = plant.id;
    card.style.transitionDelay = `${index * 60}ms`;

    let dangerClass = '';
    let dangerText = '';
    switch(plant.dangerLevel) {
        case 'critical': dangerClass = 'badge-critical'; dangerText = 'Critical'; break;
        case 'dangerous': dangerClass = 'badge-dangerous'; dangerText = 'Dangerous'; break;
        case 'watch': dangerClass = 'badge-watch'; dangerText = 'Watch'; break;
        case 'moderate': dangerClass = 'badge-moderate'; dangerText = 'Moderate'; break;
        case 'low': dangerClass = 'badge-low'; dangerText = 'Low'; break;
    }

    let typeText = '';
    switch(plant.type) {
        case 'tree': typeText = 'Tree'; break;
        case 'shrub': typeText = 'Shrub'; break;
        case 'herb': typeText = 'Herb'; break;
        case 'vine': typeText = 'Vine'; break;
    }

    const imageSrc = plant.image || '';

    card.innerHTML = `
        <div class="plant-image">
            <img src="${imageSrc}" alt="${plant.name}" loading="lazy">
            <div class="image-loading">Loading</div>
        </div>
        <div class="plant-content">
            <div class="plant-header">
                <div class="plant-name">${plant.name}</div>
                <div class="danger-badge ${dangerClass}">${dangerText}</div>
            </div>
            <div class="plant-latin">${plant.latinName}</div>
            <div class="plant-lifeform">${typeText}</div>
            <p class="plant-description">${plant.description}</p>
            <div class="plant-features">
                <span class="plant-feature">${plant.floweringSeason}</span>
                <span class="plant-feature">${getHabitatText(plant.habitat)}</span>
            </div>
            <div class="plant-card-footer">
                <span>Learn more</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </div>
        </div>
    `;

    const img = card.querySelector('img');
    const loading = card.querySelector('.image-loading');

    if (imageSrc) {
        img.onload = () => {
            loading.style.display = 'none';
            img.classList.add('loaded');
        };
        img.onerror = () => {
            loading.textContent = 'Image unavailable';
            img.style.display = 'none';
        };
    } else {
        loading.textContent = plant.emoji || 'No image';
        img.style.display = 'none';
    }

    return card;
}

function getHabitatText(habitat) {
    switch(habitat) {
        case 'wasteland': return 'Wasteland';
        case 'forest': return 'Forest/Park';
        case 'water': return 'Waterfront';
        case 'lawn':
        case 'roadside': return 'Lawn/Roadside';
        default: return habitat;
    }
}

function habitatMatches(selection, plantHabitat) {
    if (!selection) return false;
    if (selection === plantHabitat) return true;
    if (selection === 'lawn' && plantHabitat === 'roadside') return true;
    if (selection === 'roadside' && plantHabitat === 'lawn') return true;
    return false;
}

function setupModalListeners() {
    if (modalListenersBound) return;
    modalListenersBound = true;

    const modal = document.getElementById('plantModal');
    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);

    modal.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' || !modal.classList.contains('active')) return;
        const focusable = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });
}

function showPlantDetails(plantId) {
    const plant = plantsData.find(p => p.id === plantId);
    if (!plant) return;

    const modal = document.getElementById('plantModal');
    const modalContent = document.getElementById('plantModalContent');

    let dangerClass = '';
    let dangerText = '';
    switch(plant.dangerLevel) {
        case 'critical': dangerClass = 'badge-critical'; dangerText = 'Critical Danger'; break;
        case 'dangerous': dangerClass = 'badge-dangerous'; dangerText = 'Dangerous Species'; break;
        case 'watch': dangerClass = 'badge-watch'; dangerText = 'Requires Monitoring'; break;
        case 'moderate': dangerClass = 'badge-moderate'; dangerText = 'Moderate Danger'; break;
        case 'low': dangerClass = 'badge-low'; dangerText = 'Low Danger'; break;
    }

    let typeText = '';
    switch(plant.type) {
        case 'tree': typeText = 'Tree'; break;
        case 'shrub': typeText = 'Shrub'; break;
        case 'herb': typeText = 'Herb'; break;
        case 'vine': typeText = 'Vine'; break;
    }

    const imageSrc = plant.image || '';
    const methodsHTML = plant.controlMethods ? plant.controlMethods.map(method => {
        return `<span class="method-tag ${method.type}">${method.name}</span>`;
    }).join('') : '';

    modalContent.innerHTML = `
        <div class="plant-details">
            <div class="plant-details-header">
                <div class="plant-details-name">
                    <h2>${plant.name}</h2>
                    <div class="plant-details-latin">${plant.latinName}</div>
                </div>
                <div class="danger-badge ${dangerClass}">${dangerText}</div>
            </div>
            <div class="plant-details-content">
                <div class="plant-gallery">
                    <div class="gallery-main">
                        ${imageSrc ? `<img src="${imageSrc}" alt="Photo: ${plant.name}" loading="lazy">` : `<div class="image-loading">${plant.emoji || 'No image'}</div>`}
                    </div>
                </div>
                <div class="plant-info">
                    <div class="details-section">
                        <h3>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                            General Information
                        </h3>
                        <ul class="details-list">
                            <li><strong>Life form:</strong> ${typeText}</li>
                            <li><strong>Origin:</strong> ${plant.origin}</li>
                            <li><strong>Flowering:</strong> ${plant.floweringSeason}</li>
                            <li><strong>Habitat:</strong> ${getHabitatText(plant.habitat)}</li>
                        </ul>
                    </div>
                    <div class="details-section">
                        <h3>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 22h20L12 2z"/><path d="M12 10v4M12 18v1"/></svg>
                            Danger and Impact
                        </h3>
                        <ul class="details-list">
                            <li><strong>Ecosystem:</strong> ${plant.ecosystemImpact}</li>
                            <li><strong>Human danger:</strong> ${plant.humanDanger}</li>
                            <li><strong>Spread:</strong> ${plant.spreadWays}</li>
                        </ul>
                    </div>
                    <div class="details-section">
                        <h3>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
                            Control Methods
                        </h3>
                        <div class="method-tags">${methodsHTML}</div>
                        <p>${plant.controlDescription || 'Combining methods increases control effectiveness.'}</p>
                    </div>
                    <div class="details-section">
                        <h3>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            How to Identify
                        </h3>
                        <p>${plant.identificationTips || 'See photos for accurate identification.'}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    lastFocusedElement = document.activeElement;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    const img = modalContent.querySelector('img');
    if (img) {
        img.onload = () => {
            img.classList.add('loaded');
            img.style.opacity = '1';
        };
        if (img.complete) img.onload();
    }

    requestAnimationFrame(() => {
        modal.querySelector('.modal-close')?.focus();
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('plantModal');
        if (modal.classList.contains('active')) closeModal();
    }
});

function closeModal() {
    const modal = document.getElementById('plantModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
    lastFocusedElement = null;
}

function refreshCatalogView() {
    const searchInput = document.getElementById('plantSearch');
    const searchClear = document.getElementById('searchClear');
    if (!searchInput) {
        renderPlantCatalog();
        return;
    }

    const searchTerm = searchInput.value.toLowerCase();
    const activeFilter = document.querySelector('.filter-tag.active')?.dataset.filter || 'all';

    const filteredPlants = plantsData.filter(plant => {
        const matchesSearch = !searchTerm ||
            plant.name.toLowerCase().includes(searchTerm) ||
            plant.latinName.toLowerCase().includes(searchTerm) ||
            plant.description.toLowerCase().includes(searchTerm);

        let matchesFilter = false;
        if (activeFilter === 'all') {
            matchesFilter = true;
        } else if (activeFilter === 'critical') {
            matchesFilter = plant.dangerLevel === 'critical';
        } else {
            matchesFilter = plant.type === activeFilter;
        }

        return matchesSearch && matchesFilter;
    });

    renderPlantCatalog(filteredPlants);
    if (searchClear) searchClear.style.display = searchTerm ? 'block' : 'none';
}

function setupCatalogFilters() {
    const searchInput = document.getElementById('plantSearch');
    const searchClear = document.getElementById('searchClear');
    const filterTags = document.querySelectorAll('.filter-tag');

    function applyFilters() {
        refreshCatalogView();
        setTimeout(() => setupScrollReveal(), 50);
    }

    searchInput.addEventListener('input', applyFilters);

    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.style.display = 'none';
        applyFilters();
        searchInput.focus();
    });

    filterTags.forEach(tag => {
        tag.addEventListener('click', function() {
            filterTags.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            applyFilters();
        });
    });
}

function setupIdentifier() {
    const nextButton = document.getElementById('nextStep');
    const prevButton = document.getElementById('prevStep');
    const resetButton = document.getElementById('resetIdentifier');
    const progressFill = document.getElementById('progressFill');
    const stepPanels = document.querySelectorAll('.step-panel');
    const optionCards = document.querySelectorAll('.option-card');

    function initializeIdentifier() {
        currentStep = 1;
        userSelections.type = null;
        userSelections.season = null;
        userSelections.habitat = null;
        userSelections.features = [];
        updateStepIndicator();
        updateButtons();
        resetOptionSelections();
    }

    function updateStepIndicator() {
        const progressSteps = document.querySelectorAll('.progress-step');
        progressFill.style.width = `${(currentStep - 1) * 25}%`;

        progressSteps.forEach(step => {
            const stepNum = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNum === currentStep);
            step.classList.toggle('completed', stepNum < currentStep);
        });

        stepPanels.forEach(panel => panel.classList.remove('active'));
        document.getElementById(`step${currentStep}`).classList.add('active');
    }

    function updateButtons() {
        prevButton.disabled = currentStep === 1;
        prevButton.setAttribute('aria-disabled', currentStep === 1);

        if (currentStep === 5) {
            nextButton.style.display = 'none';
            nextButton.disabled = true;
            identifyPlants();
        } else {
            nextButton.style.display = 'inline-flex';
            const complete = isStepComplete(currentStep);
            nextButton.disabled = !complete;
            nextButton.setAttribute('aria-disabled', !complete);
        }
    }

    function isStepComplete(step) {
        switch(step) {
            case 1: return userSelections.type !== null;
            case 2: return userSelections.season !== null;
            case 3: return userSelections.habitat !== null;
            case 4: return userSelections.features.length > 0;
            default: return true;
        }
    }

    function resetOptionSelections() {
        optionCards.forEach(card => card.classList.remove('selected'));
    }

    optionCards.forEach(card => {
        card.addEventListener('click', function() {
            const step = currentStep;
            const value = this.dataset.value;

            if (step === 4) {
                this.classList.toggle('selected');
                const index = userSelections.features.indexOf(value);
                if (index === -1) {
                    userSelections.features.push(value);
                } else {
                    userSelections.features.splice(index, 1);
                }
            } else {
                const currentSelected = document.querySelector(`#step${step} .option-card.selected`);
                if (currentSelected) currentSelected.classList.remove('selected');
                this.classList.add('selected');
                switch(step) {
                    case 1: userSelections.type = value; break;
                    case 2: userSelections.season = value; break;
                    case 3: userSelections.habitat = value; break;
                }
            }
            updateButtons();
        });
    });

    nextButton.addEventListener('click', () => {
        if (currentStep < 5 && isStepComplete(currentStep)) {
            currentStep++;
            updateStepIndicator();
            updateButtons();
            window.scrollTo({ top: document.querySelector('.identifier-content').offsetTop - 100, behavior: 'smooth' });
        }
    });

    prevButton.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateStepIndicator();
            updateButtons();
            window.scrollTo({ top: document.querySelector('.identifier-content').offsetTop - 100, behavior: 'smooth' });
        }
    });

    resetButton.addEventListener('click', initializeIdentifier);

    function identifyPlants() {
        const resultsContainer = document.getElementById('identificationResults');

        const matchedPlants = plantsData.map(plant => {
            let score = 0;

            if (userSelections.type && plant.type === userSelections.type) score += 3;

            if (userSelections.season) {
                const floweringSeasons = plant.floweringSeason.toLowerCase();
                const seasonMonths = {
                    spring: ['march', 'april', 'may'],
                    summer: ['june', 'july', 'august'],
                    autumn: ['september', 'october', 'november'],
                    winter: ['december', 'january', 'february', 'march']
                };
                const months = seasonMonths[userSelections.season] || [];
                if (months.some(m => floweringSeasons.includes(m))) score += 2;
            }

            if (habitatMatches(userSelections.habitat, plant.habitat)) score += 2;

            if (userSelections.features.length > 0) {
                const plantFeatures = plant.features || [];
                const matchedFeatures = userSelections.features.filter(f => plantFeatures.includes(f));
                score += matchedFeatures.length;
            }

            return { plant, score };
        }).filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 6);

        if (matchedPlants.length > 0 && matchedPlants.length < 3) {
            const additionalPlants = plantsData
                .filter(p => !matchedPlants.some(mp => mp.plant.id === p.id))
                .slice(0, 3 - matchedPlants.length)
                .map(plant => ({ plant, score: 1 }));
            matchedPlants.push(...additionalPlants);
        }

        if (matchedPlants.length === 0) {
            resultsContainer.innerHTML = `
                <div class="no-match-found">
                    <div class="no-match-icon">No matches</div>
                    <h3>No Matching Plants Found</h3>
                    <p>No plants matching your criteria were found in our database.</p>
                    <p>You may have discovered a rare species or the criteria are too specific.</p>
                    <ul>
                        <li>Try adjusting your search criteria</li>
                        <li>Use fewer features for a broader search</li>
                        <li>Consult specialists for accurate identification</li>
                    </ul>
                    <button class="btn btn-primary" id="tryAgainBtn" style="margin-top: 1rem;">
                        <span>Try Again</span>
                    </button>
                </div>
            `;

            document.getElementById('tryAgainBtn')?.addEventListener('click', () => {
                currentStep = 1;
                initializeIdentifier();
                window.scrollTo({ top: document.querySelector('.identifier-container').offsetTop - 100, behavior: 'smooth' });
            });
        } else {
            resultsContainer.innerHTML = matchedPlants.map(({ plant, score }) => `
                <div class="plant-card" data-id="${plant.id}">
                    <div class="plant-image">
                        <img src="${plant.image || ''}" alt="${plant.name}" loading="lazy">
                        <div class="image-loading">Loading</div>
                    </div>
                    <div class="plant-content">
                        <div class="plant-header">
                            <div class="plant-name">${plant.name}</div>
                            <div class="danger-badge ${getDangerClass(plant.dangerLevel)}">${getDangerText(plant.dangerLevel)}</div>
                        </div>
                        <div class="plant-latin">${plant.latinName}</div>
                        <div class="plant-lifeform">${getTypeText(plant.type)}</div>
                        <p class="plant-description">${plant.description}</p>
                        <div class="plant-features">
                            <span class="plant-feature">Match: ${score} points</span>
                        </div>
                        <div class="plant-card-footer">
                            <span>Learn more</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                        </div>
                    </div>
                </div>
            `).join('');

            resultsContainer.querySelectorAll('.plant-card img').forEach(img => {
                img.onload = () => {
                    img.classList.add('loaded');
                    const loading = img.parentElement.querySelector('.image-loading');
                    if (loading) loading.style.display = 'none';
                };
                img.onerror = () => {
                    const loading = img.parentElement.querySelector('.image-loading');
                    if (loading) {
                        loading.textContent = 'Image unavailable';
                        img.style.display = 'none';
                    }
                };
            });

            resultsContainer.querySelectorAll('.plant-card').forEach(card => {
                card.addEventListener('click', function() {
                    showPlantDetails(this.dataset.id);
                });
            });
        }
    }

    initializeIdentifier();
}

function getDangerClass(dangerLevel) {
    switch(dangerLevel) {
        case 'critical': return 'badge-critical';
        case 'dangerous': return 'badge-dangerous';
        case 'watch': return 'badge-watch';
        case 'moderate': return 'badge-moderate';
        case 'low': return 'badge-low';
        default: return '';
    }
}

function getDangerText(dangerLevel) {
    switch(dangerLevel) {
        case 'critical': return 'Critical';
        case 'dangerous': return 'Dangerous';
        case 'watch': return 'Watch';
        case 'moderate': return 'Moderate';
        case 'low': return 'Low';
        default: return '';
    }
}

function getTypeText(type) {
    switch(type) {
        case 'tree': return 'Tree';
        case 'shrub': return 'Shrub';
        case 'herb': return 'Herb';
        case 'vine': return 'Vine';
        default: return '';
    }
}

function setupActionTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}Content`) {
                    content.classList.add('active');
                }
            });
            setTimeout(() => setupScrollReveal(), 50);
        });
    });
}

function initializeFooter() {
    const footerHTML = `
        <div class="footer-content">
            <div class="footer-brand">
                <div class="footer-logo">
                    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                        <path d="M20 4C12 12, 6 22, 8 32C10 38, 16 40, 20 38C24 40, 30 38, 32 32C34 22, 28 12, 20 4Z" stroke="var(--color-primary)" stroke-width="1.5" fill="none"/>
                        <path d="M20 4L20 38" stroke="var(--color-primary)" stroke-width="1" opacity="0.6"/>
                    </svg>
                </div>
                <div class="footer-text">
                    <h4>Green Threat</h4>
                    <p>Invasive Plants Atlas</p>
                </div>
            </div>
            <div class="footer-links">
                <h5>Sections</h5>
                <ul>
                    <li><a href="#home">Home</a></li>
                    <li><a href="#catalog">Catalog</a></li>
                    <li><a href="#identifier">Identifier</a></li>
                    <li><a href="#action">Take Action</a></li>
                    <li><a href="#about">About</a></li>
                </ul>
            </div>
            <div class="footer-contact">
                <h5>Project</h5>
                <p>Open source project on GitHub</p>
                <div class="contact-info">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    <a href="https://github.com/strangepelmen/GreenThreat" target="_blank" rel="noopener noreferrer">GreenThreat on GitHub</a>
                </div>
                <div class="contact-info">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    <a href="https://github.com/strangepelmen" target="_blank" rel="noopener noreferrer">@strangepelmen</a>
                </div>
            </div>
        </div>
        <div class="footer-bottom">
            <p>${new Date().getFullYear()} Green Threat. Invasive Plants Atlas</p>
            <p>Hosted on GitHub Pages</p>
        </div>
    `;

    document.querySelectorAll('.site-footer').forEach(footer => {
        footer.innerHTML = footerHTML;
    });

    document.addEventListener('click', (e) => {
        const link = e.target.closest('.footer-links a');
        if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                showPage(href.substring(1));
            }
        }
    });
}

function setupParallax() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || window.innerWidth <= 1024) return;

    const leaves = document.querySelectorAll('.ambient-leaf');
    const heroSVG = document.querySelector('.hero-botanical');

    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        leaves.forEach((leaf, i) => {
            const factor = 8 + i * 4;
            leaf.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
        });

        if (heroSVG) {
            heroSVG.style.transform = `translate(${x * -6}px, ${y * -4}px)`;
        }
    }, { passive: true });
}

document.addEventListener('DOMContentLoaded', loadPlantsData);
