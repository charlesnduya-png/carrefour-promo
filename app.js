// ─── Config ───────────────────────────────────────────────────────────────────
// WhatsApp group invite — JantaConnection
const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/GtaDYdVWGjJF8u9yJDkyVQ';

const DEALS = [
  {
    name: 'Fresh Milk 1L',
    emoji: '🥛',
    category: 'dairy',
    price: 129,
    oldPrice: 189,
    discount: '-32%',
  },
  {
    name: 'Chicken Breast 1kg',
    emoji: '🍗',
    category: 'meat',
    price: 649,
    oldPrice: 949,
    discount: '-32%',
  },
  {
    name: 'Mixed Vegetables',
    emoji: '🥦',
    category: 'produce',
    price: 249,
    oldPrice: 399,
    discount: '-38%',
  },
  {
    name: 'Potato Chips 200g',
    emoji: '🍟',
    category: 'snacks',
    price: 99,
    oldPrice: 179,
    discount: '-45%',
  },
  {
    name: 'Olive Oil 500ml',
    emoji: '🫒',
    category: 'snacks',
    price: 449,
    oldPrice: 679,
    discount: '-34%',
  },
  {
    name: 'Fresh Bread Loaf',
    emoji: '🍞',
    category: 'dairy',
    price: 79,
    oldPrice: 119,
    discount: '-34%',
  },
];

const PRIZES = [
  { name: '20% OFF Voucher', desc: 'On your next purchase over KSh 3,000', weight: 25, color: '#004e9f' },
  { name: 'Free Coffee', desc: 'At any Carrefour café', weight: 20, color: '#e5002b' },
  { name: 'KSh 500 Gift Card', desc: 'Redeemable in-store today', weight: 15, color: '#f5a623' },
  { name: 'Free Bag', desc: 'Eco-friendly reusable tote', weight: 15, color: '#25d366' },
  { name: '10% OFF Groceries', desc: 'Valid on all fresh produce', weight: 15, color: '#7c3aed' },
  { name: 'Mystery Box', desc: 'Surprise items worth up to KSh 1,500', weight: 10, color: '#ec4899' },
];

// ─── State ────────────────────────────────────────────────────────────────────
let userPhone = '';
let hasSpun = false;
let isSpinning = false;
let currentRotation = 0;
let wonPrize = null;

// ─── DOM ──────────────────────────────────────────────────────────────────────
const dealsGrid = document.getElementById('deals-grid');
const phoneForm = document.getElementById('phone-form');
const phoneInput = document.getElementById('phone');
const phoneHint = document.getElementById('phone-hint');
const wheelArea = document.getElementById('wheel-area');
const userPhoneDisplay = document.getElementById('user-phone-display');
const wheelCanvas = document.getElementById('wheel-canvas');
const spinBtn = document.getElementById('spin-btn');
const winModal = document.getElementById('win-modal');
const modalPrizeName = document.getElementById('modal-prize-name');
const modalPrizeDesc = document.getElementById('modal-prize-desc');
const modalPrizeCode = document.getElementById('modal-prize-code');
const whatsappBtn = document.getElementById('whatsapp-btn');
const copyCodeBtn = document.getElementById('copy-code-btn');
const winnersCount = document.getElementById('winners-count');
const confettiEl = document.getElementById('confetti');
const lotterySection = document.getElementById('lottery-section');

const ctx = wheelCanvas.getContext('2d');

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  renderDeals();
  drawWheel();
  animateWinnersCount();
  bindEvents();
  initScrollAnimations();
  lotterySection.classList.add('is-visible');
}

