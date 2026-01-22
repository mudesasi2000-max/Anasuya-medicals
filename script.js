// Sample Data Storage
let patients = JSON.parse(localStorage.getItem('clinic_patients')) || [];
let medicines = JSON.parse(localStorage.getItem('clinic_medicines')) || [
    {
        id: 1,
        name: "Paracetamol 500mg",
        batchNo: "BATCH001",
        expiryDate: "2026-01-21",
        quantity: 100,
        purchasePrice: 2.00,
        mrp: 2.50,
        unit: "Tablet",
        category: "Pain Relief",
        minStock: 20,
        lastPurchaseDate: "2026-01-21",
        lastSaleDate: null
    },

    {
        id: 2,
        name: "Amoxicillin 250mg",
        batchNo: "BATCH002",
        expiryDate: "2026-01-21",
        quantity: 50,
        purchasePrice: 4.50,
        mrp: 5.75,
        unit: "Capsule",
        category: "Antibiotic",
        minStock: 15,
        lastPurchaseDate: "2026-01-21",
        lastSaleDate: null
    },
    {
        id: 3,
        name: "Cetirizine 10mg",
        batchNo: "BATCH003",
        expiryDate: "2026-01-21",
        quantity: 80,
        purchasePrice: 1.50,
        mrp: 2.00,
        unit: "Tablet",
        category: "Allergy",
        minStock: 25,
        lastPurchaseDate: "2026-01-21",
        lastSaleDate: null
    },
    {
        id: 4,
        name: "Omeprazole 20mg",
        batchNo: "BATCH004",
        expiryDate: "2026-01-21",
        quantity: 60,
        purchasePrice: 3.00,
        mrp: 4.00,
        unit: "Capsule",
        category: "Acidity",
        minStock: 20,
        lastPurchaseDate: "2026-01-21",
        lastSaleDate: null
    },
    {
        id: 5,
        name: "Azithromycin 250mg",
        batchNo: "BATCH005",
        expiryDate: "2026-01-21",
        quantity: 40,
        purchasePrice: 8.00,
        mrp: 10.00,
        unit: "Tablet",
        category: "Antibiotic",
        minStock: 15,
        lastPurchaseDate: "2026-01-21",
    }
];
let bills = JSON.parse(localStorage.getItem('clinic_bills')) || [];
let purchases = JSON.parse(localStorage.getItem('clinic_purchases')) || [];
let currentBillItems = [];
let currentPurchaseItems = [];
let itemCounter = 1;
let purchaseItemCounter = 1;
let editingMedicineId = null;
let editingBillItemSno = null;
let editingPatientId = null;
let selectedMedicines = [];
let selectedSales = [];
let medicineSearchTimeout;

// DOM Elements
const medicinesTableBody = document.getElementById('medicinesTable');
const selectAllMedicines = document.getElementById('selectAllMedicines');
const deleteSelectedMedicinesBtn = document.getElementById('deleteSelectedMedicines');
const medicineModal = document.getElementById('medicineModal');
const medicineModalTitle = document.getElementById('medicineModalTitle');
const saveMedicineBtn = document.getElementById('saveMedicineBtn');
const viewPurchaseModal = document.getElementById('viewPurchaseModal');
const purchaseDetailsContent = document.getElementById('purchaseDetailsContent');
const patientEditModal = document.getElementById('patientEditModal');
const patientModalTitle = document.getElementById('patientModalTitle');
const savePatientBtn = document.getElementById('savePatientBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeEventListeners();
    initializeMedicineSearch();
    updateMedicineSelect();
    updateTotal();
    loadPatientsTable();
    loadMedicinesTable();
    loadSalesTable();
    loadPurchasesHistory();
    loadStockReport();
    checkExpiryAlerts();
    initializePurchaseSection();
    
    // New Bill button
    document.getElementById('newBillBtn')?.addEventListener('click', function() {
        document.querySelector('[data-section="billing"]').click();
    });
});

// Initialize navigation
function initializeNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.dataset.section;
            
            // Update active button
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show selected section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === sectionId) {
                    section.classList.add('active');
                }
            });
        });
    });
}

// Initialize purchase section
function initializePurchaseSection() {
    // Set today's date for purchase
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('purchaseDate').value = today;
    
    // Add purchase item - FIXED: Ensure event listener is attached
    const addPurchaseItemBtn = document.getElementById('addPurchaseItemBtn');
    if (addPurchaseItemBtn) {
        // Remove any existing event listeners to avoid duplicates
        addPurchaseItemBtn.removeEventListener('click', addPurchaseItem);
        addPurchaseItemBtn.addEventListener('click', addPurchaseItem);
    }
    
    // Save purchase
    document.getElementById('savePurchaseBtn')?.addEventListener('click', savePurchase);
    
    // Clear purchase form
    document.getElementById('clearPurchaseBtn')?.addEventListener('click', clearPurchaseForm);
    
    // Filter purchases
    document.getElementById('filterPurchasesBtn')?.addEventListener('click', loadPurchasesHistory);
    
    // Filter stock
    document.getElementById('filterStockBtn')?.addEventListener('click', loadStockReport);
}

// Initialize medicine search with autocomplete
function initializeMedicineSearch() {
    const medicineSearchInput = document.getElementById('medicineSearch');
    if (!medicineSearchInput) return;
    
    // Create dropdown container
    const dropdown = document.createElement('div');
    dropdown.id = 'medicineSearchDropdown';
    dropdown.className = 'autocomplete-dropdown';
    medicineSearchInput.parentNode.appendChild(dropdown);
    
    // Search on input
    medicineSearchInput.addEventListener('input', function() {
        clearTimeout(medicineSearchTimeout);
        medicineSearchTimeout = setTimeout(() => {
            const searchTerm = this.value.toLowerCase().trim();
            dropdown.innerHTML = '';
            
            if (!searchTerm) {
                dropdown.style.display = 'none';
                return;
            }
            
            // Search in medicines array (only those with stock > 0)
            const filteredMedicines = medicines.filter(med => 
                med.name.toLowerCase().includes(searchTerm) && 
                med.quantity > 0
            );
            
            if (filteredMedicines.length === 0) {
                dropdown.innerHTML = '<div class="no-results">No medicines found</div>';
                dropdown.style.display = 'block';
                return;
            }
            
            // Add results to dropdown
            filteredMedicines.forEach(med => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.innerHTML = `
                    <div class="medicine-info">
                        <div class="medicine-name">${med.name}</div>
                        <div class="medicine-details">
                            <span>Batch: ${med.batchNo}</span>
                            <span>Exp: ${med.expiryDate}</span>
                            <span class="medicine-stock">Stock: ${med.quantity} ${med.unit}</span>
                        </div>
                    </div>
                    <div class="medicine-price">₹${med.mrp.toFixed(2)}</div>
                `;
                
                item.addEventListener('click', () => {
                    addMedicineFromSearch(med);
                    medicineSearchInput.value = '';
                    dropdown.style.display = 'none';
                });
                
                dropdown.appendChild(item);
            });
            
            dropdown.style.display = 'block';
        }, 300);
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!medicineSearchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    // Show dropdown on focus
    medicineSearchInput.addEventListener('focus', function() {
        if (this.value.trim()) {
            this.dispatchEvent(new Event('input'));
        }
    });
}

// Function to add medicine from search
function addMedicineFromSearch(medicine) {
    // Check if medicine already exists in bill
    const existingItem = currentBillItems.find(item => item.medId === medicine.id);
    
    if (existingItem) {
        // Ask user if they want to increase quantity
        const increaseQuantity = confirm(`${medicine.name} is already in the bill. Do you want to add one more?`);
        
        if (increaseQuantity) {
            const newQuantity = existingItem.quantity + 1;
            
            // Check stock availability
            if (medicine.quantity >= newQuantity) {
                existingItem.quantity = newQuantity;
                existingItem.amount = newQuantity * existingItem.price;
                updateMedicineTable();
                updateTotal();
                
                // Update medicine stock
                medicine.quantity -= 1;
                localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
                
                showToast(`${medicine.name} quantity increased to ${newQuantity}`, 'success');
            } else {
                showToast(`Insufficient stock! Available: ${medicine.quantity} ${medicine.unit}`, 'error');
            }
        }
        return;
    }
    
    // Add new medicine to bill with default quantity 1
    const quantity = 1;
    const price = medicine.mrp;
    const amount = quantity * price;
    
    // Check stock availability
    if (medicine.quantity < quantity) {
        showToast(`Insufficient stock! Available: ${medicine.quantity} ${medicine.unit}`, 'error');
        return;
    }
    
    // Create new bill item
    const item = {
        sno: itemCounter++,
        medId: medicine.id,
        name: medicine.name,
        batchNo: medicine.batchNo,
        expiryDate: medicine.expiryDate,
        quantity: quantity,
        price: price,
        amount: amount,
        unit: medicine.unit
    };
    
    // Add to current bill items
    currentBillItems.push(item);
    
    // Update medicine stock
    medicine.quantity -= quantity;
    medicine.lastSaleDate = new Date().toISOString().split('T')[0];
    localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
    
    // Update UI
    updateMedicineTable();
    updateTotal();
    
    // Update medicine dropdown in modal
    updateMedicineSelect();
    
    // Show success message
    showToast(`${medicine.name} added to bill successfully!`, 'success');
}

// Show toast notification
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        color: white;
        border-radius: 4px;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize event listeners
function initializeEventListeners() {
    // Add medicine to bill (modal button)
    document.getElementById('addMedicineBtn')?.addEventListener('click', () => {
        editingBillItemSno = null;
        document.getElementById('medicineModalTitle').textContent = 'Add Medicine to Bill';
        document.getElementById('addMedToBillBtn').style.display = 'block';
        document.getElementById('updateMedInBillBtn').style.display = 'none';
        document.getElementById('addMedicineForm').reset();
        document.getElementById('addMedicineModal')?.classList.add('active');
    });

    // Close modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        });
    });

    // Close preview modal
    document.getElementById('closePreviewBtn')?.addEventListener('click', () => {
        document.getElementById('billPreviewModal').classList.remove('active');
    });

    // Add medicine to bill from modal
    document.getElementById('addMedToBillBtn')?.addEventListener('click', addMedicineToBill);
    
    // Update medicine in bill
    document.getElementById('updateMedInBillBtn')?.addEventListener('click', updateMedicineInBill);

    // Discount calculation
    document.getElementById('discount')?.addEventListener('input', updateTotal);

    // Print bill
    document.getElementById('printBillBtn')?.addEventListener('click', generateBillPreview);
    document.getElementById('confirmPrintBtn')?.addEventListener('click', printBill);

    // Save bill
    document.getElementById('saveBillBtn')?.addEventListener('click', saveBill);

    // Clear bill
    document.getElementById('clearBillBtn')?.addEventListener('click', clearBill);
    
    // Expiry alerts
    document.getElementById('expiryAlertBtn')?.addEventListener('click', () => {
        document.querySelector('[data-section="inventory"]').click();
    });
    
    // Add medicine from inventory
    document.getElementById('addMedicineInventoryBtn')?.addEventListener('click', () => {
        editingMedicineId = null;
        medicineModalTitle.textContent = 'Add New Medicine';
        document.getElementById('medicineForm')?.reset();
        medicineModal.classList.add('active');
    });
    
    // Save medicine
    saveMedicineBtn?.addEventListener('click', saveMedicine);
    
    // Select all medicines checkbox
    selectAllMedicines?.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.medicine-checkbox');
        checkboxes.forEach(cb => cb.checked = this.checked);
        updateSelectedMedicines();
    });
    
    // Delete selected medicines
    deleteSelectedMedicinesBtn?.addEventListener('click', deleteSelectedMedicines);
    
    // Medicine selection change in modal
    document.getElementById('medName')?.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.dataset.price) {
            document.getElementById('medPrice').value = selectedOption.dataset.price;
            document.getElementById('medBatch').value = selectedOption.dataset.batch;
            document.getElementById('medExpiry').value = selectedOption.dataset.expiry;
        }
    });
    
    // Add patient button
    document.getElementById('addPatientBtn')?.addEventListener('click', addNewPatient);
    
    // Delete selected patients button
    document.getElementById('deleteSelectedPatientsBtn')?.addEventListener('click', deleteSelectedPatients);
    
    // Select all patients checkbox
    const selectAllPatients = document.getElementById('selectAllPatients');
    if (selectAllPatients) {
        selectAllPatients.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.patient-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    }
    
    // Filter sales button
    document.getElementById('filterSalesBtn')?.addEventListener('click', loadSalesTable);
    
    // Delete selected sales button
    document.getElementById('deleteSelectedSalesBtn')?.addEventListener('click', deleteSelectedSales);
    
    // Select all sales checkbox
    const selectAllSales = document.getElementById('selectAllSales');
    if (selectAllSales) {
        selectAllSales.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.sale-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    }
    
    // Save patient button
    savePatientBtn?.addEventListener('click', savePatient);
    
    // Initialize inline editing
    initializeInlineEditing();
}

