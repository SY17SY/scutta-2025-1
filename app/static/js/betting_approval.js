document.addEventListener('DOMContentLoaded', loadBettings);

function loadBettings() {
    fetch('/load_bettings')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('betting-table-body');
            tbody.innerHTML = '';
            data.forEach(betting => {
                const winParticipants = betting.win_participants.join(', ');
                const loseParticipants = betting.lose_participants.join(', ');

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><input type="checkbox" class="row-checkbox" data-id="${betting.id}"></td>
                    <td>${betting.approved ? '승인' : '미승인'}</td>
                    <td>${betting.match.winner_name}</td>
                    <td>${betting.match.score}</td>
                    <td>${betting.match.loser_name}</td>
                    <td>${winParticipants}</td>
                    <td>${loseParticipants}</td>
                    <td>${betting.point}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching bettings:', error));
}

const tabs = document.querySelectorAll('.tab');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

function filterBettings(status) {
    const rows = document.querySelectorAll('#betting-table-body tr');
    rows.forEach(row => {
        const approvedCell = row.cells[1].textContent;
        if (status === 'all' ||
            (status === 'pending' && approvedCell === '미승인') ||
            (status === 'approved' && approvedCell === '승인')) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function approveBettings(ids) {
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
            loadBettings();
        })
        .catch(error => console.error('Error approving bettings:', error));
}

function deleteBettings(ids) {
    fetch('/delete_bettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadBettings();
        })
        .catch(error => console.error('Error deleting bettings:', error));
}

function selectBettings() {
    return Array.from(document.querySelectorAll('.row-checkbox:checked'))
        .map(cb => cb.getAttribute('data-id'));
}

function selectAllBettings() {
    return Array.from(document.querySelectorAll('.row-checkbox')).filter(cb => {
        const approvedCell = cb.closest('tr').querySelector('td:nth-child(2)').textContent;
        return approvedCell === '미승인';
    }).map(cb => cb.getAttribute('data-id'));
}

function toggleSelectAll(checkbox) {
    const selectedTab = document.querySelector('.tab.active').textContent.trim();
    const checkboxes = document.querySelectorAll('.row-checkbox');

    checkboxes.forEach(cb => {
        const approvedCell = cb.closest('tr').querySelector('td:nth-child(2)').textContent;

        if (selectedTab === '전체' && approvedCell === '미승인') {
            cb.checked = checkbox.checked;
        } else if (selectedTab === '승인 대기' && approvedCell === '미승인') {
            cb.checked = checkbox.checked;
        } else if (selectedTab === '승인 완료' && approvedCell === '승인') {
            cb.checked = checkbox.checked;
        }
    });
}
