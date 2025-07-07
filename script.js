class ExpenseTracker {
    constructor() {
      this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
      this.monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 2000;
      this.currentScreen = 'dashboard';
      this.theme = localStorage.getItem('theme') || 'dark';
      
      this.init();
    }
  
    init() {
      this.setupEventListeners();
      this.applyTheme();
      this.updateDashboard();
      this.renderExpenses();
      this.generateSuggestions();
      this.setCurrentDate();
      this.checkMonthlyReset(); // Ensure this is called during initialization
    }
  
    setupEventListeners() {
      // Navigation
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          this.switchScreen(e.target.closest('.nav-btn').dataset.screen);
        });
      });
  
      // Theme toggle
      document.getElementById('themeToggle').addEventListener('click', () => {
        this.toggleTheme();
      });
  
      // Budget setter
      document.getElementById('setBudget').addEventListener('click', () => {
        this.setMonthlyBudget();
      });
  
      // Expense form
      document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.addExpense();
      });
  
      // Modal close
      document.getElementById('modalClose').addEventListener('click', () => {
        this.closeModal();
      });
  
      // Tip cards
      document.querySelectorAll('.tip-card').forEach(card => {
        card.addEventListener('click', () => {
          this.showTipDetails(card.dataset.tip);
        });
      });
  
      // Budget input enter key
      document.getElementById('monthlyBudget').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.setMonthlyBudget();
        }
      });
  
      // Fix date input by ensuring it's properly initialized
      this.fixDateInput();
    }
  
    fixDateInput() {
      const dateInput = document.getElementById('expenseDate');
      // Ensure the date input is properly configured
      dateInput.setAttribute('type', 'date');
      dateInput.style.colorScheme = this.theme === 'dark' ? 'dark' : 'light';
      
      // Add click handler to ensure date picker opens
      dateInput.addEventListener('click', function() {
        this.showPicker && this.showPicker();
      });
      
      // Fix for mobile devices
      dateInput.addEventListener('focus', function() {
        this.showPicker && this.showPicker();
      });
    }
  
    switchScreen(screenName) {
      // Update navigation
      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');
  
      // Update screens
      document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
      });
      document.getElementById(screenName).classList.add('active');
  
      this.currentScreen = screenName;
  
      // Update data when switching to dashboard or history
      if (screenName === 'dashboard') {
        this.updateDashboard();
      } else if (screenName === 'history') {
        this.showHistory();
      }
    }
  
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark';
      this.applyTheme();
      localStorage.setItem('theme', this.theme);
      this.fixDateInput(); // Reapply date input fixes for new theme
    }
  
    applyTheme() {
      if (this.theme === 'light') {
        document.body.setAttribute('data-theme', 'light');
      } else {
        document.body.removeAttribute('data-theme');
      }
    }
  
    setMonthlyBudget() {
      const budgetInput = document.getElementById('monthlyBudget');
      const newBudget = parseFloat(budgetInput.value);
      
      if (newBudget && newBudget > 0) {
        this.monthlyBudget = newBudget;
        localStorage.setItem('monthlyBudget', this.monthlyBudget.toString());
        this.updateDashboard();
        
        // Show success feedback
        budgetInput.style.borderColor = 'var(--accent-primary)';
        setTimeout(() => {
          budgetInput.style.borderColor = '';
        }, 1000);
        
        // Clear the input after setting
        budgetInput.value = '';
      }
    }
  
    addExpense() {
      const amount = parseFloat(document.getElementById('expenseAmount').value);
      const category = document.getElementById('expenseCategory').value;
      const date = document.getElementById('expenseDate').value;
      const description = document.getElementById('expenseDescription').value;
  
      if (!amount || !category || !date) {
        this.showError('Please fill in all required fields');
        return;
      }
  
      if (amount <= 0) {
        this.showError('Please enter a valid amount greater than 0');
        return;
      }
  
      const expense = {
        id: Date.now(),
        amount,
        category,
        date,
        description,
        timestamp: new Date().toISOString()
      };
  
      this.expenses.unshift(expense);
      localStorage.setItem('expenses', JSON.stringify(this.expenses));
  
      // Reset form
      document.getElementById('expenseForm').reset();
      this.setCurrentDate();
  
      // Update displays
      this.renderExpenses();
      this.updateDashboard();
      this.generateSuggestions();
  
      // Show success modal
      this.showModal('Expense Added!', `${this.formatCurrency(amount)} expense for ${this.getCategoryName(category)} has been recorded.`);
    }
  
    removeExpense(expenseId) {
      this.expenses = this.expenses.filter(expense => expense.id !== expenseId);
      localStorage.setItem('expenses', JSON.stringify(this.expenses));
      
      // Update displays
      this.renderExpenses();
      this.updateDashboard();
      this.generateSuggestions();
      
      this.showModal('Expense Removed!', 'The expense has been successfully removed.');
    }
  
    renderExpenses() {
      const container = document.getElementById('expensesContainer');
      const recentExpenses = this.expenses.slice(0, 10);
  
      if (recentExpenses.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">No expenses recorded yet</p>';
        return;
      }
  
      container.innerHTML = recentExpenses.map(expense => `
        <div class="expense-item">
          <div class="expense-details">
            <div class="expense-category">${this.getCategoryName(expense.category)}</div>
            ${expense.description ? `<div class="expense-description">${expense.description}</div>` : ''}
            <div class="expense-date">${this.formatDate(expense.date)}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <div class="expense-amount">${this.formatCurrency(expense.amount)}</div>
            <button class="remove-expense-btn" onclick="expenseTracker.removeExpense(${expense.id})" title="Remove expense">
              🗑️
            </button>
          </div>
        </div>
      `).join('');
    }
  
    updateDashboard() {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyExpenses = this.expenses.filter(expense => 
        expense.date.startsWith(currentMonth)
      );
      
      const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const remaining = Math.max(0, this.monthlyBudget - totalSpent);
      const spentPercentage = Math.min(100, (totalSpent / this.monthlyBudget) * 100);
      
      // Fix: Calculate remaining percentage correctly
      const remainingPercentage = Math.max(0, ((this.monthlyBudget - totalSpent) / this.monthlyBudget) * 100);
  
      // Update display values with Indian Rupee format
      document.getElementById('totalSpent').textContent = this.formatCurrency(totalSpent);
      document.getElementById('remainingBudget').textContent = this.formatCurrency(remaining);
      document.getElementById('monthlyTotal').textContent = this.formatCurrency(totalSpent);
      
      // Fix: Display the correct remaining percentage instead of hardcoded savings rate
      document.getElementById('savingsRate').textContent = `${remainingPercentage.toFixed(1)}%`;
  
      // Update clock hand based on spent percentage
      const clockHand = document.getElementById('clockHand');
      const rotation = (spentPercentage / 100) * 360;
      clockHand.style.transform = `translate(-50%, -100%) rotate(${rotation}deg)`;
  
      // Update budget input placeholder
      document.getElementById('monthlyBudget').placeholder = this.monthlyBudget.toString();
  
      // Color coding based on spending
      const remainingElement = document.getElementById('remainingBudget');
      const savingsRateElement = document.getElementById('savingsRate');
      
      if (spentPercentage > 90) {
        remainingElement.style.color = '#ff6b6b';
        savingsRateElement.style.color = '#ff6b6b';
      } else if (spentPercentage > 75) {
        remainingElement.style.color = '#ffa726';
        savingsRateElement.style.color = '#ffa726';
      } else {
        remainingElement.style.color = 'var(--text-accent)';
        savingsRateElement.style.color = 'var(--text-primary)';
      }
    }
  
    generateSuggestions() {
      const suggestionList = document.getElementById('suggestionList');
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyExpenses = this.expenses.filter(expense => 
        expense.date.startsWith(currentMonth)
      );
      
      const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const spentPercentage = (totalSpent / this.monthlyBudget) * 100;
      const remainingPercentage = Math.max(0, ((this.monthlyBudget - totalSpent) / this.monthlyBudget) * 100);
      
      let suggestions = [];
  
      if (spentPercentage > 100) {
        suggestions.push('🚨 You\'ve exceeded your budget! Consider reviewing your expenses and adjusting your spending.');
      } else if (spentPercentage > 90) {
        suggestions.push('🚨 You\'ve spent over 90% of your budget. Consider reducing discretionary spending.');
      } else if (spentPercentage > 75) {
        suggestions.push('⚠️ You\'ve spent over 75% of your budget. Monitor your remaining expenses carefully.');
      } else if (spentPercentage > 50) {
        suggestions.push('⚠️ You\'re halfway through your budget. Track your remaining expenses carefully.');
      }
  
      // Category analysis
      const categoryTotals = {};
      monthlyExpenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
      });
  
      const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
      if (topCategory && topCategory[1] > this.monthlyBudget * 0.3) {
        suggestions.push(`💡 ${this.getCategoryName(topCategory[0])} is your biggest expense category. Look for ways to optimize here.`);
      }
  
      if (suggestions.length === 0) {
        suggestions.push('✅ Great job! You\'re managing your budget well.');
        suggestions.push(`💰 You have ${remainingPercentage.toFixed(1)}% of your budget remaining. Consider setting aside some money for savings or investments.`);
      }
  
      suggestionList.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item">${suggestion}</div>
      `).join('');
    }
  
    formatCurrency(amount) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    }
  
    showModal(title, message) {
      document.querySelector('.modal h3').textContent = title;
      document.getElementById('modalMessage').textContent = message;
      document.getElementById('modalOverlay').classList.add('active');
    }
  
    closeModal() {
      document.getElementById('modalOverlay').classList.remove('active');
    }
  
    showError(message) {
      // Enhanced error handling with modal instead of alert
      this.showModal('Error', message);
    }
  
    showTipDetails(tipType) {
      const tips = {
        budget: 'Set spending limits for each category and get alerts when you approach them.',
        analysis: 'Review your spending patterns monthly to identify areas for improvement.',
        goals: 'Set specific savings targets and track your progress towards financial goals.',
        alerts: 'Enable notifications to stay informed about your spending habits.'
      };
      
      this.showModal('Smart Tip', tips[tipType] || 'This feature is coming soon!');
    }
  
    getCategoryName(category) {
      const categories = {
        food: '🍔 Food & Dining',
        transport: '🚗 Transportation',
        shopping: '🛍️ Shopping',
        entertainment: '🎬 Entertainment',
        bills: '📄 Bills & Utilities',
        health: '🏥 Healthcare',
        other: '📦 Other'
      };
      return categories[category] || category;
    }
  
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
  
    setCurrentDate() {
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('expenseDate').value = today;
    }
  
    checkMonthlyReset() {
      const today = new Date();
      const storedResetDate = localStorage.getItem('resetDate');
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
  
      if (!storedResetDate || storedResetDate !== `${currentYear}-${currentMonth}`) {
        this.resetData();
        localStorage.setItem('resetDate', `${currentYear}-${currentMonth}`);
      }
    }
  
    resetData() {
      // Save current month's data to history
      const currentMonth = new Date().toISOString().slice(0, 7);
      const monthlyExpenses = this.expenses.filter(expense => 
        expense.date.startsWith(currentMonth)
      );
      const history = JSON.parse(localStorage.getItem('history')) || [];
      history.push({ month: currentMonth, expenses: monthlyExpenses });
      localStorage.setItem('history', JSON.stringify(history));
  
      // Reset current month's data
      this.expenses = [];
      localStorage.setItem('expenses', JSON.stringify(this.expenses));
      this.updateDashboard();
      this.renderExpenses();
      this.generateSuggestions();
  
      this.showModal('Reset Complete', 'Your data has been reset for the new month.');
    }
  
    showHistory() {
      const history = JSON.parse(localStorage.getItem('history')) || [];
      const historyContainer = document.getElementById('historyContainer');

      if (history.length === 0) {
        historyContainer.innerHTML = '<p>No history available.</p>';
        return;
      }

      historyContainer.innerHTML = history.map(monthData => `
        <div class="history-month">
          <h3>${monthData.month}</h3>
          <ul>
            ${monthData.expenses.map(expense => `
              <li>
                <div class="expense-category">${this.getCategoryName(expense.category)}</div>
                <div class="expense-amount">${this.formatCurrency(expense.amount)}</div>
                <div class="expense-date">${this.formatDate(expense.date)}</div>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('');
    }
  }
  
  // Global variable to access the tracker instance
  let expenseTracker;
  
  // Initialize the app when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
  });
  
  // Add some extra visual effects
  document.addEventListener('DOMContentLoaded', () => {
    // Add floating animation to cards
    const cards = document.querySelectorAll('.stat-card, .tip-card, .expense-form, .expenses-list');
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 0.1}s`;
      card.classList.add('float-animation');
    });
  
    // Add parallax effect to background
    let ticking = false;
    
    function updateParallax() {
      const scrolled = window.pageYOffset;
      const parallax = document.querySelector('.gradient-overlay');
      const speed = scrolled * 0.5;
      
      if (parallax) {
        parallax.style.transform = `translateY(${speed}px)`;
      }
      
      ticking = false;
    }
  
    function requestTick() {
      if (!ticking) {
        requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }
  
    window.addEventListener('scroll', requestTick);
  });
  
  // Add CSS for floating animation and remove button
  const style = document.createElement('style');
  style.textContent = `
    .float-animation {
      animation: float 6s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    .float-animation:nth-child(even) {
      animation-direction: reverse;
    }
    
    .remove-expense-btn {
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 5px;
      border-radius: 4px;
      transition: all 0.3s ease;
      opacity: 0.7;
    }
    
    .remove-expense-btn:hover {
      opacity: 1;
      background: rgba(255, 107, 107, 0.1);
      transform: scale(1.1);
    }
    
    .expense-item:hover .remove-expense-btn {
      opacity: 1;
    }
  `;
  document.head.appendChild(style);
