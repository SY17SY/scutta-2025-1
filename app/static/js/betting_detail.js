document.addEventListener('DOMContentLoaded', () => {
    const bettingId = window.location.pathname.split('/')[2];

    fetch(`/betting/${bettingId}/details`)
        .then(response => response.json())
        .then(data => {
            populateRecentMatches(data.recentMatches);
            populateWinRate(data.winRate);
            populateBettingParticipants(data.participants, data.p1_id, data.p2_id);
        })
        .catch(error => console.error('Error loading betting details:', error));
});

function populateRecentMatches(matches) {
    const tbody = document.getElementById('recent-matches');
    tbody.innerHTML = matches.map(match => `
        <tr>
            <td class="border border-gray-300 p-2">${match.p1_score}</td>
            <td class="border border-gray-300 p-2">${match.score}</td>
            <td class="border border-gray-300 p-2">${match.p2_score}</td>
        </tr>
    `).join('');
}

function populateWinRate(winRate) {
    document.getElementById('p1-wins').textContent = `${winRate.p1_wins}승`;
    document.getElementById('p2-wins').textContent = `${winRate.p2_wins}승`;
}

function populateBettingParticipants(participants, p1Id, p2Id) {
    const tbody = document.getElementById('betting-participants');
    tbody.innerHTML = participants.map(participant => {
        const isP1Selected = participant.winner_id === p1Id;
        const isP2Selected = participant.winner_id === p2Id;

        return `
            <tr>
                <td class="border border-gray-300 p-2 text-center">
                    <input type="radio" name="betting-${participant.participant_id}" value="${p1Id}-${participant.participant_id}" ${isP1Selected ? 'checked' : ''} />
                </td>
                <td class="border border-gray-300 p-2">${participant.name}</td>
                <td class="border border-gray-300 p-2 text-center">
                    <input type="radio" name="betting-${participant.participant_id}" value="${p2Id}-${participant.participant_id}" ${isP2Selected ? 'checked' : ''} />
                </td>
            </tr>
        `;
    }).join('');
}

function deleteBetting(bettingId) {
    fetch(`/betting/${bettingId}/delete`, { method: 'DELETE' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('베팅이 삭제되었습니다.');
                window.location.href = '/betting.html';
            } else {
                alert('베팅 삭제 실패: ' + data.error);
            }
        })
        .catch(error => console.error('Error deleting betting:', error));
}

function saveBetting(bettingId) {
    const participants = Array.from(document.querySelectorAll('[name^="betting-"]')).map(input => {
        const [winner, id] = input.value.split('-');
        return {
            id: parseInt(id, 10),
            winner: winner
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
                alert('베팅 데이터가 성공적으로 저장되었습니다!');
                location.reload();
            } else {
                alert('베팅 저장 실패: ' + data.error);
            }
        })
        .catch(error => console.error('Error saving betting data:', error));
}

function submitBetting(bettingId) {
    // Submit logic (to be implemented based on requirements)
}
