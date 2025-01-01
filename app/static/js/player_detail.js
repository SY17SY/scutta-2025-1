document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const playerId = urlParams.get('id');

    if (!playerId) {
        alert("선수 정보를 찾을 수 없습니다.");
        window.history.back();
        return;
    }

    console.log("Fetching player details for ID:", playerId);

    fetch(`/player_detail/${playerId}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert(data.error);
                window.history.back();
                return;
            }

            document.getElementById('player-name').textContent = data.name || '정보 없음';
            document.getElementById('player-rank').textContent = `부수: ${data.rank || '무'}`;
            document.getElementById('player-wins').textContent = data.win_count || 0;
            document.getElementById('player-losses').textContent = data.loss_count || 0;
            document.getElementById('player-winrate').textContent = `${data.win_rate || 0}%`;
            document.getElementById('player-matches').textContent = data.match_count || 0;
            document.getElementById('player-opponents').textContent = data.opponent_count || 0;
            document.getElementById('player-achievements').textContent = data.achievements || 0;
        })
        .catch(error => {
            console.error("Error fetching player details:", error);
            alert("선수 정보를 불러오는 중 문제가 발생했습니다.");
            window.history.back();
        });
});
