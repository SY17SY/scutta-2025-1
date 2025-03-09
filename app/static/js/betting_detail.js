function requestPassword() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '1000';

        const form = document.createElement('div');
        form.style.backgroundColor = 'white';
        form.style.padding = '20px';
        form.style.borderRadius = '10px';
        form.style.textAlign = 'center';
        form.innerHTML = `
            <p>베팅을 수정/삭제하려면 비밀번호를 입력하세요.</p><br>
            <input type="password" id="passwordInput" style="padding: 5px; width: 80%;"><br><br>
            <button id="cancelButton">취소</button>
            <button id="confirmButton" style="margin-left: 20px;">확인</button>
        `;

        modal.appendChild(form);
        document.body.appendChild(modal);

        document.getElementById('confirmButton').addEventListener('click', () => {
            const password = document.getElementById('passwordInput').value;
            document.body.removeChild(modal);
            resolve(password);
        });

        document.getElementById('cancelButton').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(null);
        });
    });
}

async function deleteBetting(bettingId) {
    const password = await requestPassword();
    if (!password) {
        alert('비밀번호를 입력해야 합니다.');
        return;
    }

    if (password !== 'yeong6701') {
        alert('비밀번호가 올바르지 않습니다.');
        return;
    }

    fetch(`/betting/${bettingId}/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                window.location.href = '/betting.html';
            } else {
                alert('베팅 삭제에 실패했습니다: ' + data.error);
            }
        })
        .catch(error => console.error('Error deleting betting:', error));
}

async function addParticipants(bettingId) {
    const password = await requestPassword();
    if (!password) {
        alert('비밀번호를 입력해야 합니다.');
        return;
    }

    if (password !== 'yeong6701') {
        alert('비밀번호가 올바르지 않습니다.');
        return;
    }

    const names = prompt('추가할 참가자 이름을 입력하세요 (공백으로 구분):');
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
                let playerIds = data.player_ids;
                fetch('/add_participants', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerIds: playerIds, bettingId: bettingId })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert(data.message);
                            window.location.reload();
                        } else {
                            alert('참가자 추가에 실패했습니다: ' + data.error);
                        }
                    })
                    .catch(error => console.error('Error adding participants:', error));

            } else {
                alert(`오류 발생: ${data.error}`);
            }
        });
} 

async function removeParticipants(bettingId) {
    const password = await requestPassword();
    if (!password) {
        alert('비밀번호를 입력해야 합니다.');
        return;
    }

    if (password !== 'yeong6701') {
        alert('비밀번호가 올바르지 않습니다.');
        return;
    }

    const names = prompt('삭제할 참가자 이름을 입력하세요 (공백으로 구분):');
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
            let playerIds = data.player_ids;
            fetch('/remove_participants', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerIds: playerIds, bettingId: bettingId })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    window.location.reload();
                } else {
                    alert('참가자 삭제 실패했습니다: ' + data.error);
                }
            })
            .catch(error => console.error('Error removing participants:', error));

        } else {
            alert(`오류 발생: ${data.error}`);
        }
    })
    .catch(error => console.error('Error fetching player IDs:', error));
}

function saveBetting(bettingId) {
    const participants = Array.from(document.querySelectorAll('[name^="betting-"]'))
        .filter(input => input.checked)
        .map(input => {
            const [winner, id] = input.value.split('-');
            return {
                id: parseInt(id, 10),
                winner: parseInt(winner, 10)
            };
        });

    fetch(`/betting/${bettingId}/update`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ participants })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                location.reload();
            } else {
                alert('베팅 저장 실패: ' + data.error);
            }
        })
        .catch(error => console.error('Error saving betting data:', error));
}

function toggleScore(button, matchId) {
    const buttons = document.querySelectorAll(`#${matchId} .score-input`);
    buttons.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
}

function submitBetting(bettingId) {
    const winnerInput = document.querySelector('.winner-input').value.trim();
    const loserInput = document.querySelector('.loser-input').value.trim();
    const score = document.querySelector('.score-input.selected')?.textContent.trim();

    if (!winnerInput || !loserInput || !score) {
        alert('모든 값을 입력해주세요!');
        return;
    }

    fetch('/submit_betting_result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            bettingId,
            p1Name: winnerInput,
            p2Name: loserInput,
            winnerName: winnerInput,
            score: score
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(`오류: ${data.error}`);
            } else {
                const results = data.results;
                const winParticipants = results.winParticipants.join(', ');
                const loseParticipants = results.loseParticipants.join(', ');

                const resultInfo = `
[결과 요약]

승리 : ${results.winnerName}
성공 : ${winParticipants}
포인트 : ${results.distributedPoints}

패배 : ${results.loserName}
실패 : ${loseParticipants}
                `;

                alert(`${resultInfo}`);

                window.location.href = '/betting.html';
            }
        })
        .catch(error => console.error('Error submitting betting:', error));
}