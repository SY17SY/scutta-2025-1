document.addEventListener('DOMContentLoaded', function () {
    const leagueId = window.location.pathname.split('/').pop();
    loadLeagueDetail(leagueId);
});

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

function loadLeagueDetail(leagueId) {
    fetch(`/league/${leagueId}/detail`)
        .then(response => {
            if (!response.ok) {
                throw new Error('리그 상세 정보를 불러오는 중 문제가 발생했습니다.');
            }
            return response.json();
        })
        .then(data => {
            const inputs = document.querySelectorAll('.league-input');
            inputs.forEach(input => {
                const row = parseInt(input.getAttribute('data-row'), 10);
                const col = parseInt(input.getAttribute('data-col'), 10);
                const key = `p${row + 1}p${col + 1}`;

                if (data.scores && data.scores[key] !== undefined) {
                    input.value = data.scores[key];
                }
            });
        })
        .catch(error => {
            console.error('Error loading league detail:', error);
        });
}

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
        body: JSON.stringify(scores),
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
    const inputs = document.querySelectorAll('input[type="number"]');
    const scores = {};
    let isComplete = true;

    inputs.forEach(input => {
        const row = input.getAttribute('data-row');
        const col = input.getAttribute('data-col');
        const value = parseInt(input.value);

        if (value === null || value === '') {
            isComplete = false;
        }

        scores[`${row}-${col}`] = value || 0;
    });

    if (!isComplete) {
        alert('모든 입력값을 채워주세요.');
        return;
    }

    fetch(`/submit_league/${leagueId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scores)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('리그전이 제출되었습니다.');
            window.location.href = '/league.html';
        } else {
            alert('제출 실패: ' + (data.error || '알 수 없는 오류'));
        }
    })
    .catch(error => console.error('Error submitting league:', error));
}
