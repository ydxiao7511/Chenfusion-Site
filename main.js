import { translations } from './translations.js';
import { services } from './servicesData.js';

// State
let currentLang = 'en';
let currentStep = 1;
let selectedService = null;
let selectedDuration = null;
let selectedPrice = 0;
let selectedDate = null;
let selectedTime = null;

const bookingData = {
  name: '',
  email: '',
  phone: '',
  notes: ''
};

// Initialize
const init = () => {
  try {
    renderServices();
    updateTranslations();
    setupEventListeners();
    initCalendar();
    initAdminTabs();
    // No need to call renderTimeSlots here as it requires a date
  } catch (err) {
    console.error("Initialization failed:", err);
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function setupEventListeners() {
  // Language Toggle
  const enBtn = document.getElementById('lang-en');
  const zhBtn = document.getElementById('lang-zh');
  if (enBtn) enBtn.addEventListener('click', () => setLanguage('en'));
  if (zhBtn) zhBtn.addEventListener('click', () => setLanguage('zh'));

  // Global delegation for duration items
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.duration-item');
    if (item) {
      document.querySelectorAll('.duration-item').forEach(i => i.classList.remove('selected'));
      item.classList.add('selected');
      selectedDuration = parseInt(item.dataset.mins) || parseInt(item.getAttribute('data-mins'));
      selectedPrice = parseFloat(item.dataset.price) || parseFloat(item.getAttribute('data-price'));
      
      updateSummary();
      setTimeout(() => goToStep(3), 500);
    }
  });

  // Booking Modal
  const modal = document.getElementById('booking-modal');
  const bookBtns = document.querySelectorAll('.book-trigger, #nav-book-btn');
  const closeModal = document.querySelector('.close-modal');

  bookBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (modal) {
        modal.classList.add('active');
        goToStep(1);
      }
    });
  });

  if (closeModal && modal) {
    closeModal.addEventListener('click', () => {
      modal.classList.remove('active');
      const confirmLink = document.getElementById('nav-confirm-link');
      if (confirmLink) confirmLink.classList.add('hidden');
    });
  }

  // Booking Steps Navigation
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('next-step')) {
      if (currentStep === 4) {
          const form = document.getElementById('booking-form');
          if (form && !form.checkValidity()) {
              form.reportValidity();
              return;
          }
      }
      goToStep(currentStep + 1);
    }
    if (e.target.classList.contains('back-step')) {
      goToStep(currentStep - 1);
    }
  });

  // Admin Panel Toggle
  const adminPanel = document.getElementById('admin-panel');
  const openAdminBtn = document.getElementById('open-admin-btn');
  const closeAdminBtn = document.getElementById('close-admin');
  
  if (openAdminBtn && adminPanel) {
    openAdminBtn.addEventListener('click', () => {
      adminPanel.classList.remove('hidden');
      switchAdminTab('dashboard');
    });
  }
  if (closeAdminBtn && adminPanel) {
    closeAdminBtn.addEventListener('click', () => {
      adminPanel.classList.add('hidden');
    });
  }

  // Calendar Nav
  const prevMonthBtn = document.getElementById('prev-month');
  const nextMonthBtn = document.getElementById('next-month');
  if (prevMonthBtn) prevMonthBtn.addEventListener('click', () => shiftMonth(-1));
  if (nextMonthBtn) nextMonthBtn.addEventListener('click', () => shiftMonth(1));

  // Form Sync
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('input', (e) => {
      const key = e.target.id === 'full-name' ? 'name' : e.target.id;
      if (bookingData.hasOwnProperty(key) || key === 'name') {
        bookingData[key] = e.target.value;
        updateSummary();
      }
      
      // Auto-advance if form is fully valid
      if (bookingForm.checkValidity()) {
        setTimeout(() => {
          if (bookingForm.checkValidity()) goToStep(5);
        }, 1500); 
      }
    });
  }

  // Final Confirmation
  const confirmBtn = document.getElementById('confirm-booking');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      const msg = currentLang === 'en' 
        ? "Restoration Confirmed! You will receive a confirmation email shortly." 
        : "修复预约已确认！您很快将收到确认电子邮件。";
      alert(msg);
      if (modal) {
        modal.classList.remove('active');
        const confirmLink = document.getElementById('nav-confirm-link');
        if (confirmLink) confirmLink.classList.add('hidden');
      }
    });
  }
}

function initAdminTabs() {
  const tabs = document.querySelectorAll('#admin-tabs-nav button');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      switchAdminTab(target);
    });
  });
}

function switchAdminTab(tabId) {
  // Update Buttons
  document.querySelectorAll('#admin-tabs-nav button').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });

  // Update Panels
  document.querySelectorAll('.admin-tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });

  // Trigger content render if needed
  if (tabId === 'calendar') {
    renderAdminSchedule();
  }
}

