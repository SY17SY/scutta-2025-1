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
                    <td>${match.approved ? '승인 완료' : '승인 대기'}</td>
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
            (status === 'pending' && approvedCell === '승인 대기') ||
            (status === 'approved' && approvedCell === '승인 완료')) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function approveAll() {
    fetch('/approve_all', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('모든 경기가 승인되었습니다.');
                loadMatches();
            } else {
                alert('오류가 발생했습니다. 다시 시도해주세요.');
            }
        })
        .catch(error => console.error('Error approving all matches:', error));
}

function approveSelected() {
    const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked'))
        .map(cb => cb.getAttribute('data-id'));

    if (selectedIds.length === 0) {
        alert('승인할 경기를 선택해주세요.');
        return;
    }

    fetch('/approve_selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('선택한 경기가 승인되었습니다.');
                loadMatches();
            } else {
                alert('오류가 발생했습니다. 다시 시도해주세요.');
            }
        })
        .catch(error => console.error('Error approving selected matches:', error));
}

function deleteSelected() {
    const selectedIds = Array.from(document.querySelectorAll('.row-checkbox:checked'))
        .map(cb => cb.getAttribute('data-id'));

    if (selectedIds.length === 0) {
        alert('삭제할 경기를 선택해주세요.');
        return;
    }

    fetch('/delete_selected', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('선택한 경기가 삭제되었습니다.');
                loadMatches();
            } else {
                alert('오류가 발생했습니다. 다시 시도해주세요.');
            }
        })
        .catch(error => console.error('Error deleting selected matches:', error));
}

function toggleSelectAll(checkbox) {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(cb => cb.checked = checkbox.checked);
}
