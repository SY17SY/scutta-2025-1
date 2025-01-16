document.addEventListener('DOMContentLoaded', loadBetting);

function loadBetting() {
    fetch('/get_bettings')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('betting-list');
            tbody.innerHTML = '';
            data.forEach(bet => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <a href="/betting/${bet.id}">${bet.p1} vs ${bet.p2}</a>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error:', error));
}

function createBetting() {
    const players = prompt("선수 2명을 입력하세요 (공백으로 구분)").trim().split(" ");
    if (players.length !== 2) {
        alert("정확히 2명을 입력하세요.");
        return;
    }

    const participants = prompt("베팅 참가자 이름(들)을 입력하세요 (공백으로 구분)").trim().split(" ");
    if (participants.length === 0) {
        alert("적어도 1명의 베팅 참가자를 입력하세요.");
        return;
    }

    fetch('/get_achieve_counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ players, participants })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                return;
            }

            const message = `
선수 정보:
${data.p1.name} 업적: ${data.p1.achieve_count}
${data.p2.name} 업적: ${data.p2.achieve_count}

참가자 정보:
${data.participants.map(p => `${p.name} 업적: ${p.achieve_count}`).join('\n')}

베팅할 점수를 입력하세요.
            `;

            const point = parseInt(prompt(message), 10);
            if (isNaN(point) || point <= 0) {
                alert("유효한 정수를 입력하세요.");
                return;
            }

            fetch('/create_betting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players, participants, point })
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('베팅이 생성되었습니다.');
                        loadBetting();
                    } else {
                        alert(data.error || '베팅 생성에 실패했습니다.');
                    }
                })
                .catch(error => console.error('Error:', error));
        })
        .catch(error => console.error('Error:', error));
}