function setLanguage(lang) {
  currentLang = lang;
  const enBtn = document.getElementById('lang-en');
  const zhBtn = document.getElementById('lang-zh');
  if (enBtn) enBtn.classList.toggle('active', lang === 'en');
  if (zhBtn) zhBtn.classList.toggle('active', lang === 'zh');
  
  updateTranslations();
  renderServices();
  updateSummary();
  renderCalendar();
  if (selectedDate) renderTimeSlots();
}

function updateTranslations() {
  const transObj = translations[currentLang];
  if (!transObj) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const trans = transObj[key];
    if (trans) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = trans;
      } else {
        el.textContent = trans;
      }
    }
  });
}

function renderServices() {
  const grid = document.getElementById('services-grid');
  const bookingList = document.getElementById('booking-service-list');
  if (!grid || !bookingList) return;

  grid.innerHTML = '';
  bookingList.innerHTML = '';

  services.forEach(service => {
    const card = document.createElement('div');
    card.className = 'service-card reveal reveal-up';
    card.innerHTML = `
      <img src="${service.image}" alt="${service.name[currentLang]}" class="service-img">
      <div class="service-info">
        <div class="service-meta">
          <span>${translations[currentLang].custom_duration || 'Custom'}</span>
          <span>${translations[currentLang].from_price || 'From $50'}</span>
        </div>
        <h3>${service.name[currentLang]}</h3>
        <p>${service.description[currentLang]}</p>
        <button class="btn-primary book-trigger" data-id="${service.id}">${currentLang === 'en' ? 'Book Session' : '预约'}</button>
      </div>
    `;
    grid.appendChild(card);

    const selectItem = document.createElement('div');
    selectItem.className = `service-select-item ${selectedService?.id === service.id ? 'selected' : ''}`;
    selectItem.innerHTML = `
      <div class="service-meta">
          <span>${translations[currentLang].premium_choice || 'Premium'}</span>
      </div>
      <h3>${service.name[currentLang]}</h3>
      <p>${service.description[currentLang]}</p>
    `;
    selectItem.onclick = () => {
      selectedService = service;
      renderServices();
      updateSummary();
      setTimeout(() => goToStep(2), 400);
    };
    bookingList.appendChild(selectItem);
  });

  // Re-observe dynamic elements
  initScrollReveal();

  document.querySelectorAll('.service-card .book-trigger').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      selectedService = services.find(s => s.id === id);
      const modal = document.getElementById('booking-modal');
      if (modal) modal.classList.add('active');
      goToStep(2);
    };
  });
}

function initScrollReveal() {
  if (typeof IntersectionObserver === 'undefined') return;
  
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
    observer.observe(el);
  });
}

function goToStep(step) {
  if (step < 1 || step > 5) return;
  if (step === 2 && !selectedService) return;
  if (step === 3 && (!selectedService || !selectedDuration)) return;
  if (step === 4 && (!selectedDate || !selectedTime)) return;

  currentStep = step;
  document.querySelectorAll('.booking-steps .step').forEach((el, idx) => {
    el.classList.toggle('active', idx + 1 <= step);
  });
  document.querySelectorAll('.panel').forEach((el, idx) => {
    el.classList.toggle('active', idx + 1 === step);
  });

  const confirmLink = document.getElementById('nav-confirm-link');
  const sidebar = document.getElementById('booking-sidebar-step');
  if (step === 5) {
      if (confirmLink) confirmLink.classList.remove('hidden');
      if (sidebar) sidebar.classList.add('hidden');
  } else {
      if (confirmLink) confirmLink.classList.add('hidden');
      if (sidebar) sidebar.classList.remove('hidden');
  }
  
  if (step === 3) {
    renderCalendar();
    renderTimeSlots();
  }
  updateSummary();
}

function updateSummary() {
  const sidebar = document.getElementById('sidebar-summary-content');
  const finalSummary = document.getElementById('final-summary-card');
  if (!sidebar) return;

  const trans = translations[currentLang];
  if (!trans) return;

  if (!selectedService) {
      sidebar.innerHTML = `<p class="empty-msg">${trans.empty_summary || 'Please select a service.'}</p>`;
      return;
  }

  const subtotal = selectedPrice || 0;
  const tax = subtotal * 0.13;
  const total = subtotal + tax;

  const summaryHTML = `
    <div class="summary-item">
        <span class="summary-label">${trans.sum_service_label || 'Service'}</span>
        <span class="summary-val">${selectedService.name[currentLang]}</span>
    </div>
    ${selectedDuration ? `
    <div class="summary-item">
        <span class="summary-label">${trans.sum_duration_label || 'Duration'}</span>
        <span class="summary-val">${selectedDuration} ${trans.sum_minutes || 'mins'}</span>
    </div>
    ` : ''}
    ${selectedDate ? `
    <div class="summary-item">
        <span class="summary-label">${trans.sum_datetime_label || 'Date & Time'}</span>
        <span class="summary-val" style="text-align: right;">
            ${selectedDate.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'zh-CN', { month: 'long', day: 'numeric', year: 'numeric' })}
            ${selectedTime ? `<br><span style="font-size: 0.9em; color: var(--color-text-muted)">${selectedTime}</span>` : ''}
        </span>
    </div>
    ` : ''}
    <div class="sidebar-divider"></div>
    <div class="sidebar-total">
        <span>${trans.sum_total || 'Total'}</span>
        <span class="total-val">$${total.toFixed(2)}</span>
    </div>
  `;

  sidebar.innerHTML = summaryHTML;
  if (finalSummary) finalSummary.innerHTML = summaryHTML;
}