// Initialize inline editing for quantity
function initializeInlineEditing() {
    // Add event delegation for inline quantity editing
    document.addEventListener('click', function(e) {
        // Handle quantity display click
        if (e.target.classList.contains('quantity-display')) {
            const sno = parseInt(e.target.dataset.sno);
            const item = currentBillItems.find(item => item.sno === sno);
            if (item) {
                const cell = e.target.parentElement;
                const display = e.target;
                
                // Create input element
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'quantity-input';
                input.value = item.quantity;
                input.min = 1;
                input.dataset.sno = sno;
                input.style.width = '60px';
                
                // Replace display with input
                display.style.display = 'none';
                cell.appendChild(input);
                input.focus();
                
                // Select the text
                input.select();
                
                // Handle input events
                input.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        updateQuantityFromInput(sno, input.value);
                    } else if (e.key === 'Escape') {
                        cancelQuantityEdit(sno);
                    }
                });
                
                input.addEventListener('blur', function() {
                    updateQuantityFromInput(sno, input.value);
                });
            }
        }
    });
}

// Update quantity from inline input
function updateQuantityFromInput(sno, newQuantity) {
    const item = currentBillItems.find(item => item.sno === sno);
    if (!item) return;
    
    newQuantity = parseInt(newQuantity);
    if (isNaN(newQuantity) || newQuantity < 1) {
        cancelQuantityEdit(sno);
        return;
    }
    
    const medicine = medicines.find(m => m.id === item.medId);
    if (!medicine) {
        cancelQuantityEdit(sno);
        return;
    }
    
    // Calculate difference
    const oldQuantity = item.quantity;
    const difference = newQuantity - oldQuantity;
    
    // Check stock
    if (difference > 0 && medicine.quantity < difference) {
        showToast(`Insufficient stock! Available: ${medicine.quantity} ${medicine.unit}`, 'error');
        cancelQuantityEdit(sno);
        return;
    }
    
    // Update quantity
    item.quantity = newQuantity;
    item.amount = newQuantity * item.price;
    
    // Update medicine stock
    medicine.quantity -= difference;
    medicine.lastSaleDate = new Date().toISOString().split('T')[0];
    localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
    
    // Update UI
    updateMedicineTable();
    updateTotal();
    showToast(`${item.name} quantity updated to ${newQuantity}`, 'success');
}

// Cancel inline editing
function cancelQuantityEdit(sno) {
    const input = document.querySelector(`.quantity-input[data-sno="${sno}"]`);
    const display = document.querySelector(`.quantity-display[data-sno="${sno}"]`);
    
    if (input) {
        input.remove();
    }
    if (display) {
        display.style.display = 'inline';
    }
}

// Update medicine select dropdown in modal
function updateMedicineSelect() {
    const medNameSelect = document.getElementById('medName');
    if (!medNameSelect) return;
    
    medNameSelect.innerHTML = '<option value="">Select Medicine</option>';
    medicines.forEach(med => {
        if (med.quantity > 0) {
            const option = document.createElement('option');
            option.value = med.id;
            option.textContent = `${med.name} (Stock: ${med.quantity} ${med.unit})`;
            option.dataset.price = med.mrp;
            option.dataset.batch = med.batchNo;
            option.dataset.expiry = med.expiryDate;
            medNameSelect.appendChild(option);
        }
    });
}

// Add medicine to bill from modal
function addMedicineToBill() {
    const medId = parseInt(document.getElementById('medName').value);
    const quantity = parseInt(document.getElementById('medQuantity').value);
    const price = parseFloat(document.getElementById('medPrice').value);
    const batchNo = document.getElementById('medBatch').value;
    const expiryDate = document.getElementById('medExpiry').value;

    if (!medId || quantity <= 0 || price <= 0) {
        alert('Please fill all required fields correctly');
        return;
    }

    const medicine = medicines.find(m => m.id === medId);
    if (!medicine) {
        alert('Medicine not found');
        return;
    }
    
    if (medicine.quantity < quantity) {
        alert(`Insufficient stock! Available: ${medicine.quantity} ${medicine.unit}`);
        return;
    }

    const amount = quantity * price;
    
    const item = {
        sno: itemCounter++,
        medId,
        name: medicine.name,
        batchNo,
        expiryDate,
        quantity,
        price,
        amount,
        unit: medicine.unit
    };

    currentBillItems.push(item);
    updateMedicineTable();
    updateMedicineSelect();
    updateTotal();
    
    // Update medicine stock
    medicine.quantity -= quantity;
    medicine.lastSaleDate = new Date().toISOString().split('T')[0];
    localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
    
    document.getElementById('addMedicineForm').reset();
    document.getElementById('addMedicineModal').classList.remove('active');
    
    showToast(`${medicine.name} added to bill successfully!`, 'success');
}

// Update medicine in bill
function updateMedicineInBill() {
    const sno = parseInt(document.getElementById('editItemSno').value);
    const medId = parseInt(document.getElementById('medName').value);
    const quantity = parseInt(document.getElementById('medQuantity').value);
    const price = parseFloat(document.getElementById('medPrice').value);
    const batchNo = document.getElementById('medBatch').value;
    const expiryDate = document.getElementById('medExpiry').value;

    if (!medId || quantity <= 0 || price <= 0) {
        alert('Please fill all required fields correctly');
        return;
    }

    // Find the item to update
    const itemIndex = currentBillItems.findIndex(item => item.sno === sno);
    if (itemIndex === -1) {
        alert('Item not found');
        return;
    }

    const oldItem = currentBillItems[itemIndex];
    const medicine = medicines.find(m => m.id === medId);
    if (!medicine) {
        alert('Medicine not found');
        return;
    }

    // Calculate stock difference
    const quantityDifference = quantity - oldItem.quantity;
    
    // Check if there's enough stock for the increase
    if (quantityDifference > 0 && medicine.quantity < quantityDifference) {
        alert(`Insufficient stock! Available: ${medicine.quantity} ${medicine.unit}`);
        return;
    }

    const amount = quantity * price;
    
    // Update the item
    currentBillItems[itemIndex] = {
        ...oldItem,
        medId,
        name: medicine.name,
        batchNo,
        expiryDate,
        quantity,
        price,
        amount,
        unit: medicine.unit
    };

    // Update medicine stock
    medicine.quantity -= quantityDifference;
    medicine.lastSaleDate = new Date().toISOString().split('T')[0];
    localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
    
    updateMedicineTable();
    updateTotal();
    
    document.getElementById('addMedicineForm').reset();
    document.getElementById('addMedicineModal').classList.remove('active');
    editingBillItemSno = null;
    
    showToast(`${medicine.name} updated successfully!`, 'success');
}

