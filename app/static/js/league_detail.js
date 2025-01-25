document.addEventListener('input', function (event) {
    if (event.target.matches('.league-input')) {
        const input = event.target;
        const value = input.value;

        if (!/^\d*$/.test(value)) {
            input.value = value.replace(/\D/g, '');
        }

        const numericValue = parseInt(input.value, 10);
        if (numericValue > 3) {
            input.value = '';
        } else if (numericValue < 0) {
            input.value = '';
        }
    }
});

function saveLeague(leagueId) {
    const inputs = document.querySelectorAll('.league-input');
    const scores = {};

    inputs.forEach(input => {
        const row = parseInt(input.getAttribute('data-row'), 10);
        const col = parseInt(input.getAttribute('data-col'), 10);
        const key = `p${row + 1}p${col + 1}`;
        const value = input.value.trim();

        scores[key] = value === '' ? null : parseInt(value, 10);
    });

    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4 - i; j++) {
            const key1 = `p${i + 1}p${i + j + 2}`;
            const key2 = `p${i + j + 2}p${i + 1}`;

            const value1 = scores[key1];
            const value2 = scores[key2];

            if (value1 !== null && value2 !== null && value1 + value2 !== 3) {
                alert(
                    `세트 스코어는 3:0 또는 2:1 이어야 합니다.\n` +
                    `선수 ${i + 1} vs 선수 ${i + j + 2} 의 경기 결과를 수정해 주세요.`
                );
                return;
            }

            if (value1 === null && value2 !== null) {
                scores[key1] = 3 - value2;
            } else if (value1 !== null && value2 === null) {
                scores[key2] = 3 - value1;
            }
        }
    }

    fetch(`/save_league/${leagueId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scores }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('리그전이 저장되었습니다.');
                location.reload();
            } else {
                alert(data.error || '저장에 실패했습니다.');
            }
        })
        .catch(error => console.error('Error saving league:', error));
}

function submitLeague(leagueId) {
    const inputs = document.querySelectorAll('.league-input');
    const scores = {};
    let playerNames = [];

    document.querySelectorAll('.player-name').forEach((element, index) => {
        playerNames[index] = element.textContent.trim();
    });

    inputs.forEach(input => {
        const row = parseInt(input.getAttribute('data-row'), 10);
        const col = parseInt(input.getAttribute('data-col'), 10);
        const key = `p${row + 1}p${col + 1}`;
        const value = input.value.trim();

        scores[key] = value === '' ? null : parseInt(value, 10);
    });

    const matches = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4 - i; j++) {
            const key1 = `p${i + 1}p${i + j + 2}`;
            const key2 = `p${i + j + 2}p${i + 1}`;

            let value1 = scores[key1];
            let value2 = scores[key2];

            if (value1 === null && value2 !== null) {
                value1 = 3 - value2;
            } else if (value1 !== null && value2 === null) {
                value2 = 3 - value1;
            } else if (value1 === null && value2 === null) {
                continue
            }

            const winner = value1 > value2 ? playerNames[i] : playerNames[j + i + 1];
            const loser = value1 > value2 ? playerNames[j + i + 1] : playerNames[i];
            const setScore = value1 > value2 ? `${value1}:${value2}` : `${value2}:${value1}`;

            matches.push({ winner: winner, loser: loser, score: setScore, league: true });
        }
    }

    if (matches.length === 0) {
        alert("0개의 경기 결과가 제출되었습니다!");
        fetch(`/delete_league/${leagueId}`, { method: 'DELETE' })
            .then(deleteResponse => {
                if (deleteResponse.ok) {
                    window.location.href = '/league.html';
                } else {
                    alert('리그 데이터를 삭제하지 못했습니다.');
                }
            })
            .catch(error => console.error('Error deleting league:', error));
        return;
    }

    fetch('/submit_matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matches),
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                fetch(`/delete_league/${leagueId}`, { method: 'DELETE' })
                .then(deleteResponse => {
                    if (deleteResponse.ok) {
                        window.location.href = '/league.html';
                    } else {
                        alert('리그 데이터를 삭제하지 못했습니다.');
                    }
                })
                .catch(error => console.error('Error deleting league:', error));
            } else {
                alert('제출 실패: ' + (data.error || '알 수 없는 오류'));
            }
        })
        .catch(error => console.error('Error submitting league:', error));
}
