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
    const statusEl = document.getElementById('tollApiStatus');
    statusEl.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// === MapUp TollGuru API Integration ===

// Map app vehicle types to TollGuru vehicle types
const tollGuruVehicleMap = {
    sedan: '2AxlesAuto',
    suv: '2AxlesAuto',
    luxury: '2AxlesAuto',
    tempo: '2AxlesBus',
    bus: '2AxlesBus',
    custom: '2AxlesAuto',
};

function showTollStatus(message, type) {
    const statusEl = document.getElementById('tollApiStatus');
    statusEl.textContent = message;
    statusEl.className = 'toll-api-status toll-status-' + type;
    statusEl.classList.remove('hidden');
}

async function fetchTollFromAPI() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (!apiKey) {
        showTollStatus('Please enter your TollGuru API key.', 'error');
        return;
    }

    const origin = document.getElementById('origin').value.trim();
    const destination = document.getElementById('destination').value.trim();
    if (!origin || !destination) {
        showTollStatus('Please enter origin and destination first.', 'error');
        return;
    }

    const carType = document.getElementById('carType').value;
    const vehicleType = tollGuruVehicleMap[carType] || '2AxlesAuto';
    const tripType = document.getElementById('tripType').value;

    // Show loading state
    const btn = document.getElementById('btnFetchToll');
    const btnText = document.getElementById('fetchTollText');
    const spinner = document.getElementById('fetchTollSpinner');
    btn.disabled = true;
    btnText.textContent = 'Fetching...';
    spinner.classList.remove('hidden');
    showTollStatus('Calling MapUp TollGuru API...', 'loading');

    try {
        const response = await fetch(
            'https://apis.tollguru.com/toll/v2/origin-destination-waypoints',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                },
                body: JSON.stringify({
                    from: origin,
                    to: destination,
                    vehicleType: vehicleType,
                }),
            }
        );

        if (!response.ok) {
            const errText = await response.text();
            throw new Error('API returned ' + response.status + ': ' + errText);
        }

        const data = await response.json();

        // Extract toll and distance from the best route
        const routes = data.routes || data.summary && [data.summary] || [];
        if (routes.length === 0 && data.route) {
            routes.push(data.route);
        }

        let totalToll = 0;
        let distanceKm = 0;
        let routeName = '';

        if (routes.length > 0) {
            const bestRoute = routes[0];
            const summary = bestRoute.summary || bestRoute;

            // Extract toll cost (try multiple response formats)
            if (summary.hasTolls !== undefined) {
                const costs = summary.costs || {};
                totalToll = costs.tag || costs.cash || costs.licensePlate || 0;
            }
            if (totalToll === 0 && summary.tollCosts) {
                totalToll = summary.tollCosts.tag || summary.tollCosts.cash || 0;
            }
            if (totalToll === 0 && bestRoute.costs) {
                const rc = bestRoute.costs;
                totalToll = rc.tag || rc.cash || rc.licensePlate || 0;
            }

            // Extract distance
            if (summary.distance) {
                distanceKm = summary.distance.metric
                    ? summary.distance.metric / 1000
                    : summary.distance / 1000;
            } else if (summary.distanceMeters) {
                distanceKm = summary.distanceMeters / 1000;
            }

            routeName = bestRoute.name || summary.name || '';
        }

        // For round trip, double the toll
        const tollForTrip = tripType === 'roundtrip' ? totalToll * 2 : totalToll;

        // Update form fields
        if (tollForTrip > 0) {
            document.getElementById('tollCharges').value = Math.round(tollForTrip);
        }
        if (distanceKm > 0) {
            document.getElementById('distance').value = Math.round(distanceKm * 10) / 10;
        }

        // Build status message
        let msg = 'API data received.';
        if (distanceKm > 0) {
            msg += ' Distance: ' + distanceKm.toFixed(1) + ' km (one-way).';
        }
        if (totalToll > 0) {
            msg += ' Toll: \u20B9' + Math.round(totalToll) + ' (one-way).';
            if (tripType === 'roundtrip') {
                msg += ' Round trip toll: \u20B9' + Math.round(tollForTrip) + '.';
            }
        } else {
            msg += ' No toll data found for this route (may be toll-free).';
        }
        if (routeName) {
            msg += ' Route: ' + routeName + '.';
        }
        showTollStatus(msg, 'success');
    } catch (err) {
        showTollStatus('Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btnText.textContent = 'Fetch Tolls & Distance via MapUp API';
        spinner.classList.add('hidden');
    }
}
