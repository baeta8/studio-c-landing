/* ============================================================
   STUDIO C — Agendamento prévio (envia pedido pronto ao WhatsApp)
   ============================================================ */
(function () {
  'use strict';

  /* ⚠️ AJUSTE AQUI o horário real do Studio C ⚠️
     Para cada dia da semana: [abertura, fechamento] em "HH:MM",
     ou null quando o studio estiver fechado nesse dia.
     (0 = Domingo, 1 = Segunda ... 6 = Sábado)
     Os horários mostrados à cliente são gerados a partir daqui. */
  var HORARIO_FUNCIONAMENTO = {
    0: null,                 // Domingo — fechado
    1: null,                 // Segunda - fechado
    2: ['10:00', '19:00'],   // Terça
    3: ['10:00', '19:00'],   // Quarta
    4: ['10:00', '19:00'],   // Quinta
    5: ['10:00', '19:00'],   // Sexta
    6: ['09:00', '12:00']    // Sábado
  };
  var INTERVALO_MIN   = 30;   // intervalo entre horários (minutos)
  var ANTECEDENCIA_MIN = 60;  // p/ o dia de hoje, esconde horários a menos de X min de agora
  var DIAS_A_FRENTE   = 60;   // até quantos dias à frente a cliente pode escolher

  var WHATSAPP  = '5524998540945';
  var STUDIO    = 'Studio C';
  var ENDERECO  = 'Av. Joaquim Leite, 509, 1º Andar, Sala 27, Centro, Barra Mansa - RJ';

  // --------------------------------------------------------
  var form = document.getElementById('bookingForm');
  if (!form) return;

  var elService = document.getElementById('bkService');
  var elDate    = document.getElementById('bkDate');
  var elDateWrap = document.getElementById('bkDatePickerWrap');
  var elDateToggle = document.getElementById('bkDateToggle');
  var elDateLabel = document.getElementById('bkDateLabel');
  var elCalendar = document.getElementById('bkDatePicker');
  var elCalendarTitle = document.getElementById('bkCalendarTitle');
  var elCalendarDays = document.getElementById('bkCalendarDays');
  var elPrevMonth = document.getElementById('bkPrevMonth');
  var elNextMonth = document.getElementById('bkNextMonth');
  var elDayHint = document.getElementById('bkDayHint');
  var elSlots   = document.getElementById('bkSlots');
  var elSummary = document.getElementById('bkSummary');
  var elSend    = document.getElementById('bkSend');

  var DIAS = ['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'];
  var selectedTime = '';

  // Configura limites do campo de data (hoje → +DIAS_A_FRENTE)
  var today = new Date(); today.setHours(0,0,0,0);
  elDate.min = toISO(today);
  var max = new Date(today); max.setDate(max.getDate() + DIAS_A_FRENTE);
  elDate.max = toISO(max);
  var viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  elService.addEventListener('change', updateSummary);
  elDate.addEventListener('change', onDateChange);
  elDateToggle.addEventListener('click', toggleCalendar);
  elPrevMonth.addEventListener('click', function () { shiftMonth(-1); });
  elNextMonth.addEventListener('click', function () { shiftMonth(1); });
  elCalendarDays.addEventListener('click', onCalendarDayClick);
  elCalendarDays.addEventListener('keydown', onCalendarKeydown);
  document.addEventListener('click', function (event) {
    if (!elDateWrap.contains(event.target)) closeCalendar(false);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !elCalendar.hidden) {
      closeCalendar(true);
      event.stopPropagation();
    }
  });
  renderCalendar();

  function toggleCalendar() {
    if (!elCalendar.hidden) { closeCalendar(false); return; }
    var selected = parseISO(elDate.value);
    if (selected) viewMonth = new Date(selected.getFullYear(), selected.getMonth(), 1);
    renderCalendar();
    elCalendar.hidden = false;
    elDateToggle.setAttribute('aria-expanded', 'true');
    var focusTarget = elDate.value ? elCalendarDays.querySelector('[data-date="' + elDate.value + '"]:not(:disabled)') : null;
    focusTarget = focusTarget || elCalendarDays.querySelector('button:not(:disabled)');
    if (focusTarget) focusTarget.focus();
  }

  function closeCalendar(returnFocus) {
    if (elCalendar.hidden) return;
    elCalendar.hidden = true;
    elDateToggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) elDateToggle.focus();
  }

  function shiftMonth(amount) {
    viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + amount, 1);
    renderCalendar();
  }

  function renderCalendar() {
    var year = viewMonth.getFullYear();
    var month = viewMonth.getMonth();
    elCalendarTitle.textContent = capitalize(new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(viewMonth));
    elPrevMonth.disabled = year === today.getFullYear() && month === today.getMonth();
    elNextMonth.disabled = new Date(year, month + 1, 1) > max;
    elCalendarDays.innerHTML = '';

    var first = new Date(year, month, 1);
    var leading = (first.getDay() + 6) % 7;
    var count = new Date(year, month + 1, 0).getDate();
    for (var blank = 0; blank < leading; blank++) {
      var spacer = document.createElement('span');
      spacer.className = 'booking__calendar-empty';
      spacer.setAttribute('aria-hidden', 'true');
      elCalendarDays.appendChild(spacer);
    }

    for (var day = 1; day <= count; day++) {
      var date = new Date(year, month, day);
      var iso = toISO(date);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'booking__calendar-day';
      button.textContent = day;
      button.setAttribute('data-date', iso);
      button.setAttribute('aria-label', capitalize(new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      }).format(date)));
      button.disabled = !isBookableDate(date);
      if (sameDay(date, today)) button.classList.add('is-today');
      if (iso === elDate.value) {
        button.classList.add('is-selected');
        button.setAttribute('aria-pressed', 'true');
      } else {
        button.setAttribute('aria-pressed', 'false');
      }
      elCalendarDays.appendChild(button);
    }
  }

  function isBookableDate(date) {
    var day = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (day < today || day > max || !HORARIO_FUNCIONAMENTO[day.getDay()]) return false;
    var hours = HORARIO_FUNCIONAMENTO[day.getDay()];
    return buildSlots(day, hours[0], hours[1]).length > 0;
  }

  function onCalendarDayClick(event) {
    var button = event.target.closest('[data-date]');
    if (!button || button.disabled) return;
    elDate.value = button.getAttribute('data-date');
    elDateLabel.textContent = new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(parseISO(elDate.value));
    elDate.dispatchEvent(new Event('change', { bubbles: true }));
    renderCalendar();
    closeCalendar(true);
  }

  function onCalendarKeydown(event) {
    var steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    var delta = steps[event.key];
    if (!delta) return;
    var current = event.target.closest('[data-date]');
    if (!current) return;
    event.preventDefault();
    var buttons = Array.prototype.slice.call(elCalendarDays.querySelectorAll('button:not(:disabled)'));
    var index = buttons.indexOf(current);
    var next = buttons[index + delta];
    if (next) next.focus();
  }

  function onDateChange() {
    selectedTime = '';
    var date = parseISO(elDate.value);
    if (!date) { elSlots.innerHTML = placeholder('Selecione um dia para ver os horários disponíveis.'); elDayHint.textContent = ''; updateSummary(); return; }

    var dow = date.getDay();
    var hours = HORARIO_FUNCIONAMENTO[dow];

    if (!hours) {
      elDayHint.textContent = 'O Studio C não atende neste dia. Escolha outro dia.';
      elSlots.innerHTML = placeholder('Sem horários neste dia.');
      updateSummary();
      return;
    }

    var slots = buildSlots(date, hours[0], hours[1]);
    elDayHint.textContent = capitalize(DIAS[dow]) + ' · aberto das ' + hours[0] + ' às ' + hours[1];

    if (!slots.length) {
      elSlots.innerHTML = placeholder('Não há mais horários disponíveis neste dia. Tente outro dia.');
      updateSummary();
      return;
    }

    elSlots.innerHTML = '';
    slots.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'booking__slot';
      b.textContent = t;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        selectedTime = t;
        elSlots.querySelectorAll('.booking__slot').forEach(function (s) {
          s.classList.remove('is-active'); s.setAttribute('aria-pressed', 'false');
        });
        b.classList.add('is-active'); b.setAttribute('aria-pressed', 'true');
        updateSummary();
      });
      elSlots.appendChild(b);
    });
    updateSummary();
  }

  // Gera horários de "open" até "close" (exclusivo no fim), pulando os que já passaram se for hoje
  function buildSlots(date, open, close) {
    var out = [];
    var start = toMinutes(open), end = toMinutes(close);
    var now = new Date();
    var isToday = sameDay(date, now);
    var limit = isToday ? (now.getHours() * 60 + now.getMinutes() + ANTECEDENCIA_MIN) : -1;
    // último horário começa um intervalo antes do fechamento (m < end)
    for (var m = start; m < end; m += INTERVALO_MIN) {
      if (isToday && m < limit) continue;
      out.push(fromMinutes(m));
    }
    return out;
  }

  function updateSummary() {
    var service = elService.value;
    var dateVal = elDate.value ? parseISO(elDate.value) : null;
    var dow = dateVal ? dateVal.getDay() : null;
    var dayOpen = dow !== null && HORARIO_FUNCIONAMENTO[dow];
    var ready = !!(service && dateVal && dayOpen && selectedTime);

    if (ready) {
      elSummary.hidden = false;
      elSummary.innerHTML =
        '<span class="booking__summary-title">Resumo do seu pedido</span>' +
        row('Serviço', service) +
        row('Dia', capitalize(DIAS[dow]) + ', ' + formatBR(dateVal)) +
        row('Horário', selectedTime) +
        row('Local', STUDIO + ' — ' + ENDERECO);
      elSend.href = buildWaLink(service, dateVal, dow, selectedTime);
      elSend.classList.remove('is-disabled');
      elSend.setAttribute('aria-disabled', 'false');
    } else {
      elSummary.hidden = true;
      elSummary.innerHTML = '';
      elSend.href = '#';
      elSend.classList.add('is-disabled');
      elSend.setAttribute('aria-disabled', 'true');
    }
  }

  function buildWaLink(service, date, dow, time) {
    var msg =
      'Olá! Gostaria de agendar um horário no ' + STUDIO + '.\n\n' +
      '• Serviço: ' + service + '\n' +
      '• Dia: ' + capitalize(DIAS[dow]) + ', ' + formatBR(date) + '\n' +
      '• Horário: ' + time + '\n' +
      '• Local: ' + STUDIO + ' — ' + ENDERECO + '\n\n' +
      'Podem confirmar a disponibilidade? Obrigada!';
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
  }

  // Bloqueia o clique enquanto o pedido não estiver completo
  elSend.addEventListener('click', function (e) {
    if (elSend.classList.contains('is-disabled')) { e.preventDefault(); }
  });

  // --------- helpers ---------
  function row(label, value) {
    return '<div class="booking__summary-row"><span>' + label + '</span><strong>' + esc(value) + '</strong></div>';
  }
  function placeholder(text) { return '<p class="booking__placeholder">' + esc(text) + '</p>'; }
  function toMinutes(hhmm) { var p = hhmm.split(':'); return (+p[0]) * 60 + (+p[1]); }
  function fromMinutes(m) { return pad(Math.floor(m / 60)) + ':' + pad(m % 60); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function toISO(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function parseISO(v) { if (!v) return null; var p = v.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function formatBR(d) { return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
})();
