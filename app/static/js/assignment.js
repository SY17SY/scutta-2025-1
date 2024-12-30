function navigateToDetail(date) {
    window.location.href = `assignment_detail.html?date=${encodeURIComponent(date)}`;
}

function addListItem() {
    const list = document.getElementById('list');
    const dateObj = new Date();
    const date = dateObj.toISOString().split('T')[0];
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const day = days[dateObj.getUTCDay()];

    const newItem = document.createElement('div');
    newItem.className = 'list-item';
    newItem.textContent = `${date} ${day}`;
    newItem.onclick = () => navigateToDetail(`${date} ${day}`);
    list.prepend(newItem);
}