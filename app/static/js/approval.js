document.addEventListener('DOMContentLoaded', () => {
    loadMatches();
});

const tabs = document.querySelectorAll('.tab');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

function loadMatches() {
    fetch('/get_matches')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('match-table-body');
            tbody.innerHTML = '';
            data.forEach(match => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${match.winner_name}</td>
                    <td>${match.score}</td>
                    <td>${match.loser_name}</td>
                    <td>${match.approved ? '승인' : '미승인'}</td>
                    <td><input type="checkbox" class="row-checkbox" data-id="${match.id}"></td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching matches:', error));
}

function filterMatches(status) {
    const rows = document.querySelectorAll('#match-table-body tr');
    rows.forEach(row => {
        const approvedCell = row.cells[3].textContent;
        if (status === 'all' ||
            (status === 'pending' && approvedCell === '미승인') ||
            (status === 'approved' && approvedCell === '승인')) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function approveMatches(ids) {
    fetch('/approve_matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadMatches();
        })
        .catch(error => console.error('Error approving matches:', error));
}

function deleteMatches(ids) {
    fetch('/delete_matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
    })
        .then(response => response.json())
        .then(data => {
            alert(data.message);
            loadMatches();
        })
        .catch(error => console.error('Error deleting matches:', error));
}

function selectMatches() {
    return Array.from(document.querySelectorAll('.row-checkbox:checked'))
        .map(cb => cb.getAttribute('data-id'));
}

function selectAllMatches() {
    const selectedTab = document.querySelector('.tab.active').textContent.trim();

    return Array.from(document.querySelectorAll('.row-checkbox')).filter(cb => {
        const approvedCell = cb.closest('tr').querySelector('td:nth-child(4)').textContent;

        if (selectedTab === '전체') {
            return approvedCell === '미승인';
        } else if (selectedTab === '승인 대기') {
            return approvedCell === '미승인';
        } else if (selectedTab === '승인 완료') {
            return approvedCell === '승인';
        }
        return false;
    }).map(cb => cb.getAttribute('data-id'));
}

function toggleSelectAll(checkbox) {
    const selectedTab = document.querySelector('.tab.active').textContent.trim();
    const checkboxes = document.querySelectorAll('.row-checkbox');

    checkboxes.forEach(cb => {
        const approvedCell = cb.closest('tr').querySelector('td:nth-child(4)').textContent;

        if (selectedTab === '전체' && approvedCell === '미승인') {
            cb.checked = checkbox.checked;
        } else if (selectedTab === '승인 대기' && approvedCell === '미승인') {
            cb.checked = checkbox.checked;
        } else if (selectedTab === '승인 완료' && approvedCell === '승인') {
            cb.checked = checkbox.checked;
        }
    });
}