let calendarDate = new Date();
function initCalendar() { renderCalendar(); }
function shiftMonth(dir) { 
  calendarDate.setMonth(calendarDate.getMonth() + dir); 
  renderCalendar(); 
}

function renderCalendar() {
  const header = document.getElementById('current-month-year');
  const grid = document.getElementById('calendar-grid');
  if (!header || !grid) return;

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  
  header.textContent = calendarDate.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'zh-CN', { month: 'long', year: 'numeric' });
  grid.innerHTML = '';

  const dayNames = currentLang === 'en' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['日', '一', '二', '三', '四', '五', '六'];
  dayNames.forEach(day => {
    const el = document.createElement('div');
    el.style.fontWeight = 'bold'; el.style.fontSize = '0.7rem'; el.style.opacity = '0.5';
    el.textContent = day; grid.appendChild(el);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));
  
  for (let d = 1; d <= daysInMonth; d++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'cal-day'; 
    dayEl.textContent = d;
    
    const dDate = new Date(year, month, d);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (dDate < today) {
      dayEl.classList.add('disabled');
    } else {
        if (selectedDate && dDate.toDateString() === selectedDate.toDateString()) {
          dayEl.classList.add('selected');
        }
        dayEl.onclick = (e) => {
            e.stopPropagation();
            selectedDate = dDate;
            const display = document.getElementById('selected-date-display');
            if (display) {
              display.textContent = dDate.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'zh-CN', { weekday: 'short', month: 'short', day: 'numeric' });
            }
            renderCalendar(); 
            renderTimeSlots(); 
            updateSummary();
        };
    }
    grid.appendChild(dayEl);
  }
}

function renderTimeSlots() {
  const container = document.getElementById('time-slots-grid');
  if (!container) return;
  
  if (!selectedDate) {
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; font-size: 0.85rem; color: var(--color-text-muted); padding: 2rem 0;">${currentLang === 'en' ? 'Please select a date first' : '请先选择日期'}</p>`;
    return;
  }

  container.innerHTML = '';
  const slots = ["09:00 AM", "10:30 AM", "12:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];
  slots.forEach(slot => {
    const el = document.createElement('div');
    el.className = `time-slot ${selectedTime === slot ? 'selected' : ''}`;
    el.textContent = slot;
    el.onclick = (e) => {
      e.stopPropagation();
      selectedTime = slot;
      renderTimeSlots();
      updateSummary();
      setTimeout(() => goToStep(4), 500);
    };
    container.appendChild(el);
  });
}

function renderAdminSchedule() {
  const list = document.getElementById('admin-schedule-list-table');
  if (!list) return;
  list.innerHTML = '';
  const mockAppointments = [
    { time: "10:00 AM", client: "Sarah Mitchell", service: "Swedish Fusion", staff: "Lin Chen", status: "In Progress" },
    { time: "11:30 AM", client: "David Chen", service: "Deep Tissue", staff: "Lin Chen", status: "Confirmed" },
    { time: "01:00 PM", client: "Elena Rodriguez", service: "Hot Stone", staff: "Jennifer", status: "Confirmed" },
    { time: "02:30 PM", client: "Mark Thompson", service: "Thai Stretching", staff: "Jennifer", status: "Confirmed" }
  ];

  mockAppointments.forEach(app => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 600;">${app.time}</td>
      <td>${app.client}</td>
      <td>${app.service}</td>
      <td>${app.staff}</td>
      <td><span class="status-badge ${app.status === 'In Progress' ? 'active' : 'inactive'}" style="background: ${app.status === 'In Progress' ? '#E3F2FD' : '#E8F5E9'}; color: ${app.status === 'In Progress' ? '#1565C0' : '#2E7D32'};">${app.status}</span></td>
      <td>
        <button class="action-btn">Edit</button>
        <button class="action-btn danger">Cancel</button>
      </td>
    `;
    list.appendChild(tr);
  });
}