function initScrollAnimations() {
  const sections = document.querySelectorAll('.animate-section');
  const steps = document.querySelectorAll('.steps__list li');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');

        if (entry.target.classList.contains('deals')) {
          entry.target.querySelectorAll('.deal-card').forEach((card, i) => {
            card.style.transitionDelay = `${i * 0.08}s`;
            card.classList.add('is-visible');
          });
        }

        if (entry.target.classList.contains('steps')) {
          steps.forEach((step, i) => {
            step.style.transitionDelay = `${i * 0.12}s`;
            step.classList.add('is-visible');
          });
        }

        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  sections.forEach((section) => {
    if (section.id !== 'lottery-section') observer.observe(section);
  });
}

function formatPrice(amount) {
  return `KSh ${amount.toLocaleString('en-KE')}`;
}

function renderDeals() {
  dealsGrid.innerHTML = DEALS.map((deal) => `
    <article class="deal-card">
      <div class="deal-card__img deal-card__img--${deal.category}">
        <span aria-hidden="true">${deal.emoji}</span>
        <span class="deal-card__badge">${deal.discount}</span>
      </div>
      <div class="deal-card__body">
        <div class="deal-card__name">${deal.name}</div>
        <div class="deal-card__prices">
          <span class="deal-card__price">${formatPrice(deal.price)}</span>
          <span class="deal-card__old">${formatPrice(deal.oldPrice)}</span>
        </div>
      </div>
    </article>
  `).join('');
}

function drawWheel() {
  const size = wheelCanvas.width;
  const center = size / 2;
  const radius = center - 4;
  const totalWeight = PRIZES.reduce((s, p) => s + p.weight, 0);
  let startAngle = -Math.PI / 2;

  ctx.clearRect(0, 0, size, size);

  PRIZES.forEach((prize, i) => {
    const sliceAngle = (prize.weight / totalWeight) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? prize.color : lightenColor(prize.color, 30);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px DM Sans, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 2;
    const label = prize.name.length > 14 ? prize.name.slice(0, 12) + '…' : prize.name;
    ctx.fillText(label, radius - 12, 4);
    ctx.restore();

    startAngle = endAngle;
  });

  // Center circle
  ctx.beginPath();
  ctx.arc(center, center, 28, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#004e9f';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#004e9f';
  ctx.font = 'bold 13px DM Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SPIN', center, center);
}

function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + percent);
  const g = Math.min(255, ((num >> 8) & 0xff) + percent);
  const b = Math.min(255, (num & 0xff) + percent);
  return `rgb(${r},${g},${b})`;
}

function bindEvents() {
  phoneForm.addEventListener('submit', handlePhoneSubmit);
  phoneInput.addEventListener('input', formatPhoneInput);
  spinBtn.addEventListener('click', handleSpin);
  copyCodeBtn.addEventListener('click', copyCode);
}

// ─── Phone validation ─────────────────────────────────────────────────────────
function formatPhoneInput() {
  let val = phoneInput.value.replace(/\D/g, '');
  if (val.startsWith('0')) val = val.slice(1);
  if (val.length > 9) val = val.slice(0, 9);

  if (val.length > 3) {
    val = val.slice(0, 3) + ' ' + val.slice(3);
  }
  if (val.length > 7) {
    val = val.slice(0, 7) + ' ' + val.slice(7);
  }

  phoneInput.value = val;
  phoneHint.classList.remove('error');
  phoneHint.textContent = "We'll send your reward details via WhatsApp";
}

