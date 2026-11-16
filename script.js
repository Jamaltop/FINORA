document.addEventListener('DOMContentLoaded', () => {
  const categoryLimits = {
    'Housing': 1800,
    'Food & Dining': 650,
    'Software & Tech': 300,
    'Transport': 250
  };

  let entries = JSON.parse(localStorage.getItem('finora_entries')) || [
    { id: 1, title: 'Product Design Retainer', amount: 5400, type: 'income', category: 'Salary & Freelance', date: '2026-11-01' },
    { id: 2, title: 'Apartment Lease', amount: 1450, type: 'expense', category: 'Housing', date: '2026-11-03' },
    { id: 3, title: 'Whole Foods Market', amount: 184.50, type: 'expense', category: 'Food & Dining', date: '2026-11-07' },
    { id: 4, title: 'Cloud & Figma Pro', amount: 92.00, type: 'expense', category: 'Software & Tech', date: '2026-11-10' },
    { id: 5, title: 'City Metro & Uber', amount: 68.00, type: 'expense', category: 'Transport', date: '2026-11-14' }
  ];

  let chartInstance = null;

  // Theme Toggle
  const savedTheme = localStorage.getItem('finora_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.getElementById('finThemeBtn').textContent = savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';

  document.getElementById('finThemeBtn').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('finora_theme', next);
    document.getElementById('finThemeBtn').textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode';
    renderChart();
  });

  function saveAndRefresh() {
    localStorage.setItem('finora_entries', JSON.stringify(entries));
    renderAll();
  }

  function renderAll() {
    const income = entries.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const balance = income - expense;
    const rate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;

    document.getElementById('netBalance').textContent = `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('totalIncome').textContent = `+$${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('totalExpense').textContent = `-$${expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById('savingsRate').textContent = `${rate}%`;

    renderList();
    renderBudgets();
    renderChart();
  }

  function renderList() {
    const filter = document.getElementById('filterCat').value;
    const visible = filter === 'All' ? entries : entries.filter(e => e.category === filter);

    document.getElementById('txList').innerHTML = visible.map(item => `
      <li class="tx-item">
        <div>
          <strong>${item.title}</strong>
          <span class="tx-cat-badge">${item.category}</span>
          <div style="font-size:0.75rem;color:var(--muted);">${item.date}</div>
        </div>
        <div>
          <span class="mono-num ${item.type === 'income' ? 'income-txt' : 'expense-txt'}">
            ${item.type === 'income' ? '+' : '-'}$${item.amount.toFixed(2)}
          </span>
          <button class="del-tx" onclick="removeEntry(${item.id})" title="Delete">✕</button>
        </div>
      </li>
    `).join('');
  }

  function renderBudgets() {
    const container = document.getElementById('budgetBars');
    container.innerHTML = Object.entries(categoryLimits).map(([cat, limit]) => {
      const spent = entries
        .filter(e => e.type === 'expense' && e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);
      const pct = Math.min(100, Math.round((spent / limit) * 100));
      const isOver = spent > limit;
      return `
        <div class="budget-item">
          <div class="budget-top">
            <span>${cat}</span>
            <span class="mono-num">$${spent.toFixed(0)} / $${limit}</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${isOver ? 'over' : ''}" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderChart() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const cats = Object.keys(categoryLimits);
    const values = cats.map(cat =>
      entries.filter(e => e.type === 'expense' && e.category === cat).reduce((s, e) => s + e.amount, 0)
    );

    const ctx = document.getElementById('expenseChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: cats,
        datasets: [{
          label: 'Spent ($)',
          data: values,
          backgroundColor: ['#0d5c46', '#10b981', '#3b82f6', '#f59e0b'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: isDark ? '#8ea39a' : '#586b63' }, grid: { display: false } },
          y: { ticks: { color: isDark ? '#8ea39a' : '#586b63' }, grid: { color: isDark ? '#263630' : '#d8e2dc' } }
        }
      }
    });
  }

  window.removeEntry = (id) => {
    entries = entries.filter(e => e.id !== id);
    saveAndRefresh();
  };

  document.getElementById('txForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newEntry = {
      id: Date.now(),
      title: document.getElementById('txTitle').value.trim(),
      amount: parseFloat(document.getElementById('txAmount').value),
      type: document.getElementById('txType').value,
      category: document.getElementById('txCategory').value,
      date: new Date().toISOString().slice(0, 10)
    };
    entries.unshift(newEntry);
    e.target.reset();
    saveAndRefresh();
  });

  document.getElementById('filterCat').addEventListener('change', renderList);

  renderAll();
});