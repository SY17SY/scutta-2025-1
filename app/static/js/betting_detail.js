function deleteBetting(bettingId) {
    fetch(`/betting/${bettingId}/delete`, { method: 'DELETE' })
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
결과 요약:

승자: ${results.winnerName}
베팅 성공: ${winParticipants}
분배될 포인트: ${results.distributedPoints}

베팅 실패: ${loseParticipants}
                `;

                alert(`${resultInfo}`);

                window.location.href = '/betting.html';
            }
        })
        .catch(error => console.error('Error submitting betting:', error));
}