function normalizePhoneDigits(raw) {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

function validatePhone(raw) {
  const digits = normalizePhoneDigits(raw);
  return digits.length === 9 && /^[17]/.test(digits);
}

function handlePhoneSubmit(e) {
  e.preventDefault();

  const raw = phoneInput.value.trim();
  if (!validatePhone(raw)) {
    phoneHint.classList.add('error');
    phoneHint.textContent = 'Please enter a valid Kenyan number (e.g. 712 345 678)';
    phoneInput.focus();
    return;
  }

  const digits = normalizePhoneDigits(raw);
  const formatted = digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
  userPhone = '+254 ' + formatted;
  userPhoneDisplay.textContent = userPhone;

  phoneForm.classList.add('is-exiting');
  setTimeout(() => {
    phoneForm.classList.add('hidden');
    phoneForm.classList.remove('is-exiting');
    wheelArea.classList.remove('hidden');
    wheelArea.classList.add('is-revealed');
    wheelCanvas.classList.add('is-idle');
    wheelArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 380);
}

// ─── Spin logic ───────────────────────────────────────────────────────────────
function pickPrize() {
  const total = PRIZES.reduce((s, p) => s + p.weight, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < PRIZES.length; i++) {
    rand -= PRIZES[i].weight;
    if (rand <= 0) return { prize: PRIZES[i], index: i };
  }
  return { prize: PRIZES[PRIZES.length - 1], index: PRIZES.length - 1 };
}

function getSliceAngle(index) {
  const totalWeight = PRIZES.reduce((s, p) => s + p.weight, 0);
  let angle = 0;
  for (let i = 0; i < index; i++) {
    angle += (PRIZES[i].weight / totalWeight) * 360;
  }
  const sliceSize = (PRIZES[index].weight / totalWeight) * 360;
  return angle + sliceSize / 2;
}

function handleSpin() {
  if (isSpinning || hasSpun) return;

  isSpinning = true;
  spinBtn.disabled = true;
  spinBtn.classList.add('is-spinning');
  wheelCanvas.classList.remove('is-idle');
  spinBtn.querySelector('.spin-btn__text').textContent = 'SPINNING...';

  const { prize, index } = pickPrize();
  wonPrize = prize;

  const sliceCenter = getSliceAngle(index);
  const spins = 5 + Math.random() * 3;
  const targetRotation = currentRotation + spins * 360 + (360 - sliceCenter);

  animateWheel(targetRotation, () => {
    hasSpun = true;
    isSpinning = false;
    currentRotation = targetRotation % 360;

    const code = generateCode();
    showWinModal(prize, code);
  });
}

function animateWheel(targetRotation, onComplete) {
  const startRotation = currentRotation;
  const duration = 4500;
  const startTime = performance.now();

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const rotation = startRotation + (targetRotation - startRotation) * eased;

    wheelCanvas.style.transform = `rotate(${rotation}deg)`;

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      currentRotation = targetRotation;
      onComplete();
    }
  }

  requestAnimationFrame(frame);
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CARRE-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ─── Win modal ────────────────────────────────────────────────────────────────
function showWinModal(prize, code) {
  modalPrizeName.textContent = prize.name;
  modalPrizeDesc.textContent = prize.desc;
  modalPrizeCode.textContent = code;

  whatsappBtn.href = WHATSAPP_GROUP_URL;

  winModal.classList.remove('hidden');
  launchConfetti();
  document.body.style.overflow = 'hidden';
  spinBtn.querySelector('.spin-btn__text').textContent = 'ALREADY SPUN ✓';
}

function copyCode() {
  navigator.clipboard.writeText(modalPrizeCode.textContent).then(() => {
    copyCodeBtn.innerHTML = '✓';
    setTimeout(() => {
      copyCodeBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" stroke-width="2"/></svg>`;
    }, 1500);
  });
}

function launchConfetti() {
  confettiEl.innerHTML = '';
  const colors = ['#004e9f', '#e5002b', '#f5a623', '#25d366', '#7c3aed', '#ec4899'];

  for (let i = 0; i < 50; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.8 + 's';
    piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.width = (6 + Math.random() * 8) + 'px';
    piece.style.height = (6 + Math.random() * 8) + 'px';
    confettiEl.appendChild(piece);
  }
}

function animateWinnersCount() {
  const base = 2800 + Math.floor(Math.random() * 100);
  let current = base;
  winnersCount.textContent = current.toLocaleString();

  setInterval(() => {
    current += Math.floor(Math.random() * 3) + 1;
    winnersCount.textContent = current.toLocaleString();
  }, 8000);
}

init();
