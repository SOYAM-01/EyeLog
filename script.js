// Global variables
const showSavedBtn = document.getElementById('show-saved-btn');
const showTransBtn = document.getElementById('show-trans-btn');
const savedSection = document.getElementById('saved-section');
const transpositionSection = document.getElementById('transposition-section');
const prescriptionForm = document.getElementById('prescription-form');
const prescriptionList = document.getElementById('prescription-list');
const calculateTransBtn = document.getElementById('calculate-trans-btn');
const transpositionResult = document.getElementById('transposition-result');

// Spinner update function
function updateSpinner(inputId, increment) {
    const input = document.getElementById(inputId);
    const currentValue = parseFloat(input.value) || 0;
    const newValue = currentValue + increment;
    const min = parseFloat(input.min);
    const max = parseFloat(input.max);
    
    // Check bounds
    if (newValue >= min && newValue <= max) {
        if (inputId.includes('axis')) {
            input.value = Math.round(newValue);
        } else {
            input.value = newValue.toFixed(2);
        }
    }
}

// Format display values
function formatValue(value, type) {
    if (type === 'axis') {
        return value + '°';
    }
    const num = parseFloat(value);
    if (num > 0) {
        return '+' + num.toFixed(2);
    } else if (num < 0) {
        return num.toFixed(2);
    } else {
        return '0.00';
    }
}

// Function to populate ADD power dropdowns
function populateAddSelects() {
    const addSelects = document.querySelectorAll('.add-select');
    addSelects.forEach(select => {
        select.innerHTML = '<option value="">N/A</option>';
        for (let i = 0.75; i <= 4; i += 0.25) {
            const value = i.toFixed(2);
            const option = `<option value="+${value}">+${value}</option>`;
            select.innerHTML += option;
        }
    });
}

// Navigation functions
function showSavedSection() {
    savedSection.classList.remove('hidden');
    transpositionSection.classList.add('hidden');
    showSavedBtn.classList.add('active');
    showTransBtn.classList.remove('active');
}

function showTranspositionSection() {
    savedSection.classList.add('hidden');
    transpositionSection.classList.remove('hidden');
    showTransBtn.classList.add('active');
    showSavedBtn.classList.remove('active');
}

// Navigation event listeners
showSavedBtn.addEventListener('click', showSavedSection);
showTransBtn.addEventListener('click', showTranspositionSection);

// Prescription form submit
prescriptionForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const prescription = {
        name: document.getElementById('cx-name').value,
        age: document.getElementById('cx-age').value,
        date: document.getElementById('cx-date').value,
        time: document.getElementById('cx-time').value,
        re: {
            sph: document.getElementById('re-sph').value,
            cyl: document.getElementById('re-cyl').value,
            axis: document.getElementById('re-axis').value,
        },
        le: {
            sph: document.getElementById('le-sph').value,
            cyl: document.getElementById('le-cyl').value,
            axis: document.getElementById('le-axis').value,
        },
        add: {
            re: document.getElementById('re-add').value,
            le: document.getElementById('le-add').value
        }
    };

    savePrescription(prescription);
    displayPrescriptions();
    prescriptionForm.reset();
    
    // Reset spinners to default values and set current date/time
    document.getElementById('re-sph').value = '0.00';
    document.getElementById('re-cyl').value = '0.00';
    document.getElementById('re-axis').value = '90';
    document.getElementById('le-sph').value = '0.00';
    document.getElementById('le-cyl').value = '0.00';
    document.getElementById('le-axis').value = '90';
    
    // Reset to current date and time
    const now = new Date();
    document.getElementById('cx-date').value = now.toISOString().split('T')[0];
    document.getElementById('cx-time').value = now.toTimeString().slice(0, 5);
});

// Save prescription to localStorage
function savePrescription(prescription) {
    let prescriptions = JSON.parse(localStorage.getItem('prescriptions')) || [];
    prescriptions.push(prescription);
    localStorage.setItem('prescriptions', JSON.stringify(prescriptions));
}

