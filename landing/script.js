(function () {
  const countdownEl = document.getElementById('countdown');
  const bidEl = document.getElementById('current-bid');
  const header = document.querySelector('.header');
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  const form = document.getElementById('waitlist-form');
  const formSuccess = document.getElementById('form-success');
  const bidBtn = document.querySelector('.btn-bid');

  let totalSeconds = 2 * 3600 + 14 * 60 + 37;
  let currentBid = 420;

  function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
  }

  setInterval(() => {
    if (totalSeconds > 0) {
      totalSeconds -= 1;
      countdownEl.textContent = formatTime(totalSeconds);
    }
  }, 1000);

  bidBtn?.addEventListener('click', () => {
    currentBid += 10;
    bidEl.textContent = `${currentBid} zł`;
    bidEl.style.transform = 'scale(1.08)';
    setTimeout(() => {
      bidEl.style.transform = 'scale(1)';
    }, 200);
  });

  bidEl.style.transition = 'transform 0.2s ease';

  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  });

  menuToggle?.addEventListener('click', () => {
    const expanded = nav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(expanded));
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    form.hidden = true;
    formSuccess.hidden = false;
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.step, .feature-card, .category').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
})();
