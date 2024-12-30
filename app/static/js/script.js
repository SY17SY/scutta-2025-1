function navigateTo(page) {
    window.location.href = page;
}

function confirmNavigation() {
    if (confirm("관리 페이지를 나가시겠습니까?")) {
        window.location.href = 'password.html';
    }
}