// Display all saved prescriptions
function displayPrescriptions() {
    prescriptionList.innerHTML = '';
    let prescriptions = JSON.parse(localStorage.getItem('prescriptions')) || [];
    
    if (prescriptions.length === 0) {
        prescriptionList.innerHTML = '<p style="text-align: center; color: #666;">No saved prescriptions yet.</p>';
        return;
    }
    
    prescriptions.forEach((p, index) => {
        const item = document.createElement('div');
        item.className = 'prescription-item';
        
        // Format date and time
        const formattedDate = new Date(p.date).toLocaleDateString('en-GB');
        const timeDisplay = p.time ? formatTime(p.time) : '';
        const dateTimeString = timeDisplay ? `${formattedDate} at ${timeDisplay}` : formattedDate;

        item.innerHTML = `
            <h4>${p.name} (Age: ${p.age}) - <small>${dateTimeString}</small></h4>
            <p><strong>RE:</strong> SPH: ${formatValue(p.re.sph, 'power')}, CYL: ${formatValue(p.re.cyl, 'power')}, Axis: ${p.re.axis}°</p>
            <p><strong>LE:</strong> SPH: ${formatValue(p.le.sph, 'power')}, CYL: ${formatValue(p.le.cyl, 'power')}, Axis: ${p.le.axis}°</p>
            <p><strong>ADD:</strong> RE: ${p.add.re || 'N/A'}, LE: ${p.add.le || 'N/A'}</p>
            <button onclick="deletePrescription(${index})">Delete</button>
        `;
        prescriptionList.appendChild(item);
    });
}

// Format time to 12-hour format with AM/PM
function formatTime(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    
    return `${displayHour}:${minutes} ${ampm}`;
}

// Delete prescription
function deletePrescription(index) {
    if (confirm('Are you sure you want to delete this prescription?')) {
        let prescriptions = JSON.parse(localStorage.getItem('prescriptions')) || [];
        prescriptions.splice(index, 1);
        localStorage.setItem('prescriptions', JSON.stringify(prescriptions));
        displayPrescriptions();
    }
}

// Transposition calculation
calculateTransBtn.addEventListener('click', () => {
    const sph = parseFloat(document.getElementById('trans-sph').value);
    const cyl = parseFloat(document.getElementById('trans-cyl').value);
    let axis = parseInt(document.getElementById('trans-axis').value);

    if (isNaN(sph) || isNaN(cyl) || isNaN(axis)) {
        transpositionResult.innerHTML = '<span style="color: #dc3545;">Please enter valid numbers for all fields.</span>';
        return;
    }

    // Validate axis range
    if (axis < 0 || axis > 180) {
        transpositionResult.innerHTML = '<span style="color: #dc3545;">Axis must be between 0° and 180°.</span>';
        return;
    }

    const newSph = sph + cyl;
    const newCyl = -cyl;
    let newAxis = axis + 90;
    if (newAxis > 180) {
        newAxis = newAxis - 180;
    }

    transpositionResult.innerHTML = `
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
            <strong>Original:</strong> SPH: ${formatValue(sph, 'power')}, CYL: ${formatValue(cyl, 'power')}, Axis: ${axis}°
        </div>
        <div style="background: #d4edda; padding: 10px; border-radius: 5px; color: #155724;">
            <strong>Transposed:</strong><br>
            SPH: <strong>${formatValue(newSph, 'power')}</strong><br>
            CYL: <strong>${formatValue(newCyl, 'power')}</strong><br>
            Axis: <strong>${newAxis}°</strong>
        </div>
    `;
});

// Clear transposition form
function clearTranspositionForm() {
    document.getElementById('trans-sph').value = '';
    document.getElementById('trans-cyl').value = '';
    document.getElementById('trans-axis').value = '';
    transpositionResult.innerHTML = '';
}

// Initialize application when page loads
document.addEventListener('DOMContentLoaded', () => {
    populateAddSelects();
    displayPrescriptions();
    
    // Set default date and time to current date/time
    const now = new Date();
    document.getElementById('cx-date').value = now.toISOString().split('T')[0];
    document.getElementById('cx-time').value = now.toTimeString().slice(0, 5);
    
    // Add clear button for transposition section
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear';
    clearBtn.style.backgroundColor = '#6c757d';
    clearBtn.style.margin = '10px';
    clearBtn.onclick = clearTranspositionForm;
    
    const transForm = document.querySelector('.transposition-form');
    const calculateBtn = document.getElementById('calculate-trans-btn');
    calculateBtn.parentNode.insertBefore(clearBtn, calculateBtn.nextSibling);
});
