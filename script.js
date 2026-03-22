$(document).ready(function() {
    // Set today's date as default
    $('#expenseDate').val(new Date().toISOString().split('T')[0]);
    
    // Load expenses on page load
    loadExpenses();
    
    // Form submission handler
    $('#expenseForm').on('submit', function(e) {
        e.preventDefault();
        
        // Add loading state
        const submitBtn = $(this).find('button[type="submit"]');
        const originalText = submitBtn.html();
        submitBtn.html('<span class="spinner-border spinner-border-sm me-2"></span>Adding...').prop('disabled', true);
        
        // Validate form
        if (!validateForm()) {
            submitBtn.html(originalText).prop('disabled', false);
            return;
        }
        
        // Create expense object
        const expense = {
            id: Date.now(),
            name: $('#expenseName').val().trim(),
            amount: parseFloat($('#expenseAmount').val()),
            category: $('#expenseCategory').val(),
            date: $('#expenseDate').val()
        };
        
        // Add expense and refresh display
        addExpense(expense);
        
        // Reset form
        this.reset();
        $('#expenseDate').val(new Date().toISOString().split('T')[0]);
        
        // Reset button
        submitBtn.html(originalText).prop('disabled', false);
        
        showAlert('Expense added successfully!', 'success');
    });
    
    // Delete expense handler (delegated event)
    $(document).on('click', '.delete-btn', function() {
        const expenseId = parseInt($(this).data('id'));
        
        if (confirm('Are you sure you want to delete this expense?')) {
            deleteExpense(expenseId);
        }
    });
    
    // Filter handler
    $('#filterCategory').on('change', filterExpenses);
    
    // Clear filter handler
    $('#clearFilter').on('click', function() {
        $('#filterCategory').val('');
        filterExpenses();
    });
    
    // Clear all expenses handler
    $('#clearAll').on('click', function() {
        if (confirm('Are you sure you want to delete ALL expenses? This action cannot be undone.')) {
            clearAllExpenses();
        }
    });
    
    /**
     * Load expenses from localStorage
     */
    function loadExpenses() {
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        renderExpenses(expenses);
        updateSummary(expenses);
    }
    
    /**
     * Add new expense to localStorage
     */
    function addExpense(expense) {
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        expenses.push(expense);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        loadExpenses();
    }
    
    /**
     * Delete expense by ID
     */
    function deleteExpense(id) {
        const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        const updatedExpenses = expenses.filter(expense => expense.id !== id);
        localStorage.setItem('expenses', JSON.stringify(updatedExpenses));
        loadExpenses();
        showAlert('Expense deleted successfully!', 'success');
    }
    
    /**
     * Clear all expenses
     */
    function clearAllExpenses() {
        localStorage.removeItem('expenses');
        loadExpenses();
        showAlert('All expenses cleared!', 'warning');
    }
    
    /**
     * Render expenses in table
     */
    function renderExpenses(expenses) {
        const tbody = $('#expenseTableBody');
        const noExpensesDiv = $('#noExpenses');
        
        if (expenses.length === 0) {
            tbody.empty();
            noExpensesDiv.removeClass('d-none');
            return;
        }
        
        noExpensesDiv.addClass('d-none');
        tbody.empty();
        
        expenses.forEach(expense => {
            const row = createExpenseRow(expense);
            tbody.append(row);
        });
    }
    
    /**
     * Create expense table row HTML
     */
    function createExpenseRow(expense) {
        const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const categoryIcon = getCategoryIcon(expense.category);
        
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${escapeHtml(expense.name)}</td>
                <td>
                    <span class="badge category-badge bg-light text-dark border">
                        ${categoryIcon} ${expense.category}
                    </span>
                </td>
                <td class="fw-bold text-success">$${expense.amount.toFixed(2)}</td>
                <td>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${expense.id}" title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }
    
    /**
     * Filter expenses by category
     */
    function filterExpenses() {
        const filterValue = $('#filterCategory').val();
        const allExpenses = JSON.parse(localStorage.getItem('expenses')) || [];
        
        let filteredExpenses = allExpenses;
        if (filterValue) {
            filteredExpenses = allExpenses.filter(expense => expense.category === filterValue);
        }
        
        renderExpenses(filteredExpenses);
        updateSummary(filteredExpenses);
    }
    
    /**
     * Update total amount and count
     */
    function updateSummary(expenses) {
        const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const count = expenses.length;
        
        $('#totalAmount').text(`$${total.toFixed(2)}`);
        $('#expenseCount').text(`${count} expense${count !== 1 ? 's' : ''}`);
    }
    
    /**
     * Form validation
     */
    function validateForm() {
        const name = $('#expenseName').val().trim();
        const amount = parseFloat($('#expenseAmount').val());
        const category = $('#expenseCategory').val();
        const date = $('#expenseDate').val();
        
        if (!name) {
            showAlert('Please enter an expense name', 'danger');
            $('#expenseName').focus();
            return false;
        }
        
        if (!amount || amount <= 0) {
            showAlert('Please enter a valid positive amount', 'danger');
            $('#expenseAmount').focus();
            return false;
        }
        
        if (!category) {
            showAlert('Please select a category', 'danger');
            $('#expenseCategory').focus();
            return false;
        }
        
        if (!date) {
            showAlert('Please select a date', 'danger');
            $('#expenseDate').focus();
            return false;
        }
        
        return true;
    }
    
    /**
     * Show alert message
     */
    function showAlert(message, type) {
        // Remove existing alerts
        $('.custom-alert').remove();
        
        const iconClass = type === 'success' ? 'check-circle' : 
                        type === 'danger' ? 'exclamation-triangle-fill' : 
                        'exclamation-octagon-fill';
        
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show custom-alert mx-4 mt-4" role="alert">
                <i class="bi bi-${iconClass} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Insert after header
        $('.row.justify-content-center').before(alertHtml);
        
        // Auto dismiss after 4 seconds
        setTimeout(function() {
            $('.custom-alert').alert('close');
        }, 4000);
    }
    
    /**
     * Get category icon
     */
    function getCategoryIcon(category) {
        const icons = {
            'Food': '🍔',
            'Travel': '✈️',
            'Shopping': '🛍️',
            'Others': '📋'
        };
        return icons[category] || '📋';
    }
    
    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    /**
     * Initialize sample data (uncomment to enable)
     */
    function initializeSampleData() {
        if (!localStorage.getItem('expenses')) {
            const sampleExpenses = [
                {
                    id: 1,
                    name: 'Grocery Shopping',
                    amount: 45.50,
                    category: 'Food',
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                },
                {
                    id: 2,
                    name: 'Gas Station',
                    amount: 32.75,
                    category: 'Travel',
                    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                },
                {
                    id: 3,
                    name: 'Online Shopping',
                    amount: 89.99,
                    category: 'Shopping',
                    date: new Date().toISOString().split('T')[0]
                }
            ];
            localStorage.setItem('expenses', JSON.stringify(sampleExpenses));
            loadExpenses();
        }
    }
    
    // Uncomment the line below to load sample data on first visit
    // initializeSampleData();
});