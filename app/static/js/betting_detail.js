document.addEventListener('DOMContentLoaded', loadBettingDetails);

function loadBettingDetails() {
    fetch(`/betting/${bettingId}/details`)
        .then(response => response.json())
        .then(data => {
            populateRecentMatches(data.recentMatches);
            populateWinRate(data.winRate);
            populateBettingParticipants(data.participants);
        })
        .catch(error => console.error('Error loading betting details:', error));
}

function populateRecentMatches(matches) {
    const tbody = document.getElementById('recent-matches');
    tbody.innerHTML = matches.map(match => `
        <tr>
            <td class="border border-gray-300 p-2">${match.p1_result}</td>
            <td class="border border-gray-300 p-2">${match.score}</td>
            <td class="border border-gray-300 p-2">${match.p2_result}</td>
        </tr>
    `).join('');
}

function populateWinRate(winRate) {
    document.getElementById('p1-wins').textContent = `${winRate.p1_wins}승`;
    document.getElementById('p2-wins').textContent = `${winRate.p2_wins}승`;
}

function populateBettingParticipants(participants) {
    const tbody = document.getElementById('betting-participants');
    tbody.innerHTML = participants.map(participant => `
        <tr>
            <td class="border border-gray-300 p-2 text-center">
                <input type="radio" name="bet-${participant.id}" value="p1" />
            </td>
            <td class="border border-gray-300 p-2">${participant.name}</td>
            <td class="border border-gray-300 p-2 text-center">
                <input type="radio" name="bet-${participant.id}" value="p2" />
            </td>
        </tr>
    `).join('');
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
    // Save logic (to be implemented based on requirements)
}

function submitBetting(bettingId) {
    // Submit logic (to be implemented based on requirements)
}
