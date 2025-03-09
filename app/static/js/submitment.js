let currentTab = 'all';
let offset = 0;
const limit = 30;

document.addEventListener('DOMContentLoaded', () => {
    let endDate = new Date().toISOString().split('T')[0];
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    startDate = startDate.toISOString().split('T')[0];

    loadMatches(currentTab, offset, startDate, endDate);

    document.getElementById('load-more').addEventListener('click', () => {
        offset += limit;
        loadMatches(currentTab, offset, startDate, endDate);
    });
});

function loadMatches(tab, newOffset = 0, startDate = null, endDate = null) {
    currentTab = tab;
    offset = newOffset;

    fetch(`/get_matches?tab=${tab}&offset=${offset}&limit=${limit}&start_date=${startDate || ''}&end_date=${endDate || ''}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('match-table-body');
            if (offset === 0) tableBody.innerHTML = '';

            data.forEach(match => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${match.approved ? '승인' : '미승인'}</td>
                    <td>${match.winner_name}</td>
                    <td>${match.score}</td>
                    <td>${match.loser_name}</td>
                    <td>${formatTimestamp(match.timestamp)}</td>
                `;
                tableBody.appendChild(row);
            });
            document.getElementById('load-more').style.display = data.length < limit ? 'none' : 'block';
        })
        .catch(error => console.error('Error fetching matches:', error));
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const date = new Date(timestamp);

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayOfWeek = days[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${month}.${day}.(${dayOfWeek}) ${hours}:${minutes}`;
}