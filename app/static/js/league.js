document.addEventListener('DOMContentLoaded', () => {
    loadLeagues();
});

function loadLeagues() {
    fetch('/get_leagues')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('league-list');
            tbody.innerHTML = '';
            data.forEach(league => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <a href="/league/${league.id}">${league.title}</a>
                    </td>
                `;
                tbody.appendChild(row);
            });
        
        })
        .catch(error => console.error('Error:', error));
}

function createLeague() {
    const playerNames = prompt("선수 5명을 입력하세요.").trim().split(" ");
    if (playerNames.length !== 5) {
        alert("정확히 5명을 입력하세요.");
        return;
    }

    fetch('/create_league', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players: playerNames })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('리그전이 생성되었습니다.');
                loadLeagues();
            } else {
                alert(data.error || '리그전 생성에 실패했습니다.');
            }
        })
        .catch(error => console.error('Error:', error));
}