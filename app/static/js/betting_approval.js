let currentTab = 'all';
let offset = 0;
const limit = 30;

document.addEventListener('DOMContentLoaded', () => {
    loadBettings(currentTab);

    const tabAll = document.getElementById('tab-all');
    const tabPending = document.getElementById('tab-pending');
    const tabApproved = document.getElementById('tab-approved');

    document.getElementById('load-more').addEventListener('click', () => {
        offset += limit;
        loadBettings(currentTab, offset);
    });

    document.getElementById('tab-all').addEventListener('click', () => {
        document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
        tabAll.classList.add("active");

        currentTab = 'all'
        offset = 0;
        loadBettings(currentTab, offset);
    });

    document.getElementById('tab-pending').addEventListener('click', () => {
        document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
        tabPending.classList.add("active");

        currentTab = 'pending'
        offset = 0;
        loadBettings(currentTab, offset);
    });

    document.getElementById('tab-approved').addEventListener('click', () => {
        document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
        tabApproved.classList.add("active");

        currentTab = 'approved'
        offset = 0;
        loadBettings(currentTab, offset);
    });
});

function loadBettings(tab, newOffset = 0) {
    currentTab = tab;
    offset = newOffset;

    fetch(`/get_bettings?tab=${tab}&offset=${offset}&limit=${limit}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('betting-table-body');
            if (offset === 0) tableBody.innerHTML = '';

            data.forEach(betting => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="select-betting" value="${betting.id}"></td>
                    <td>${betting.approved ? '승인' : '미승인'}</td>
                    <td>${betting.match.winner_name}</td>
                    <td>${betting.match.score}</td>
                    <td>${betting.match.loser_name}</td>
                    <td>${betting.win_participants}</td>
                    <td>${betting.lose_participants}</td>
                    <td>${betting.point}</td>
                `;
                tableBody.appendChild(row);
            });
            document.getElementById('load-more').style.display = data.length < limit ? 'none' : 'block';
        })
        .catch(error => console.error('Error fetching bettings:', error));
}

function approveAllBettings() {
    fetch('/select_all_bettings', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })
        .then(response => response.json())
        .then(data => {
            const ids = data.ids;
            if (ids.length === 0) {
                alert('승인할 베팅이 없습니다.');
                return;
            }

            fetch('/approve_bettings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        alert('모든 베팅이 승인되었습니다.');
                        loadBettings(currentTab);
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
            console.error('베팅 조회 실패:', error);
            alert('베팅 목록을 불러오는 중 오류가 발생했습니다.');
        });
}

function approveBettings() {
    const checkboxes = document.querySelectorAll('.select-match:checked');
    const ids = Array.from(checkboxes).map(checkbox => checkbox.value);

    if (ids.length === 0) {
        alert('승인할 베팅이 없습니다.');
        return;
    }

    fetch('/approve_bettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadBettings(currentTab);
        })
        .catch(error => console.error('Error approving bettings:', error));
}

function deleteBettings() {
    const checkboxes = document.querySelectorAll('.select-match:checked');
    const ids = Array.from(checkboxes).map(checkbox => checkbox.value);

    if (ids.length === 0) {
        alert('선택된 베팅이 없습니다.');
        return;
    }

    fetch('/delete_bettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadBettings(currentTab);
        })
        .catch(error => console.error('Error deleting bettings:', error));
}

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.select-betting');

    checkboxes.forEach(cb => {
        const approvedCell = cb.closest('tr').querySelector('td:nth-child(2)').textContent;

        if ((currentTab === 'all' || currentTab === 'pending') && approvedCell === '미승인') {
            cb.checked = checkbox.checked;
        } else if (currentTab === 'approved' && approvedCell === '승인') {
            cb.checked = checkbox.checked;
        }
    });
}