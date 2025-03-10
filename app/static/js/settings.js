function resetPartner() {
    fetch('/reset_partner', {
        method: 'POST',
    })
    .then(response => {
        if (response.ok) {
            alert("오늘의 상대가 초기화되었습니다.");
        } else {
            alert("초기화에 실패했습니다. 다시 시도해주세요.");
        }
    })
    .catch(error => {
        console.error("초기화 요청 중 오류:", error);
        alert("초기화 요청에 실패했습니다.");
    });
}

function registerPartner() {
    if (confirm('등록 전, 초기화 먼저 하시겠습니까?')) {
        resetPartner();
    }

    const resetPartnerButton = document.getElementById('reset-partner-button');
    const oldPlayerInput = document.getElementById('old-player-input');
    const newPlayerInput = document.getElementById('new-player-input');
    const registerPartnerButton1 = document.getElementById('register-partner-button-1');
    const settingPartnerTable = document.getElementById('setting-partner-table');
    const registerPartnerButton2 = document.getElementById('register-partner-button-2');

    if (!oldPlayerInput || !newPlayerInput) {
        alert("기존 부원 이름과 신입 부원 이름을 모두 입력해주세요.");
        return;
    }

    resetPartnerButton.classList.add('hidden');
    oldPlayerInput.classList.add('hidden');
    newPlayerInput.classList.add('hidden');
    registerPartnerButton1.classList.add('hidden');

    settingPartnerTable.classList.remove('hidden');
    registerPartnerButton2.classList.remove('hidden');

    const oldPlayers = oldPlayerInput.value.trim().split(" ");
    const newPlayers = newPlayerInput.value.trim().split(" ").reverse();

    fetch('/register_partner', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ old_players: oldPlayers, new_players: newPlayers, }),
    })
        .then(response => response.json())
        .then(pairs => {
            const tbody = document.getElementById('setting-partner-body');
            tbody.innerHTML = '';
            pairs.forEach(pair => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input class="partner1-input w-24 text-center" value="${pair.p1_name}"></td>
                    <td><input class="partner2-input w-24 text-center" value="${pair.p2_name}"></td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error("등록 요청 중 오류:", error));
}

function submitPartner() {
    const settingPartnerTable = document.getElementById('setting-partner-table');
    const rows = settingPartnerTable.querySelectorAll('tbody tr');
    const pairs = [];

    rows.forEach(row => {
        const p1Input = row.querySelector('.partner1-input').value.trim();
        const p2Input = row.querySelector('.partner2-input').value.trim();

        if (p1Input && p2Input) {
            pairs.push({ p1_name: p1Input, p2_name: p2Input });
        }
    });

    fetch('/submit_partner', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pairs: pairs }),
    })
        .then(response => {
            if (response.ok) {
                alert("오늘의 상대가 저장되었습니다.");
                window.location.href = '/partner.html';
            } else {
                alert("저장 중 문제가 발생했습니다.");
            }
        })
        .catch(error => {
            console.error("저장 요청 중 오류:", error);
            alert("저장 요청에 실패했습니다.");
        });
}

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
                    location.reload();
                } else {
                    alert('오류가 발생했습니다. 다시 시도해주세요.');
                }
            })
            .catch(error => console.error('Error registering players:', error));
    } else {
        alert("선수를 입력해주세요.");
    }
}

function toggleValidity() {
    const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.getAttribute('data-id'));

    if (selectedIds.length === 0) {
        alert('유효/무효 상태를 변경할 항목을 선택해주세요.');
        return;
    }

    fetch('/toggle_validity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                location.reload();
            } else {
                alert('유효/무효 상태 변경 중 문제가 발생했습니다:', data.error);
            }
        })
        .catch(error => console.error('Error toggling validity:', error));
}

function deleteSelectedPlayers() {
    const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.getAttribute('data-id'));

    if (selectedIds.length === 0) {
        alert('삭제할 선수를 선택해주세요.');
        return;
    }

    if (!confirm('정말 삭제하시겠습니까?')) {
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
                alert(data.message);
                location.reload();
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

function addForSelected(type) {
    let playerIds = Array.from(document.querySelectorAll('.row-checkbox:checked')).map(cb => cb.getAttribute('data-id'));

    if (playerIds.length === 0) {
        const names = prompt('선수 이름을 입력하세요 (공백으로 구분):');
        if (!names) return;
        const playerNames = names.split(' ');
        fetch('/get_player_ids', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ names: playerNames })
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    playerIds = data.player_ids;
                    sendAddRequest(playerIds, type);
                } else {
                    alert(`오류 발생: ${data.error}`);
                }
            });
    } else {
        sendAddRequest(playerIds, type);
    }
}

function sendAddRequest(playerIds, type) {
    const points = prompt('추가할 점수를 입력하세요:');
    const additionalPoints = parseInt(points, 10);

    if (isNaN(additionalPoints) || additionalPoints === 0) {
        alert('올바른 숫자를 입력해주세요.');
        return;
    }

    const body = { player_ids: playerIds };
    if (type === 'achieve') body.achieve = additionalPoints;
    else if (type === 'betting') body.betting = additionalPoints;
    else body.achieve = body.betting = additionalPoints;

    fetch('/update_achievement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                alert(`오류 발생: ${data.error}`);
            }
        })
        .catch(error => console.error('Error:', error));
}
