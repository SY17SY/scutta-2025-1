function registerPlayers() {
    const input = document.getElementById('player-input');
    const players = input.value.trim().split(' ');

    if (players.length > 0 && players[0] !== "") {
        alert(`${players.length}명의 선수가 등록되었습니다.`);
        input.value = ""; // Reset the textarea
    } else {
        alert("선수를 입력해주세요.");
    }

    // TODO: 데이터베이스에 저장하는 로직 추가 예정
}

function deleteSelectedPlayers() {
    alert("선택된 선수를 삭제하는 로직이 추가될 예정입니다.");
}