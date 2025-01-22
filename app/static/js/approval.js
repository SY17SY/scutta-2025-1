let currentTab = 'all';
let offset = 0;
const limit = 30;

document.addEventListener('DOMContentLoaded', () => {
    loadMatches(currentTab);

    document.getElementById('load-more').addEventListener('click', () => {
        offset += limit;
        loadMatches(currentTab, offset);
    });

    const calendarModal = document.getElementById('calendar-modal');
    const openCalendarButton = document.getElementById('open-calendar');
    const closeCalendarButton = document.getElementById('close-calendar');
    const searchDatesButton = document.getElementById('search-dates');
    const clearDatesButton = document.getElementById('clear-dates');
    const calendarElement = document.getElementById('calendar');

    let selectedDates = [];

    if (calendarElement) {
        const calendar = flatpickr(calendarElement, {
            mode: "range",
            dateFormat: "Y-m-d",
            defaultDate: null,
            onChange: (dates) => {
                selectedDates = dates.map(date => {
                    const seoulTime = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
                    return flatpickr.formatDate(seoulTime, "Y-m-d");
                });
            }
        });

        clearDatesButton.addEventListener('click', () => {
            calendarModal.classList.add('hidden');
            calendar.clear();
            selectedDates = [];
            loadMatches(currentTab);
        });
    } else {
        console.error('Calendar element not found!');
    }

    openCalendarButton.addEventListener('click', () => {
        calendarModal.classList.remove('hidden');
    });

    closeCalendarButton.addEventListener('click', () => {
        calendarModal.classList.add('hidden');
    });

    searchDatesButton.addEventListener('click', () => {
        calendarModal.classList.add('hidden');

        const [startDate, endDate] = selectedDates;

        if (!startDate || !endDate) {
            alert('기간을 선택해주세요.');
            return;
        }

        offset = 0;
        loadMatches(currentTab, offset, startDate, endDate);
    });
});

function loadMatches(tab, newOffset = 0, startDate = null, endDate = null) {
    currentTab = tab;
    offset = newOffset;

    fetch(`/get_matches?tab=${tab}&offset=${offset}&limit=${limit}&startDate=${startDate || ''}&endDate=${endDate || ''}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('match-table-body');
            if (offset === 0) tableBody.innerHTML = '';

            data.matches.forEach(match => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" value="${match.id}" class="select-match"></td>
                    <td>${match.approved ? '승인' : '미승인'}</td>
                    <td>${match.winner_name}</td>
                    <td>${match.score}</td>
                    <td>${match.loser_name}</td>
                    <td>${formatTimestamp(match.timestamp)}</td>
                `;
                tableBody.appendChild(row);
            });

            document.getElementById('load-more').style.display = data.matches.length < limit ? 'none' : 'block';
        });
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayOfWeek = daysOfWeek[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}.${month}.${day}.(${dayOfWeek}) ${hours}:${minutes}`;
}

function selectTab(button, tab) {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");

    currentTab = tab;
    offset = 0;
    loadMatches(currentTab, offset);
}

function approveAllMatches() {
    fetch('/select_all_matches', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(response => response.json())
        .then(data => {
            const ids = data.ids;
            if (ids.length === 0) {
                alert('승인할 경기가 없습니다.');
                return;
            }

            fetch('/approve_matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert('모든 경기가 승인되었습니다.');
                        loadMatches(currentTab);
                    } else {
                        alert('승인 처리 중 오류가 발생했습니다.');
                    }
                })
                .catch(error => {
                    console.error('승인 요청 실패:', error);
                    alert('승인 처리에 실패했습니다.');
                });
        })
        .catch(error => {
            console.error('경기 조회 실패:', error);
            alert('경기 목록을 불러오는 중 오류가 발생했습니다.');
        });
}

function approveMatches() {
    const checkboxes = document.querySelectorAll('.select-match:checked');
    const ids = Array.from(checkboxes).map(checkbox => checkbox.value);

    if (ids.length === 0) {
        alert('선택된 경기가 없습니다.');
        return;
    }

    fetch('/approve_matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    }).then(response => {
        if (response.ok) {
            alert(data.message);
            loadMatches(currentTab);
        } else {
            alert('승인 실패했습니다.');
        }
    });
}

function deleteMatches() {
    const checkboxes = document.querySelectorAll('.select-match:checked');
    const ids = Array.from(checkboxes).map(checkbox => checkbox.value);

    if (ids.length === 0) {
        alert('선택된 경기가 없습니다.');
        return;
    }

    fetch('/delete_matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    }).then(response => {
        if (response.ok) {
            alert(data.message);
            loadMatches(currentTab);
        } else {
            alert('삭제 실패했습니다.');
        }
    });
}

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.select-match');

    checkboxes.forEach(cb => {
        const approvedCell = cb.closest('tr').querySelector('td:nth-child(2)').textContent;

        if ((currentTab === 'all' || currentTab === 'pending') && approvedCell === '미승인') {
            cb.checked = checkbox.checked;
        } else if (currentTab === 'approved' && approvedCell === '승인') {
            cb.checked = checkbox.checked;
        }
    });
}