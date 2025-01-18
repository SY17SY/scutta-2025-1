document.addEventListener('DOMContentLoaded', () => {
    const bettingId = window.location.pathname.split('/')[2];

    fetch(`/betting/${bettingId}/details`)
        .then(response => response.json())
        .then(data => {
            populateRecentMatches(data.recentMatches);
            populateWinRate(data.winRate);
            populateBettingParticipants(data.participants);
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

function populateBettingParticipants(participants) {
    const tbody = document.getElementById('betting-participants');
    tbody.innerHTML = participants.map(participant => {
        const isP1Selected = participant.winner_id === 'p1';
        const isP2Selected = participant.winner_id === 'p2';

        return `
            <tr>
                <td class="border border-gray-300 p-2 text-center">
                    <input type="radio" name="betting-${participant.id}" value="p1-${participant.id}" ${isP1Selected ? 'checked' : ''} />
                </td>
                <td class="border border-gray-300 p-2">${participant.name}</td>
                <td class="border border-gray-300 p-2 text-center">
                    <input type="radio" name="betting-${participant.id}" value="p2-${participant.id}" ${isP2Selected ? 'checked' : ''} />
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
    const participants = document.querySelectorAll(`#betting-participants tr`);
    const winnerUpdates = [];

    participants.forEach(participantRow => {
        const participantName = participantRow.querySelector('td:nth-child(2)')?.textContent.trim();

        fetch(`/get_participant_id?betting_id=${bettingId}&participant_name=${encodeURIComponent(participantName)}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error(`Error fetching participant id: ${data.error}`);
                    return;
                }

                const participantId = data.participant_id;

                const p1Radio = participantRow.querySelector(`input[name="betting-${participantName}"][value="p1-${participantName}"]`);
                const p2Radio = participantRow.querySelector(`input[name="betting-${participantName}"][value="p2-${participantName}"]`);

                let winnerId = null;
                if (p1Radio && p1Radio.checked) {
                    winnerId = "p1";
                } else if (p2Radio && p2Radio.checked) {
                    winnerId = "p2";
                }

                winnerUpdates.push({
                    participantId: participantId,
                    participantName: participantName,
                    winnerId: winnerId
                });
            })
            .catch(error => {
                console.error('Error fetching participant data:', error);
            });
    });

    fetch(`/update_betting_participants/${bettingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerUpdates })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('베팅 결과가 저장되었습니다.');
            } else {
                alert('저장 실패: ' + (data.error || '알 수 없는 오류'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('네트워크 오류가 발생했습니다.');
        });
}

function submitBetting(bettingId) {
    // Submit logic (to be implemented based on requirements)
}
