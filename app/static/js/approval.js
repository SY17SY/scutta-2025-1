let currentTab = 'all';
let offset = 0;
const limit = 30;

document.addEventListener('DOMContentLoaded', () => {
    loadMatches(currentTab);

    const calendarModal = document.getElementById('calendar-modal');
    const openCalendarButton = document.getElementById('open-calendar');
    const closeCalendarButton = document.getElementById('close-calendar');
    const searchDatesButton = document.getElementById('search-dates');
    const clearDatesButton = document.getElementById('clear-dates');
    const calendarElement = document.getElementById('calendar');

    const tabAll = document.getElementById('tab-all');
    const tabPending = document.getElementById('tab-pending');
    const tabApproved = document.getElementById('tab-approved');

    let selectedDates = [];

    let startDate = null;
    let endDate = null;

    if (calendarElement) {
        const calendar = flatpickr(calendarElement, {
            mode: "range",
            dateFormat: "Y-m-d",
            defaultDate: null,
            onChange: (dates) => {
                selectedDates = dates.map(date => flatpickr.formatDate(date, "Y-m-d"));
            },
            onOpen: (selectedDates, dateStr, instance) => {
                const calendarPopup = instance.calendarContainer;
                calendarPopup.style.position = "fixed";
                calendarPopup.style.top = "50%";
                calendarPopup.style.left = "50%";
                calendarPopup.style.transform = "translate(-50%, -50%)";
            }
        });

        searchDatesButton.addEventListener('click', () => {
            calendarModal.classList.add('hidden');
    
            startDate = selectedDates[0];
            endDate = selectedDates[1];
    
            if (!startDate || !endDate) {
                alert('기간을 선택해주세요.');
                return;
            }
    
            offset = 0;
            loadMatches(currentTab, offset, startDate, endDate);
        });    

        clearDatesButton.addEventListener('click', () => {
            calendarModal.classList.add('hidden');
            calendar.clear();
            selectedDates = [];
            startDate = null;
            endDate = null;
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

    document.getElementById('load-more').addEventListener('click', () => {
        offset += limit;
        loadMatches(currentTab, offset, startDate, endDate);
    });

    document.getElementById('tab-all').addEventListener('click', () => {
        document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
        tabAll.classList.add("active");

        currentTab = 'all'
        offset = 0;
        loadMatches(currentTab, offset, startDate, endDate);
    });

    document.getElementById('tab-pending').addEventListener('click', () => {
        document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
        tabPending.classList.add("active");

        currentTab = 'pending'
        offset = 0;
        loadMatches(currentTab, offset, startDate, endDate);
    });

    document.getElementById('tab-approved').addEventListener('click', () => {
        document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
        tabApproved.classList.add("active");

        currentTab = 'approved'
        offset = 0;
        loadMatches(currentTab, offset, startDate, endDate);
    });
});

function loadMatches(tab, newOffset = 0, startDate = null, endDate = null) {
    currentTab = tab;
    offset = newOffset;

    fetch(`/get_matches?tab=${tab}&offset=${offset}&limit=${limit}&start_date=${startDate || ''}&end_date=${endDate || ''}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('match-table-body');
            if (offset === 0) tableBody.innerHTML = '';

            data.forEach(match => {
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
            document.getElementById('load-more').style.display = data.length < limit ? 'none' : 'block';
        })
        .catch(error => console.error('Error fetching matches:', error));
}

function formatTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const date = new Date(timestamp);
    date.setHours(date.getHours() - 9);

    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayOfWeek = days[date.getDay()];
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${month}.${day}.(${dayOfWeek}) ${hours}:${minutes}`;
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
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadMatches(currentTab);
        })
        .catch(error => console.error('Error approving matches:', error));
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
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadMatches(currentTab);
        })
        .catch(error => console.error('Error deleting matches:', error));
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