// Edit medicine item in bill
function editMedicineItem(sno) {
    const item = currentBillItems.find(item => item.sno === sno);
    if (!item) return;
    
    editingBillItemSno = sno;
    document.getElementById('medicineModalTitle').textContent = 'Edit Medicine Item';
    document.getElementById('addMedToBillBtn').style.display = 'none';
    document.getElementById('updateMedInBillBtn').style.display = 'block';
    document.getElementById('editItemSno').value = sno;
    
    // Populate form with item data
    document.getElementById('medName').value = item.medId;
    document.getElementById('medBatch').value = item.batchNo;
    document.getElementById('medExpiry').value = item.expiryDate;
    document.getElementById('medQuantity').value = item.quantity;
    document.getElementById('medPrice').value = item.price;
    
    document.getElementById('addMedicineModal').classList.add('active');
}

// Update medicine table in billing section
function updateMedicineTable() {
    const medicineItems = document.getElementById('medicineItems');
    if (!medicineItems) return;
    
    medicineItems.innerHTML = '';
    currentBillItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.sno}</td>
            <td>${item.name}</td>
            <td>${item.batchNo}</td>
            <td>${item.expiryDate}</td>
            <td>
                <span class="quantity-display" data-sno="${item.sno}" style="cursor: pointer;">
                    ${item.quantity} ${item.unit || ''}
                </span>
            </td>
            <td>₹${item.price.toFixed(2)}</td>
            <td>₹${item.amount.toFixed(2)}</td>
            <td>
                <button class="btn-secondary edit-bill-item" data-sno="${item.sno}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger remove-item" data-sno="${item.sno}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        medicineItems.appendChild(row);
    });

    // Add edit event listeners
    document.querySelectorAll('.edit-bill-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const sno = parseInt(this.dataset.sno);
            editMedicineItem(sno);
        });
    });

    // Add remove event listeners
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
            const sno = parseInt(this.dataset.sno);
            removeMedicineItem(sno);
        });
    });
}

// Remove medicine item from bill
function removeMedicineItem(sno) {
    const item = currentBillItems.find(item => item.sno === sno);
    if (item) {
        // Restore medicine quantity
        const medicine = medicines.find(m => m.id === item.medId);
        if (medicine) {
            medicine.quantity += item.quantity;
            localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
        }
    }
    
    currentBillItems = currentBillItems.filter(item => item.sno !== sno);
    updateMedicineTable();
    updateMedicineSelect();
    updateTotal();
    
    if (item) {
        showToast(`${item.name} removed from bill`, 'success');
    }
}

// Update total amount
function updateTotal() {
    const total = currentBillItems.reduce((sum, item) => sum + item.amount, 0);
    const discountValue = parseFloat(document.getElementById('discount')?.value) || 0;
    const discountAmount = total * (discountValue / 100);
    const final = total - discountAmount;

    document.getElementById('totalAmount').textContent = `₹${total.toFixed(2)}`;
    document.getElementById('finalAmount').value = `₹${final.toFixed(2)}`;
}

// Load medicines table with CRUD operations
function loadMedicinesTable() {
    if (!medicinesTableBody) return;
    
    medicinesTableBody.innerHTML = '';
    selectedMedicines = [];
    
    medicines.forEach((med, index) => {
        const expiryDate = new Date(med.expiryDate);
        const today = new Date();
        const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let statusClass = '';
        let statusText = '';
        
        if (daysToExpiry < 0) {
            statusClass = 'stock-expired';
            statusText = 'Expired';
        } else if (daysToExpiry <= 30) {
            statusClass = 'stock-critical';
            statusText = `Expiring in ${daysToExpiry} days`;
        } else if (med.quantity <= med.minStock) {
            statusClass = 'stock-low';
            statusText = 'Low Stock';
        } else {
            statusClass = 'stock-good';
            statusText = 'In Stock';
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <input type="checkbox" class="medicine-checkbox" value="${med.id}" onchange="updateSelectedMedicines()">
            </td>
            <td>${index + 1}</td>
            <td>${med.name}</td>
            <td>${med.batchNo}</td>
            <td>${med.expiryDate}</td>
            <td>${med.quantity} ${med.unit}</td>
            <td>₹${med.purchasePrice.toFixed(2)}</td>
            <td>₹${med.mrp.toFixed(2)}</td>
            <td><span class="stock-indicator ${statusClass}">${statusText}</span></td>
            <td class="action-buttons-small">
                <button class="btn-secondary" onclick="editMedicine(${med.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger" onclick="deleteMedicine(${med.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        medicinesTableBody.appendChild(row);
    });
    
    if (medicines.length === 0) {
        medicinesTableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center">No medicines found in inventory</td>
            </tr>
        `;
    }
}

// Update selected medicines array
function updateSelectedMedicines() {
    selectedMedicines = [];
    document.querySelectorAll('.medicine-checkbox:checked').forEach(cb => {
        selectedMedicines.push(parseInt(cb.value));
    });
    
    // Update select all checkbox
    const allCheckboxes = document.querySelectorAll('.medicine-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.medicine-checkbox:checked');
    if (selectAllMedicines) {
        selectAllMedicines.checked = allCheckboxes.length > 0 && allCheckboxes.length === checkedCheckboxes.length;
    }
}

// Delete selected medicines
function deleteSelectedMedicines() {
    if (selectedMedicines.length === 0) {
        alert('Please select medicines to delete');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedMedicines.length} selected medicine(s)?`)) {
        medicines = medicines.filter(med => !selectedMedicines.includes(med.id));
        localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
        loadMedicinesTable();
        updateMedicineSelect();
        checkExpiryAlerts();
        showToast(`${selectedMedicines.length} medicine(s) deleted successfully!`, 'success');
    }
}

// Edit medicine
function editMedicine(id) {
    const medicine = medicines.find(m => m.id === id);
    if (!medicine) return;
    
    editingMedicineId = id;
    medicineModalTitle.textContent = 'Edit Medicine';
    
    // Populate form
    document.getElementById('modalMedName').value = medicine.name;
    document.getElementById('modalMedBatch').value = medicine.batchNo;
    document.getElementById('modalMedExpiry').value = medicine.expiryDate;
    document.getElementById('modalMedQuantity').value = medicine.quantity;
    document.getElementById('modalMedUnit').value = medicine.unit;
    document.getElementById('modalPurchasePrice').value = medicine.purchasePrice;
    document.getElementById('modalMRP').value = medicine.mrp;
    document.getElementById('modalMedCategory').value = medicine.category;
    document.getElementById('modalMinStock').value = medicine.minStock;
    
    medicineModal.classList.add('active');
}

// Save medicine (add/edit)
function saveMedicine() {
    const form = document.getElementById('medicineForm');
    if (!form.checkValidity()) {
        alert('Please fill all required fields');
        return;
    }
    
    const medicineData = {
        id: editingMedicineId || medicines.length + 1,
        name: document.getElementById('modalMedName').value,
        batchNo: document.getElementById('modalMedBatch').value,
        expiryDate: document.getElementById('modalMedExpiry').value,
        quantity: parseInt(document.getElementById('modalMedQuantity').value),
        unit: document.getElementById('modalMedUnit').value,
        purchasePrice: parseFloat(document.getElementById('modalPurchasePrice').value),
        mrp: parseFloat(document.getElementById('modalMRP').value),
        category: document.getElementById('modalMedCategory').value,
        minStock: parseInt(document.getElementById('modalMinStock').value) || 10,
        lastPurchaseDate: new Date().toISOString().split('T')[0],
        lastSaleDate: null
    };
    
    if (editingMedicineId) {
        // Update existing medicine
        const index = medicines.findIndex(m => m.id === editingMedicineId);
        if (index !== -1) {
            medicines[index] = { ...medicines[index], ...medicineData };
        }
    } else {
        // Add new medicine
        medicines.push(medicineData);
    }
    
    localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
    medicineModal.classList.remove('active');
    loadMedicinesTable();
    updateMedicineSelect();
    checkExpiryAlerts();
    showToast('Medicine saved successfully!', 'success');
}

// Delete single medicine
function deleteMedicine(id) {
    if (confirm('Are you sure you want to delete this medicine?')) {
        medicines = medicines.filter(med => med.id !== id);
        localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
        loadMedicinesTable();
        updateMedicineSelect();
        checkExpiryAlerts();
        showToast('Medicine deleted successfully!', 'success');
    }
}

