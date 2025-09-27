<<<<<<< HEAD
document.getElementById('checkButton').addEventListener('click', async () => {
    const ip = document.getElementById('ipInput').value;
    const resultContainer = document.getElementById('resultContainer');

    if (!ip) {
        resultContainer.textContent = 'Please enter a valid IP address.';
        return;
    }

    resultContainer.innerHTML = 'Checking...';

    try {
        const response = await fetch(`http://localhost:8000/check-ip?ip=${ip}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        let displayHtml = `
            <h3>Analysis for: ${data.ip_address}</h3>
            <p><strong>Reputation Score:</strong> ${data.reputation_score}</p>
            <p><strong>Risk Level:</strong> ${data.risk_level}</p>
            <p><strong>Source:</strong> ${data.source}</p>
        `;
        
        // Add a "cached" status if the API returns it
        if (data.cached) {
            displayHtml += `<p><strong>Status:</strong> Cached data (from database)</p>`;
        } else {
            displayHtml += `<p><strong>Status:</strong> Fresh data (from API)</p>`;
        }

        resultContainer.innerHTML = displayHtml;

    } catch (error) {
        resultContainer.textContent = `Error: ${error.message}`;
        console.error('Error checking IP:', error);
    }
=======
document.getElementById('checkButton').addEventListener('click', async () => {
    const ip = document.getElementById('ipInput').value;
    const resultContainer = document.getElementById('resultContainer');

    if (!ip) {
        resultContainer.textContent = 'Please enter a valid IP address.';
        return;
    }

    resultContainer.innerHTML = 'Checking...';

    try {
        const response = await fetch(`http://localhost:8000/check-ip?ip=${ip}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        let displayHtml = `
            <h3>Analysis for: ${data.ip_address}</h3>
            <p><strong>Reputation Score:</strong> ${data.reputation_score}</p>
            <p><strong>Risk Level:</strong> ${data.risk_level}</p>
            <p><strong>Source:</strong> ${data.source}</p>
        `;
        
        // Add a "cached" status if the API returns it
        if (data.cached) {
            displayHtml += `<p><strong>Status:</strong> Cached data (from database)</p>`;
        } else {
            displayHtml += `<p><strong>Status:</strong> Fresh data (from API)</p>`;
        }

        resultContainer.innerHTML = displayHtml;

    } catch (error) {
        resultContainer.textContent = `Error: ${error.message}`;
        console.error('Error checking IP:', error);
    }
>>>>>>> 4aac0aa (Initial commit: IP Reputation Checker microservices + Kubernetes manifests)
});