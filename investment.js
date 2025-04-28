document.addEventListener('DOMContentLoaded', () => {
    
    const totalContributionsElement = document.getElementById('total-contributions');
    const expectedReturnsElement = document.getElementById('expected-returns');

    
    function fetchInvestmentDetails() {
        fetch(`/get-investments?email=${encodeURIComponent(email)}`)
            .then((response) => response.json())
            .then((data) => {
                
                totalContributionsElement.textContent = `Ksh. ${data.totalContributions}`;
                expectedReturnsElement.textContent = `Ksh. ${data.expectedReturns}`;
            })
            .catch((error) => {
                console.error('Error fetching investments:', error);
            });
    }

    
    fetchInvestmentDetails();

    
    const depositForm = document.getElementById('deposit-form');
    depositForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const depositAmount = parseFloat(document.getElementById('deposit-amount').value);

        
        if (isNaN(depositAmount) || depositAmount <= 0) {
            alert('Please enter a valid deposit amount.');
            return;
        }

        
        fetch('/add-investment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, depositAmount }),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    // Refresh investment details to reflect new balance and returns
                    fetchInvestmentDetails();
                } else {
                    alert('Failed to add investment.');
                }
            })
            .catch((error) => {
                console.error('Error adding investment:', error);
                alert('Error adding investment.');
            });
    });
});
