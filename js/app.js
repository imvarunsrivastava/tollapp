// Vehicle presets: { mileage (km/l), defaultFuelPrice }
const vehiclePresets = {
    sedan: { mileage: 18, label: 'Sedan' },
    suv: { mileage: 12, label: 'SUV' },
    luxury: { mileage: 10, label: 'Luxury' },
    tempo: { mileage: 8, label: 'Tempo Traveller' },
    bus: { mileage: 5, label: 'Mini Bus / Bus' },
};

// Auto-fill mileage when vehicle type changes
document.getElementById('carType').addEventListener('change', function () {
    const preset = vehiclePresets[this.value];
    if (preset) {
        document.getElementById('mileage').value = preset.mileage;
    } else {
        document.getElementById('mileage').value = '';
    }
});

// Form submission
document.getElementById('tripForm').addEventListener('submit', function (e) {
    e.preventDefault();
    calculateTripCost();
});

function getNumericValue(id) {
    const val = parseFloat(document.getElementById(id).value);
    return isNaN(val) ? 0 : val;
}

function formatCurrency(amount) {
    return '\u20B9 ' + amount.toLocaleString('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

function calculateTripCost() {
    // Route
    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    const distanceInput = getNumericValue('distance');
    const tripType = document.getElementById('tripType').value;

    if (!origin || !destination || distanceInput <= 0) {
        alert('Please fill in origin, destination, and distance.');
        return;
    }

    const totalDistance = tripType === 'roundtrip' ? distanceInput * 2 : distanceInput;

    // Vehicle
    const mileage = getNumericValue('mileage');
    const fuelPrice = getNumericValue('fuelPrice');

    if (mileage <= 0) {
        alert('Please enter a valid mileage.');
        return;
    }

    // Fuel cost
    const fuelNeeded = totalDistance / mileage;
    const fuelCost = fuelNeeded * fuelPrice;

    // Toll & charges
    const tollCharges = getNumericValue('tollCharges');
    const parkingCharges = getNumericValue('parkingCharges');
    const statePermit = getNumericValue('statePermit');

    // Trip charges
    const numDays = getNumericValue('numDays');
    const numNights = getNumericValue('numNights');
    const dayCharge = getNumericValue('dayCharge');
    const nightCharge = getNumericValue('nightCharge');
    const driverAllowance = getNumericValue('driverAllowance');

    const totalDayCharges = dayCharge * numDays;
    const totalNightCharges = nightCharge * numNights;
    const totalDriverAllowance = driverAllowance * (numDays + numNights);

    // Base cost
    const baseCost = fuelCost + tollCharges + parkingCharges + statePermit
        + totalDayCharges + totalNightCharges + totalDriverAllowance;

    // Profit
    const profitPercent = getNumericValue('profitMargin');
    const profitAmount = baseCost * (profitPercent / 100);
    const finalPrice = Math.ceil(baseCost + profitAmount);

    // Display results
    document.getElementById('routeLabel').textContent = origin + ' \u2192 ' + destination;
    document.getElementById('tripTypeLabel').textContent =
        tripType === 'roundtrip' ? 'Round Trip' : 'One Way';

    document.getElementById('resultDistance').textContent = totalDistance.toFixed(1) + ' km';
    document.getElementById('resultFuelCost').textContent = formatCurrency(Math.round(fuelCost));
    document.getElementById('resultTollCharges').textContent = formatCurrency(tollCharges);
    document.getElementById('resultParkingCharges').textContent = formatCurrency(parkingCharges);
    document.getElementById('resultStatePermit').textContent = formatCurrency(statePermit);
    document.getElementById('resultDayCharges').textContent =
        formatCurrency(totalDayCharges) + ' (' + numDays + ' days)';
    document.getElementById('resultNightCharges').textContent =
        formatCurrency(totalNightCharges) + ' (' + numNights + ' nights)';
    document.getElementById('resultDriverAllowance').textContent =
        formatCurrency(totalDriverAllowance);
    document.getElementById('resultBaseCost').textContent = formatCurrency(Math.round(baseCost));
    document.getElementById('resultProfitAmount').textContent =
        formatCurrency(Math.round(profitAmount)) + ' (' + profitPercent + '%)';
    document.getElementById('resultFinalPrice').textContent = formatCurrency(finalPrice);

    // Show results
    const resultsSection = document.getElementById('results');
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
    document.getElementById('tripForm').reset();
    document.getElementById('results').classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
