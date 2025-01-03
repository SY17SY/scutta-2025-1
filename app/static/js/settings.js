document.addEventListener('DOMContentLoaded', () => {
    loadPlayers();
});

function registerPlayers() {
    const input = document.getElementById('player-input');
    const players = input.value.trim().split(' ');

    if (players.length > 0 && players[0] !== "") {
        fetch('/register_players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ players })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`${data.added_count}명의 선수가 등록되었습니다.`);
                    input.value = "";
                    loadPlayers();
                } else {
                    alert('오류가 발생했습니다. 다시 시도해주세요.');
                }
            })
            .catch(error => console.error('Error registering players:', error));
    } else {
        alert("선수를 입력해주세요.");
    }
}

function loadPlayers() {
    fetch('/get_players')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('player-table-body');
            tbody.innerHTML = '';
            data.forEach(player => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="row-checkbox" data-id="${player.id}"></td>
                    <td>
                        <a href="/player/${player.id}">${player.name}</a>
                    </td>
                    <td>${player.rate_count}%</td>
                    <td>${player.match_count}</td>
                    <td>${player.achieve_count}</td>
                    <td><button class="bg-main text-white px-2 py-1 rounded" onclick="addAchievement(${player.id})">추가</button></td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error loading players:', error));
}

function addAchievement(playerId) {
    const input = prompt('추가할 점수를 입력하세요:')
    const additionalAchievements = parseInt(input, 10);

    if (isNaN(additionalAchievements) || additionalAchievements <= 0) {
        alert('올바른 숫자를 입력해주세요.');
        return;
    }

    fetch('/update_achievement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: playerId, achievements: additionalAchievements })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                loadPlayers();
            } else {
                alert(`오류 발생: ${data.error}`);
            }
        })
        .catch(error => console.error('Error updating achievements:', error));
}


function deleteSelectedPlayers() {
    const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked'))
        .map(cb => cb.getAttribute('data-id'));

    if (selectedIds.length === 0) {
        alert('삭제할 선수를 선택해주세요.');
        return;
    }

    fetch('/delete_players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('선택한 선수가 삭제되었습니다.');
                loadPlayers();
            } else {
                alert('오류가 발생했습니다. 다시 시도해주세요.');
            }
        })
        .catch(error => console.error('Error deleting players:', error));
}

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}

