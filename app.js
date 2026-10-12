const menuButton = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileNav.hidden = !open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Открыть меню');
}));

const form = document.querySelector('#order-form');
const cakeSelect = document.querySelector('#cake-select');
const status = document.querySelector('#form-status');
const dateInput = document.querySelector('#order-date');
dateInput.min = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

document.querySelectorAll('[data-cake]').forEach(button => button.addEventListener('click', () => {
  cakeSelect.value = button.dataset.cake;
  document.querySelector('#order').scrollIntoView({ behavior: 'smooth' });
  cakeSelect.focus({ preventScroll: true });
}));

form.addEventListener('submit', async event => {
  event.preventDefault();
  status.textContent = '';
  status.className = 'form-status';
  if (!form.reportValidity()) return;
  const submit = form.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.firstChild.textContent = 'Сохраняем заявку ';
  try {
    const payload = Object.fromEntries(new FormData(form));
    const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Не удалось сохранить заявку. Попробуйте ещё раз.');
    status.textContent = `Заявка №${result.id} сохранена на этом компьютере. Мы свяжемся с вами после подключения канала связи.`;
    status.classList.add('success');
    form.reset();
  } catch (error) {
    status.textContent = error.message || 'Не удалось сохранить заявку. Попробуйте ещё раз.';
    status.classList.add('error');
  } finally {
    submit.disabled = false;
    submit.firstChild.textContent = 'Отправить заявку ';
  }
});