// Purchase Management Functions
function addPurchaseItem() {
    const itemName = document.getElementById('newItemName').value;
    const batchNo = document.getElementById('newBatchNo').value;
    const expiryDate = document.getElementById('newExpiryDate').value;
    const unit = document.getElementById('newUnit').value;
    const quantity = parseInt(document.getElementById('newQuantity').value);
    const purchaseRate = parseFloat(document.getElementById('newPurchaseRate').value);
    const mrp = parseFloat(document.getElementById('newMRP').value);
    
    if (!itemName || !batchNo || !expiryDate || quantity <= 0 || purchaseRate <= 0 || mrp <= 0) {
        alert('Please fill all item details correctly including expiry date');
        return;
    }
    
    const total = quantity * purchaseRate;
    const item = {
        sno: purchaseItemCounter++,
        name: itemName,
        batchNo,
        expiryDate: expiryDate,
        unit,
        quantity,
        purchaseRate,
        mrp,
        total
    };
    
    currentPurchaseItems.push(item);
    updatePurchaseItemsTable();
    
    // Clear input fields
    document.getElementById('newItemName').value = '';
    document.getElementById('newBatchNo').value = '';
    document.getElementById('newExpiryDate').value = '';
    document.getElementById('newQuantity').value = 1;
    document.getElementById('newPurchaseRate').value = '';
    document.getElementById('newMRP').value = '';
}

function updatePurchaseItemsTable() {
    const tbody = document.getElementById('purchaseItems');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (currentPurchaseItems.length === 0) {
        tbody.innerHTML = `
            <tr id="noPurchaseItems">
                <td colspan="10" class="text-center">No items added</td>
            </tr>
        `;
        document.getElementById('purchaseTotal').textContent = '₹0.00';
        return;
    }
    
    let grandTotal = 0;
    
    currentPurchaseItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.sno}</td>
            <td>${item.name}</td>
            <td>${item.batchNo}</td>
            <td>${item.expiryDate}</td>
            <td>${item.unit}</td>
            <td>${item.quantity}</td>
            <td>₹${item.purchaseRate.toFixed(2)}</td>
            <td>₹${item.mrp.toFixed(2)}</td>
            <td>₹${item.total.toFixed(2)}</td>
            <td>
                <button class="btn-danger" onclick="removePurchaseItem(${item.sno})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
        grandTotal += item.total;
    });
    
    document.getElementById('purchaseTotal').textContent = `₹${grandTotal.toFixed(2)}`;
}

function removePurchaseItem(sno) {
    currentPurchaseItems = currentPurchaseItems.filter(item => item.sno !== sno);
    updatePurchaseItemsTable();
}

function savePurchase() {
    const purchaseDate = document.getElementById('purchaseDate').value;
    const supplierName = document.getElementById('distributedBy').value;
    const receivedBy = document.getElementById('receivedBy').value;
    
    if (!purchaseDate || !supplierName || !receivedBy) {
        alert('Please fill all purchase details');
        return;
    }
    
    if (currentPurchaseItems.length === 0) {
        alert('Please add at least one item to the purchase');
        return;
    }
    
    const purchaseTotal = currentPurchaseItems.reduce((sum, item) => sum + item.total, 0);
    
    const purchase = {
        id: purchases.length + 1,
        purchaseNumber: `PUR-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${purchases.length + 1}`,
        date: purchaseDate,
        supplier: supplierName,
        receivedBy: receivedBy,
        items: [...currentPurchaseItems],
        total: purchaseTotal
    };
    
    // Update medicine inventory
    currentPurchaseItems.forEach(item => {
        // Check if medicine exists
        const existingMed = medicines.find(m => 
            m.name === item.name && m.batchNo === item.batchNo
        );
        
        if (existingMed) {
            // Update existing medicine
            existingMed.quantity += item.quantity;
            existingMed.purchasePrice = item.purchaseRate;
            existingMed.mrp = item.mrp;
            existingMed.expiryDate = item.expiryDate;
            existingMed.lastPurchaseDate = purchaseDate;
        } else {
            // Add new medicine
            const newMed = {
                id: medicines.length + 1,
                name: item.name,
                batchNo: item.batchNo,
                expiryDate: item.expiryDate,
                quantity: item.quantity,
                purchasePrice: item.purchaseRate,
                mrp: item.mrp,
                unit: item.unit,
                category: 'General',
                minStock: 10,
                lastPurchaseDate: purchaseDate,
                lastSaleDate: null
            };
            medicines.push(newMed);
        }
    });
    
    purchases.push(purchase);
    
    // Save to localStorage
    localStorage.setItem('clinic_purchases', JSON.stringify(purchases));
    localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
    
    showToast('Purchase saved successfully!', 'success');
    clearPurchaseForm();
    loadMedicinesTable();
    loadPurchasesHistory();
    loadStockReport();
    updateMedicineSelect();
    checkExpiryAlerts();
}

function clearPurchaseForm() {
    document.getElementById('distributedBy').value = '';
    document.getElementById('receivedBy').value = '';
    document.getElementById('newItemName').value = '';
    document.getElementById('newBatchNo').value = '';
    document.getElementById('newExpiryDate').value = '';
    document.getElementById('newQuantity').value = 1;
    document.getElementById('newPurchaseRate').value = '';
    document.getElementById('newMRP').value = '';
    currentPurchaseItems = [];
    purchaseItemCounter = 1;
    updatePurchaseItemsTable();
}

