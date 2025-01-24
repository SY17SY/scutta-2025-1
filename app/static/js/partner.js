document.addEventListener('DOMContentLoaded', loadPartners);

function loadPartners() {
    fetch('/get_partners')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('partner-body');
            tbody.innerHTML = '';
            data.forEach(partner => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${partner.p1_name}</td>
                    <td>${partner.submitted ? '제출' : '미제출'}</td>
                    <td>${partner.p2_name}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error:', error));
}