function loadPurchasesHistory() {
    const startDate = document.getElementById('purchaseStartDate')?.value;
    const endDate = document.getElementById('purchaseEndDate')?.value;
    const table = document.getElementById('purchasesHistoryTable');
    
    if (!table) return;
    
    let filteredPurchases = purchases;
    
    if (startDate && endDate) {
        filteredPurchases = purchases.filter(p => {
            const purchaseDate = new Date(p.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            
            return purchaseDate >= start && purchaseDate < end;
        });
    }
    
    table.innerHTML = filteredPurchases.map(purchase => `
        <tr>
            <td>${purchase.purchaseNumber}</td>
            <td>${purchase.date}</td>
            <td>${purchase.supplier}</td>
            <td>${purchase.receivedBy}</td>
            <td>${purchase.items.length}</td>
            <td>₹${purchase.total.toFixed(2)}</td>
            <td>
                <button class="btn-secondary btn-sm" onclick="viewPurchaseDetails(${purchase.id})">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn-danger btn-sm" onclick="deletePurchase(${purchase.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="7">No purchase records found</td></tr>';
}

// Delete single purchase
function deletePurchase(id) {
    if (confirm('Are you sure you want to delete this purchase? This will also update medicine inventory.')) {
        const purchase = purchases.find(p => p.id === id);
        if (!purchase) return;
        
        // Reverse inventory changes
        purchase.items.forEach(item => {
            const medicine = medicines.find(m => 
                m.name === item.name && m.batchNo === item.batchNo
            );
            if (medicine) {
                medicine.quantity -= item.quantity;
                if (medicine.quantity < 0) medicine.quantity = 0;
            }
        });
        
        // Remove purchase
        purchases = purchases.filter(p => p.id !== id);
        
        // Update IDs
        purchases.forEach((p, index) => {
            p.id = index + 1;
        });
        
        localStorage.setItem('clinic_purchases', JSON.stringify(purchases));
        localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
        
        loadPurchasesHistory();
        loadMedicinesTable();
        updateMedicineSelect();
        checkExpiryAlerts();
        showToast('Purchase deleted successfully!', 'success');
    }
}

function viewPurchaseDetails(purchaseId) {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (!purchase) return;
    
    purchaseDetailsContent.innerHTML = `
        <div class="purchase-details">
            <h3>Purchase Details: ${purchase.purchaseNumber}</h3>
            <div class="purchase-detail-item">
                <p><strong>Date:</strong> ${purchase.date}</p>
                <p><strong>Supplier:</strong> ${purchase.supplier}</p>
                <p><strong>Received By:</strong> ${purchase.receivedBy}</p>
            </div>
            
            <h4>Items Purchased:</h4>
            <table class="purchase-items-table">
                <thead>
                    <tr>
                        <th>S.No</th>
                        <th>Item Name</th>
                        <th>Batch No.</th>
                        <th>Expiry Date</th>
                        <th>Unit</th>
                        <th>Quantity</th>
                        <th>Purchase Rate</th>
                        <th>MRP</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${purchase.items.map(item => `
                        <tr>
                            <td>${item.sno}</td>
                            <td>${item.name}</td>
                            <td>${item.batchNo}</td>
                            <td>${item.expiryDate}</td>
                            <td>${item.unit}</td>
                            <td>${item.quantity}</td>
                            <td>₹${item.purchaseRate.toFixed(2)}</td>
                            <td>₹${item.mrp.toFixed(2)}</td>
                            <td>₹${item.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="8" style="text-align: right;"><strong>Grand Total:</strong></td>
                        <td><strong>₹${purchase.total.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
    `;
    
    viewPurchaseModal.classList.add('active');
}

function loadStockReport() {
    const statusFilter = document.getElementById('stockStatusFilter')?.value;
    const today = new Date();
    const table = document.getElementById('stockReportTable');
    
    if (!table) return;
    
    let filteredMedicines = medicines;
    
    switch(statusFilter) {
        case 'low':
            filteredMedicines = medicines.filter(m => m.quantity < 20);
            break;
        case 'critical':
            filteredMedicines = medicines.filter(m => m.quantity < 10);
            break;
        case 'expired':
            filteredMedicines = medicines.filter(m => new Date(m.expiryDate) < today);
            break;
        case 'expiring':
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(today.getDate() + 30);
            filteredMedicines = medicines.filter(m => {
                const expiry = new Date(m.expiryDate);
                return expiry > today && expiry <= thirtyDaysFromNow;
            });
            break;
    }
    
    table.innerHTML = filteredMedicines.map(med => {
        const expiryDate = new Date(med.expiryDate);
        const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let status = '';
        if (daysToExpiry < 0) {
            status = '<span class="stock-indicator stock-expired">Expired</span>';
        } else if (daysToExpiry <= 30) {
            status = `<span class="stock-indicator stock-critical">Expiring in ${daysToExpiry} days</span>`;
        } else if (med.quantity <= med.minStock) {
            status = '<span class="stock-indicator stock-low">Low Stock</span>';
        } else {
            status = '<span class="stock-indicator stock-good">In Stock</span>';
        }
        
        return `
            <tr>
                <td>${med.name}</td>
                <td>${med.batchNo}</td>
                <td>${med.quantity} ${med.unit}</td>
                <td>${med.minStock} ${med.unit}</td>
                <td>${med.lastPurchaseDate || 'N/A'}</td>
                <td>${med.lastSaleDate || 'N/A'}</td>
                <td>${status}</td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="7">No stock data found</td></tr>';
}

// Generate bill preview
// ... (rest of the code remains the same until generateBillPreview function) ...

// Generate bill preview
function generateBillPreview() {
    const patientName = document.getElementById('patientName').value;
    const doctorName = document.getElementById('doctorName').value;
    const patientAge = document.getElementById('patientAge').value;
    const patientGender = document.getElementById('patientGender').value;
    const patientPhone = document.getElementById('patientPhone').value;
    const patientAddress = document.getElementById('patientAddress').value;
    const paymentMode = document.getElementById('paymentMode').value;
    const discountValue = parseFloat(document.getElementById('discount').value) || 0;
    const total = currentBillItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = total * (discountValue / 100);
    const final = total - discountAmount;

    // Only check if there are medicines in the bill
    if (currentBillItems.length === 0) {
        alert('Please add at least one medicine to the bill');
        return;
    }

    const now = new Date();
    const billNumber = `AM-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${bills.length + 1}`;
    
    // Build patient details dynamically - no mandatory fields
    let patientDetailsHTML = '';
    const details = [];
    
    if (patientName && patientName.trim() !== '') {
        details.push(`<strong>Patient:</strong> ${patientName}`);
    }
    
    if (patientAge && patientAge.trim() !== '') {
        details.push(`<strong>Age:</strong> ${patientAge}`);
    }
    
    if (patientGender && patientGender.trim() !== '') {
        details.push(`<strong>Gender:</strong> ${patientGender}`);
    }
    
    if (details.length > 0) {
        patientDetailsHTML = `<p>${details.join(' | ')}</p>`;
    }
    
    if (doctorName && doctorName.trim() !== '') {
        patientDetailsHTML += `<p><strong>Doctor:</strong> ${doctorName}</p>`;
    }
    
    if (patientPhone && patientPhone.trim() !== '') {
        patientDetailsHTML += `<p><strong>Phone:</strong> ${patientPhone}</p>`;
    }
    
    if (patientAddress && patientAddress.trim() !== '') {
        patientDetailsHTML += `<p><strong>Address:</strong> ${patientAddress}</p>`;
    }
    
    if (paymentMode) {
        patientDetailsHTML += `<p><strong>Payment Mode:</strong> ${paymentMode}</p>`;
    }
    
    const billContent = document.getElementById('billContent');
    billContent.innerHTML = `
        <div class="bill-header-no-logo">
            <div class="bill-clinic-info">
                <h2>ANASUYA MEDICALS & FANCY</h2>
                <p>D.No. 26/3/1564, Near GVRR College,
B.V. Nagar, Nellore - 524 004.</p>
                <p>Phone: +91 8309303688 | Email: anasuyamedicals242@gmail.com</p>
                <hr style="margin: 0.5rem 0;">
                <h3>MEDICINE BILL</h3>
                <p>Bill No: ${billNumber} | Date: ${now.toLocaleDateString()} | Time: ${now.toLocaleTimeString()}</p>
            </div>
        </div>
        
        ${patientDetailsHTML ? `<div class="bill-details">${patientDetailsHTML}</div>` : ''}
        
        <table class="bill-table">
            <thead>
                <tr>
                    <th>S.No</th>
                    <th>Particulars</th>
                    <th>Batch No.</th>
                    <th>Exp. Date</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${currentBillItems.map(item => `
                    <tr>
                        <td>${item.sno}</td>
                        <td>${item.name}</td>
                        <td>${item.batchNo}</td>
                        <td>${item.expiryDate}</td>
                        <td>${item.quantity} ${item.unit || ''}</td>
                        <td>₹${item.price.toFixed(2)}</td>
                        <td>₹${item.amount.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="bill-total">
            <p><strong>Sub Total:</strong> ₹${total.toFixed(2)}</p>
            ${discountValue > 0 ? `<p><strong>Discount (${discountValue}%):</strong> ₹${discountAmount.toFixed(2)}</p>` : ''}
            <p><strong>Final Amount:</strong> ₹${final.toFixed(2)}</p>
            <p style="margin-top: 1rem;"><strong>Amount in Words:</strong> ${numberToWords(final)}</p>
        </div>
        
        <div class="center-text">
            <p>Thank you for visiting!</p>
        </div>
    `;
    
    document.getElementById('billPreviewModal').classList.add('active');
}


// Save bill
function saveBill() {
    const patientName = document.getElementById('patientName').value;
    const doctorName = document.getElementById('doctorName').value;
    const patientAge = document.getElementById('patientAge').value;
    const patientGender = document.getElementById('patientGender').value;
    const patientPhone = document.getElementById('patientPhone').value;
    const patientAddress = document.getElementById('patientAddress').value;
    const paymentMode = document.getElementById('paymentMode').value;
    const discountValue = parseFloat(document.getElementById('discount').value) || 0;

    // Check if there are medicines in the bill
    if (currentBillItems.length === 0) {
        alert('Please add at least one medicine to the bill');
        return;
    }

    // Show warning if essential fields are missing but allow to proceed
    let warningMessage = '';
    const missingFields = [];
    
    if (!patientName || patientName.trim() === '') {
        missingFields.push('Patient Name');
    }
    
    if (!doctorName || doctorName.trim() === '') {
        missingFields.push('Doctor Name');
    }
    


    const now = new Date().toISOString().split('T')[0];
    
    // Update medicine quantities and last sale date
    currentBillItems.forEach(item => {
        const medicine = medicines.find(m => m.id === item.medId);
        if (medicine) {
            medicine.quantity -= item.quantity;
            medicine.lastSaleDate = now;
        }
    });

    const billNumber = `AM-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${bills.length + 1}`;
    
    const bill = {
        id: bills.length + 1,
        billNumber,
        date: new Date().toISOString(),
        patientName: patientName || 'Not Provided',
        doctorName: doctorName || 'Not Provided',
        patientAge,
        patientGender,
        patientPhone,
        patientAddress,
        paymentMode,
        discount: discountValue,
        items: [...currentBillItems],
        total: currentBillItems.reduce((sum, item) => sum + item.amount, 0)
    };

    bills.push(bill);
    
    // Save patient only if name is provided
    if (patientName && patientName.trim() !== '' && patientName !== 'Not Provided') {
        const existingPatientIndex = patients.findIndex(p => p.name.toLowerCase() === patientName.toLowerCase());
        if (existingPatientIndex === -1) {
            // Add new patient
            patients.push({
                id: patients.length + 1,
                name: patientName,
                age: patientAge,
                gender: patientGender,
                phone: patientPhone,
                address: patientAddress,
                lastVisit: new Date().toISOString()
            });
        } else {
            // Update existing patient
            patients[existingPatientIndex].lastVisit = new Date().toISOString();
            if (patientPhone) patients[existingPatientIndex].phone = patientPhone;
            if (patientAddress) patients[existingPatientIndex].address = patientAddress;
        }
    }

    // Save to localStorage
    localStorage.setItem('clinic_bills', JSON.stringify(bills));
    localStorage.setItem('clinic_patients', JSON.stringify(patients));
    localStorage.setItem('clinic_medicines', JSON.stringify(medicines));

    showToast('Bill saved successfully!', 'success');
    clearBill();
    loadSalesTable();
    loadMedicinesTable();
    loadPatientsTable();
}

// Also update the generateBillPreview function to show warning but proceed
function generateBillPreview() {
    const patientName = document.getElementById('patientName').value;
    const doctorName = document.getElementById('doctorName').value;
    const patientAge = document.getElementById('patientAge').value;
    const patientGender = document.getElementById('patientGender').value;
    const patientPhone = document.getElementById('patientPhone').value;
    const patientAddress = document.getElementById('patientAddress').value;
    const paymentMode = document.getElementById('paymentMode').value;
    const discountValue = parseFloat(document.getElementById('discount').value) || 0;
    const total = currentBillItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = total * (discountValue / 100);
    const final = total - discountAmount;

    // Only check if there are medicines in the bill
    if (currentBillItems.length === 0) {
        alert('Please add at least one medicine to the bill');
        return;
    }

    const now = new Date();
    const billNumber = `AM-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${bills.length + 1}`;
    
    // Build patient details dynamically
    let patientDetailsHTML = '';
    const details = [];
    
    // Add patient name if available
    if (patientName && patientName.trim() !== '') {
        details.push(`<strong>Patient:</strong> ${patientName}`);
    }
    
    // Add age if available
    if (patientAge && patientAge.trim() !== '') {
        details.push(`<strong>Age:</strong> ${patientAge}`);
    }
    
    // Add gender if available
    if (patientGender && patientGender.trim() !== '') {
        details.push(`<strong>Gender:</strong> ${patientGender}`);
    }
    
    // Build first line with patient info
    if (details.length > 0) {
        patientDetailsHTML = `<p>${details.join(' | ')}</p>`;
    }
    
    // Add doctor if available
    if (doctorName && doctorName.trim() !== '') {
        patientDetailsHTML += `<p><strong>Doctor:</strong> ${doctorName}</p>`;
    }
    
    // Add phone if available
    if (patientPhone && patientPhone.trim() !== '') {
        patientDetailsHTML += `<p><strong>Phone:</strong> ${patientPhone}</p>`;
    }
    
    // Add address if available
    if (patientAddress && patientAddress.trim() !== '') {
        patientDetailsHTML += `<p><strong>Address:</strong> ${patientAddress}</p>`;
    }
    
    // Add payment mode
    if (paymentMode) {
        patientDetailsHTML += `<p><strong>Payment Mode:</strong> ${paymentMode}</p>`;
    }
    
    const billContent = document.getElementById('billContent');
    billContent.innerHTML = `
        <div class="bill-header-no-logo">
            <div class="bill-clinic-info">
                <h2>ANASUYA MEDICALS & FANCY</h2>
                <p>D.No. 26/3/1564, Near GVRR College,
B.V. Nagar, Nellore - 524 004.</p>
                <p>Phone: +91 8309303688 | Email: anasuyamedicals242@gmail.com</p>
                <hr style="margin: 0.5rem 0;">
                <h3>MEDICINE BILL</h3>
                <p>Bill No: ${billNumber} | Date: ${now.toLocaleDateString()} | Time: ${now.toLocaleTimeString()}</p>
            </div>
        </div>
        
        ${patientDetailsHTML ? `<div class="bill-details">${patientDetailsHTML}</div>` : ''}
        
        <table class="bill-table">
            <thead>
                <tr>
                    <th>S.No</th>
                    <th>Particulars</th>
                    <th>Batch No.</th>
                    <th>Exp. Date</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${currentBillItems.map(item => `
                    <tr>
                        <td>${item.sno}</td>
                        <td>${item.name}</td>
                        <td>${item.batchNo}</td>
                        <td>${item.expiryDate}</td>
                        <td>${item.quantity} ${item.unit || ''}</td>
                        <td>₹${item.price.toFixed(2)}</td>
                        <td>₹${item.amount.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div class="bill-total">
            <p><strong>Sub Total:</strong> ₹${total.toFixed(2)}</p>
            ${discountValue > 0 ? `<p><strong>Discount (${discountValue}%):</strong> ₹${discountAmount.toFixed(2)}</p>` : ''}
            <p><strong>Final Amount:</strong> ₹${final.toFixed(2)}</p>
            <p style="margin-top: 1rem;"><strong>Amount in Words:</strong> ${numberToWords(final)}</p>
        </div>
        
        <div class="center-text">
            <p>Thank you for visiting!</p>
        </div>
    `;
    
    document.getElementById('billPreviewModal').classList.add('active');
}

// ... (rest of the code remains the same) ...

// Clear bill
function clearBill() {
    // Restore medicine quantities
    currentBillItems.forEach(item => {
        const medicine = medicines.find(m => m.id === item.medId);
        if (medicine) {
            medicine.quantity += item.quantity;
        }
    });
    
    currentBillItems = [];
    itemCounter = 1;
    document.getElementById('patientName').value = '';
    document.getElementById('doctorName').value = '';
    document.getElementById('patientAge').value = '';
    document.getElementById('patientGender').value = '';
    document.getElementById('patientPhone').value = '';
    document.getElementById('patientAddress').value = '';
    document.getElementById('discount').value = '0';
    document.getElementById('paymentMode').value = 'Cash';
    updateMedicineTable();
    updateTotal();
    updateMedicineSelect();
    localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
}

// Print bill
// Print bill function (saves first, then prints)
function printBill() {
    // First, get all the form values
    const patientName = document.getElementById('patientName').value;
    const doctorName = document.getElementById('doctorName').value;
    const patientAge = document.getElementById('patientAge').value;
    const patientGender = document.getElementById('patientGender').value;
    const patientPhone = document.getElementById('patientPhone').value;
    const patientAddress = document.getElementById('patientAddress').value;
    const paymentMode = document.getElementById('paymentMode').value;
    const discountValue = parseFloat(document.getElementById('discount').value) || 0;
    
    // Check if there are medicines in the bill
    if (currentBillItems.length === 0) {
        alert('Please add at least one medicine to the bill');
        return;
    }

    const now = new Date().toISOString().split('T')[0];
    const total = currentBillItems.reduce((sum, item) => sum + item.amount, 0);
    const discountAmount = total * (discountValue / 100);
    const final = total - discountAmount;

    // Update medicine quantities and last sale date
    currentBillItems.forEach(item => {
        const medicine = medicines.find(m => m.id === item.medId);
        if (medicine) {
            medicine.quantity -= item.quantity;
            medicine.lastSaleDate = now;
        }
    });

    const billNumber = `AM-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${bills.length + 1}`;
    
    // Create bill object
    const bill = {
        id: bills.length + 1,
        billNumber,
        date: new Date().toISOString(),
        patientName: patientName || 'Not Provided',
        doctorName: doctorName || 'Not Provided',
        patientAge,
        patientGender,
        patientPhone,
        patientAddress,
        paymentMode,
        discount: discountValue,
        items: [...currentBillItems],
        total: total
    };

    // Save the bill to database
    bills.push(bill);
    
    // Save patient only if name is provided
    if (patientName && patientName.trim() !== '' && patientName !== 'Not Provided') {
        const existingPatientIndex = patients.findIndex(p => p.name.toLowerCase() === patientName.toLowerCase());
        if (existingPatientIndex === -1) {
            // Add new patient
            patients.push({
                id: patients.length + 1,
                name: patientName,
                age: patientAge,
                gender: patientGender,
                phone: patientPhone,
                address: patientAddress,
                lastVisit: new Date().toISOString()
            });
        } else {
            // Update existing patient
            patients[existingPatientIndex].lastVisit = new Date().toISOString();
            if (patientPhone) patients[existingPatientIndex].phone = patientPhone;
            if (patientAddress) patients[existingPatientIndex].address = patientAddress;
        }
    }

    // Save to localStorage
    localStorage.setItem('clinic_bills', JSON.stringify(bills));
    localStorage.setItem('clinic_patients', JSON.stringify(patients));
    localStorage.setItem('clinic_medicines', JSON.stringify(medicines));

    // Now print the bill
    const printWindow = window.open('', '_blank');
    const nowDate = new Date();
    
    // Build patient details for print
    let patientDetailsHTML = '';
    const details = [];
    
    if (patientName && patientName.trim() !== '') {
        details.push(`<strong>Patient:</strong> ${patientName}`);
    }
    
    if (patientAge && patientAge.trim() !== '') {
        details.push(`<strong>Age:</strong> ${patientAge}`);
    }
    
    if (patientGender && patientGender.trim() !== '') {
        details.push(`<strong>Gender:</strong> ${patientGender}`);
    }
    
    if (details.length > 0) {
        patientDetailsHTML = `<p>${details.join(' | ')}</p>`;
    }
    
    if (doctorName && doctorName.trim() !== '') {
        patientDetailsHTML += `<p><strong>Doctor:</strong> ${doctorName}</p>`;
    }
    
    if (patientPhone && patientPhone.trim() !== '') {
        patientDetailsHTML += `<p><strong>Phone:</strong> ${patientPhone}</p>`;
    }
    
    if (paymentMode) {
        patientDetailsHTML += `<p><strong>Payment Mode:</strong> ${paymentMode}</p>`;
    }
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Medicine Bill - ANASUYA MEDICALS & FANCY</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px; 
                        max-width: 800px; 
                        margin: 0 auto;
                    }
                    .bill-header-no-logo { 
                        text-align: center; 
                        margin-bottom: 20px; 
                        border-bottom: 2px solid #333;
                        padding-bottom: 10px;
                    }
                    .bill-clinic-info h2 {
                        margin: 0;
                        color: #333;
                        font-size: 24px;
                    }
                    .bill-clinic-info p {
                        margin: 5px 0;
                        color: #666;
                    }
                    .bill-details {
                        margin: 15px 0;
                        padding: 10px;
                        background: #f9f9f9;
                        border-radius: 5px;
                        border-left: 4px solid #2196F3;
                    }
                    .bill-details p {
                        margin: 5px 0;
                        padding: 2px 0;
                        line-height: 1.4;
                    }
                    .bill-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0; 
                    }
                    .bill-table th, .bill-table td { 
                        border: 1px solid #000; 
                        padding: 8px; 
                        text-align: center; 
                    }
                    .bill-table th {
                        background: #f2f2f2;
                    }
                    .bill-total { 
                        text-align: right; 
                        margin-top: 20px; 
                        padding: 15px;
                        border-top: 2px dashed #333;
                    }
                    .center-text {
                        text-align: center;
                        margin-top: 30px;
                        color: #666;
                    }
                    @media print {
                        @page { 
                            margin: 0.5cm; 
                        }
                        body { 
                            margin: 0;
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="bill-header-no-logo">
                    <div class="bill-clinic-info">
                        <h2>ANASUYA MEDICALS & FANCY</h2>
                        <p>D.No. 26/3/1564, Near GVRR College,
B.V. Nagar, Nellore - 524 004.</p>
                        <p>Phone: +91 8309303688 | Email: anasuyamedicals242@gmail.com</p>
                        <hr style="margin: 0.5rem 0;">
                        <h3>MEDICINE BILL</h3>
                        <p>Bill No: ${billNumber} | Date: ${nowDate.toLocaleDateString()} | Time: ${nowDate.toLocaleTimeString()}</p>
                    </div>
                </div>
                
                ${patientDetailsHTML ? `<div class="bill-details">${patientDetailsHTML}</div>` : ''}
                
                <table class="bill-table">
                    <thead>
                        <tr>
                            <th>S.No</th>
                            <th>Particulars</th>
                            <th>Batch No.</th>
                            <th>Exp. Date</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${currentBillItems.map((item, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${item.name}</td>
                                <td>${item.batchNo}</td>
                                <td>${item.expiryDate}</td>
                                <td>${item.quantity} ${item.unit || ''}</td>
                                <td>₹${item.price.toFixed(2)}</td>
                                <td>₹${item.amount.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="bill-total">
                    <p><strong>Sub Total:</strong> ₹${total.toFixed(2)}</p>
                    ${discountValue > 0 ? `<p><strong>Discount (${discountValue}%):</strong> ₹${discountAmount.toFixed(2)}</p>` : ''}
                    <p><strong>Final Amount:</strong> ₹${final.toFixed(2)}</p>
                    <p style="margin-top: 1rem;"><strong>Amount in Words:</strong> ${numberToWords(final)}</p>
                </div>
                
                <div class="center-text">
                    <p>Thank you for visiting!</p>
                </div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 100);
    
    // Clear the bill after printing
    clearBill();
    
    // Show success message
    showToast('Bill saved and printed successfully!', 'success');
    
    // Refresh tables
    loadSalesTable();
    loadMedicinesTable();
    loadPatientsTable();
}

// Update the event listener for the Print Bill button
document.getElementById('printBillBtn')?.addEventListener('click', function() {
    // Check if there are medicines in the bill
    if (currentBillItems.length === 0) {
        alert('Please add at least one medicine to the bill');
        return;
    }
    
    // Save and print directly without preview
    printBill();
});

// Also update the confirm print button in preview modal to save and print
document.getElementById('confirmPrintBtn')?.addEventListener('click', function() {
    // First save the bill
    const patientName = document.getElementById('patientName').value;
    const doctorName = document.getElementById('doctorName').value;
    const patientAge = document.getElementById('patientAge').value;
    const patientGender = document.getElementById('patientGender').value;
    const patientPhone = document.getElementById('patientPhone').value;
    const patientAddress = document.getElementById('patientAddress').value;
    const paymentMode = document.getElementById('paymentMode').value;
    const discountValue = parseFloat(document.getElementById('discount').value) || 0;
    
    if (currentBillItems.length === 0) {
        alert('Please add at least one medicine to the bill');
        return;
    }

    const now = new Date().toISOString().split('T')[0];
    
    // Update medicine quantities and last sale date
    currentBillItems.forEach(item => {
        const medicine = medicines.find(m => m.id === item.medId);
        if (medicine) {
            medicine.quantity -= item.quantity;
            medicine.lastSaleDate = now;
        }
    });

    const billNumber = `AM-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${bills.length + 1}`;
    
    const bill = {
        id: bills.length + 1,
        billNumber,
        date: new Date().toISOString(),
        patientName: patientName || 'Not Provided',
        doctorName: doctorName || 'Not Provided',
        patientAge,
        patientGender,
        patientPhone,
        patientAddress,
        paymentMode,
        discount: discountValue,
        items: [...currentBillItems],
        total: currentBillItems.reduce((sum, item) => sum + item.amount, 0)
    };

    bills.push(bill);
    
    // Save patient only if name is provided
    if (patientName && patientName.trim() !== '' && patientName !== 'Not Provided') {
        const existingPatientIndex = patients.findIndex(p => p.name.toLowerCase() === patientName.toLowerCase());
        if (existingPatientIndex === -1) {
            // Add new patient
            patients.push({
                id: patients.length + 1,
                name: patientName,
                age: patientAge,
                gender: patientGender,
                phone: patientPhone,
                address: patientAddress,
                lastVisit: new Date().toISOString()
            });
        } else {
            // Update existing patient
            patients[existingPatientIndex].lastVisit = new Date().toISOString();
            if (patientPhone) patients[existingPatientIndex].phone = patientPhone;
            if (patientAddress) patients[existingPatientIndex].address = patientAddress;
        }
    }

    // Save to localStorage
    localStorage.setItem('clinic_bills', JSON.stringify(bills));
    localStorage.setItem('clinic_patients', JSON.stringify(patients));
    localStorage.setItem('clinic_medicines', JSON.stringify(medicines));

    // Then print the bill from preview
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Medicine Bill - ANASUYA MEDICALS & FANCY</title>
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 20px; 
                        max-width: 800px; 
                        margin: 0 auto;
                    }
                    .bill-header-no-logo { 
                        text-align: center; 
                        margin-bottom: 20px; 
                        border-bottom: 2px solid #333;
                        padding-bottom: 10px;
                    }
                    .bill-clinic-info h2 {
                        margin: 0;
                        color: #333;
                        font-size: 24px;
                    }
                    .bill-clinic-info p {
                        margin: 5px 0;
                        color: #666;
                    }
                    .bill-details {
                        margin: 15px 0;
                        padding: 10px;
                        background: #f9f9f9;
                        border-radius: 5px;
                    }
                    .bill-table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0; 
                    }
                    .bill-table th, .bill-table td { 
                        border: 1px solid #000; 
                        padding: 8px; 
                        text-align: center; 
                    }
                    .bill-table th {
                        background: #f2f2f2;
                    }
                    .bill-total { 
                        text-align: right; 
                        margin-top: 20px; 
                        padding: 15px;
                        border-top: 2px dashed #333;
                    }
                    .center-text {
                        text-align: center;
                        margin-top: 30px;
                        color: #666;
                    }
                    @media print {
                        @page { 
                            margin: 0.5cm; 
                        }
                        body { 
                            margin: 0;
                            padding: 0;
                        }
                    }
                </style>
            </head>
            <body>
                ${document.getElementById('billContent').innerHTML}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 100);
    
    // Clear the bill after printing
    clearBill();
    
    // Close the preview modal
    document.getElementById('billPreviewModal').classList.remove('active');
    
    // Show success message
    showToast('Bill saved and printed successfully!', 'success');
    
    // Refresh tables
    loadSalesTable();
    loadMedicinesTable();
    loadPatientsTable();
});

// Keep the existing generateBillPreview function as is for preview
function generateBillPreview() {
    // ... (existing generateBillPreview function code remains the same)
}

// Load sales table with delete buttons
function loadSalesTable() {
    const startDate = document.getElementById('salesStartDate')?.value;
    const endDate = document.getElementById('salesEndDate')?.value;
    const table = document.getElementById('salesTable');
    
    if (!table) return;
    
    let filteredBills = bills;
    
    if (startDate && endDate) {
        filteredBills = bills.filter(bill => {
            const billDate = new Date(bill.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setDate(end.getDate() + 1);
            
            return billDate >= start && billDate < end;
        });
    }
    
    table.innerHTML = filteredBills.map(bill => `
        <tr>
            <td>
                <input type="checkbox" class="sale-checkbox" value="${bill.id}" onchange="updateSelectedSales()">
            </td>
            <td>${bill.billNumber}</td>
            <td>${new Date(bill.date).toLocaleDateString()}</td>
            <td>${bill.patientName}</td>
            <td>${bill.doctorName}</td>
            <td>${bill.items.length} items</td>
            <td>₹${bill.total.toFixed(2)}</td>
            <td>${bill.paymentMode}</td>
            <td class="action-buttons-small">
                <button class="btn-secondary btn-sm" onclick="viewBillDetails(${bill.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn-danger btn-sm" onclick="deleteSale(${bill.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="9">No sales records found</td></tr>';
}

// Function to update selected sales
function updateSelectedSales() {
    selectedSales = [];
    document.querySelectorAll('.sale-checkbox:checked').forEach(cb => {
        selectedSales.push(parseInt(cb.value));
    });
    
    // Update select all checkbox
    const allCheckboxes = document.querySelectorAll('.sale-checkbox');
    const checkedCheckboxes = document.querySelectorAll('.sale-checkbox:checked');
    const selectAllSales = document.getElementById('selectAllSales');
    if (selectAllSales && allCheckboxes.length > 0) {
        selectAllSales.checked = allCheckboxes.length === checkedCheckboxes.length;
    }
}

// Function to delete selected sales
function deleteSelectedSales() {
    // Get all checked checkboxes
    const checkboxes = document.querySelectorAll('.sale-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Please select sales to delete');
        return;
    }
    
    const idsToDelete = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (confirm(`Are you sure you want to delete ${idsToDelete.length} selected sale(s)? This will restore medicine quantities.`)) {
        // Delete in reverse order to avoid index issues
        idsToDelete.sort((a, b) => b - a).forEach(id => {
            deleteSale(id, false); // Don't show individual confirmations
        });
        
        // Clear the select all checkbox
        document.getElementById('selectAllSales').checked = false;
        
        // Refresh the table
        loadSalesTable();
        loadMedicinesTable();
        updateMedicineSelect();
        
        showToast(`${idsToDelete.length} sale(s) deleted successfully!`, 'success');
    }
}

// Function to delete single sale
function deleteSale(id, showConfirmation = true) {
    if (showConfirmation && !confirm('Are you sure you want to delete this sale? This will restore medicine quantities.')) {
        return;
    }
    
    const bill = bills.find(b => b.id === id);
    if (!bill) return;
    
    // Restore medicine quantities
    bill.items.forEach(item => {
        const medicine = medicines.find(m => m.id === item.medId);
        if (medicine) {
            medicine.quantity += item.quantity;
        }
    });
    
    // Remove bill
    bills = bills.filter(b => b.id !== id);
    
    // Update IDs
    bills.forEach((b, index) => {
        b.id = index + 1;
    });
    
    // Update localStorage
    localStorage.setItem('clinic_bills', JSON.stringify(bills));
    localStorage.setItem('clinic_medicines', JSON.stringify(medicines));
    
    // Refresh tables
    loadSalesTable();
    loadMedicinesTable();
    updateMedicineSelect();
    
    if (showConfirmation) {
        showToast('Sale deleted successfully!', 'success');
    }
}

// Function to view bill details
function viewBillDetails(id) {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;
    
    const itemsList = bill.items.map(item => 
        `${item.name} (${item.quantity} ${item.unit || ''}) - ₹${item.amount.toFixed(2)}`
    ).join('\n');
    
    alert(`Bill Details:\n\nBill No: ${bill.billNumber}\nDate: ${new Date(bill.date).toLocaleDateString()}\nPatient: ${bill.patientName}\nDoctor: ${bill.doctorName}\nPayment Mode: ${bill.paymentMode}\nDiscount: ${bill.discount}%\n\nItems:\n${itemsList}\n\nTotal: ₹${bill.total.toFixed(2)}`);
}

// Check expiry alerts
function checkExpiryAlerts() {
    const alertContainer = document.getElementById('expiryAlerts');
    if (!alertContainer) return;
    
    const today = new Date();
    const alerts = [];
    
    medicines.forEach(med => {
        const expiryDate = new Date(med.expiryDate);
        const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysToExpiry < 0) {
            alerts.push({
                type: 'danger',
                message: `❌ ${med.name} (Batch: ${med.batchNo}) has EXPIRED on ${med.expiryDate}`
            });
        } else if (daysToExpiry <= 30) {
            alerts.push({
                type: 'warning',
                message: `⚠️ ${med.name} (Batch: ${med.batchNo}) expiring in ${daysToExpiry} days (${med.expiryDate})`
            });
        }
    });
    
    if (alerts.length === 0) {
        alertContainer.innerHTML = `
            <div class="alert" style="background-color: #d4edda; border-color: #c3e6cb; color: #155724;">
                <i class="fas fa-check-circle"></i> All medicines are within validity period
            </div>
        `;
    } else {
        alertContainer.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.type}">
                <i class="fas fa-exclamation-triangle"></i> ${alert.message}
            </div>
        `).join('');
    }
}

// Helper function: Number to words
function numberToWords(num) {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    
    let words = '';
    const rupees = Math.floor(num);
    const paise = Math.round((num - rupees) * 100);
    
    if (rupees > 0) {
        words += convertToWords(rupees) + ' Rupees';
    }
    
    if (paise > 0) {
        if (words !== '') words += ' and ';
        words += convertToWords(paise) + ' Paise';
    }
    
    return words + ' Only';
    
    function convertToWords(n) {
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
        if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertToWords(n % 100) : '');
        if (n < 100000) {
            return convertToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertToWords(n % 1000) : '');
        }
        if (n < 10000000) {
            return convertToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertToWords(n % 100000) : '');
        }
        return 'Large Amount';
    }
}

// Load patients table
function loadPatientsTable() {
    const table = document.getElementById('patientsTable');
    if (!table) return;
    
    table.innerHTML = '';
    
    if (patients.length === 0) {
        table.innerHTML = '<tr><td colspan="8" class="text-center">No patients found</td></tr>';
        return;
    }
    
    patients.forEach(patient => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><input type="checkbox" class="patient-checkbox" data-id="${patient.id}"></td>
            <td>${patient.id}</td>
            <td>${patient.name}</td>
            <td>${patient.age}</td>
            <td>${patient.gender}</td>
            <td>${patient.phone || 'N/A'}</td>
            <td>${patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}</td>
            <td class="actions-cell">
                <button class="btn-secondary btn-sm" onclick="editPatient(${patient.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-danger btn-sm" onclick="deletePatient(${patient.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn-primary btn-sm" onclick="viewPatient(${patient.id})" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        table.appendChild(row);
    });
}

// Add new patient
function addNewPatient() {
    const name = prompt("Enter patient name:");
    if (name) {
        const patient = {
            id: patients.length + 1,
            name,
            age: prompt("Enter age:") || '',
            gender: prompt("Enter gender (Male/Female/Other):") || '',
            phone: prompt("Enter phone:") || '',
            address: prompt("Enter address:") || '',
            lastVisit: new Date().toISOString()
        };
        patients.push(patient);
        localStorage.setItem('clinic_patients', JSON.stringify(patients));
        loadPatientsTable();
        showToast('Patient added successfully!', 'success');
    }
}

// Delete single patient
function deletePatient(id) {
    if (confirm('Are you sure you want to delete this patient?')) {
        patients = patients.filter(p => p.id !== id);
        localStorage.setItem('clinic_patients', JSON.stringify(patients));
        loadPatientsTable();
        showToast('Patient deleted successfully!', 'success');
    }
}

// Delete selected patients
function deleteSelectedPatients() {
    const checkboxes = document.querySelectorAll('.patient-checkbox:checked');
    if (checkboxes.length === 0) {
        alert('Please select patients to delete');
        return;
    }
    
    if (confirm(`Are you sure you want to delete ${checkboxes.length} selected patient(s)?`)) {
        const idsToDelete = Array.from(checkboxes).map(cb => parseInt(cb.dataset.id));
        patients = patients.filter(patient => !idsToDelete.includes(patient.id));
        localStorage.setItem('clinic_patients', JSON.stringify(patients));
        loadPatientsTable();
        document.getElementById('selectAllPatients').checked = false;
        showToast(`${idsToDelete.length} patient(s) deleted successfully!`, 'success');
    }
}

// Edit patient
function editPatient(id) {
    const patient = patients.find(p => p.id === id);
    if (!patient) return;
    
    editingPatientId = id;
    patientModalTitle.textContent = 'Edit Patient';
    
    // Populate form with patient data
    document.getElementById('editPatientId').value = patient.id;
    document.getElementById('editPatientName').value = patient.name;
    document.getElementById('editPatientAge').value = patient.age || '';
    document.getElementById('editPatientGender').value = patient.gender || '';
    document.getElementById('editPatientPhone').value = patient.phone || '';
    document.getElementById('editPatientAddress').value = patient.address || '';
    
    patientEditModal.classList.add('active');
}

// Save patient changes
function savePatient() {
    const patientId = parseInt(document.getElementById('editPatientId').value);
    const patientName = document.getElementById('editPatientName').value;
    const patientAge = document.getElementById('editPatientAge').value;
    const patientGender = document.getElementById('editPatientGender').value;
    const patientPhone = document.getElementById('editPatientPhone').value;
    const patientAddress = document.getElementById('editPatientAddress').value;

    if (!patientName) {
        alert('Patient name is required');
        return;
    }

    // Find patient index
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex === -1) {
        alert('Patient not found');
        return;
    }

    // Update patient data
    patients[patientIndex] = {
        ...patients[patientIndex],
        name: patientName,
        age: patientAge,
        gender: patientGender,
        phone: patientPhone,
        address: patientAddress
    };

    localStorage.setItem('clinic_patients', JSON.stringify(patients));
    patientEditModal.classList.remove('active');
    loadPatientsTable();
    showToast('Patient updated successfully!', 'success');
}

// View patient details
function viewPatient(id) {
    const patient = patients.find(p => p.id === id);
    if (patient) {
        alert(`Patient Details:\n\nName: ${patient.name}\nAge: ${patient.age}\nGender: ${patient.gender}\nPhone: ${patient.phone || 'N/A'}\nAddress: ${patient.address || 'N/A'}\nLast Visit: ${patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : 'N/A'}`);
    }
}

// Make functions available globally
window.editPatient = editPatient;
window.editMedicine = editMedicine;
window.deleteMedicine = deleteMedicine;
window.updateSelectedMedicines = updateSelectedMedicines;
window.removePurchaseItem = removePurchaseItem;
window.viewPurchaseDetails = viewPurchaseDetails;
window.addNewPatient = addNewPatient;
window.viewPatient = viewPatient;
window.deletePatient = deletePatient;
window.deletePurchase = deletePurchase;
window.viewBillDetails = viewBillDetails;
window.editMedicineItem = editMedicineItem;
window.deleteSale = deleteSale;
window.updateSelectedSales = updateSelectedSales;
window.savePatient = savePatient;
