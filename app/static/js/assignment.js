document.getElementById('update-ranks').addEventListener('click', () => {
    const confirmUpdate = confirm('부수 업데이트를 하시겠습니까?');
    if (confirmUpdate) {
        fetch('/update_ranks', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('부수 업데이트가 완료되었습니다.');
                    location.reload();
                } else {
                    alert('오류가 발생했습니다: ', data.error);
                }
            })
            .catch(error => console.error('Error updating ranks:', error));
    }
});

document.getElementById('revert-log').addEventListener('click', () => {
    fetch('/revert_log', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                location.reload();
            } else {
                alert('복원 중 오류가 발생했습니다: ', data.error);
            }
        })
        .catch(error => console.error('Error reverting log:', error));
});

document.getElementById('select-all').addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.log-checkbox');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
});

document.getElementById('delete-selected').addEventListener('click', () => {
    const selectedIds = Array.from(document.querySelectorAll('.log-checkbox:checked')).map(cb => cb.value);

    if (selectedIds.length === 0) {
        alert('삭제할 항목을 선택해주세요.');
        return;
    }

    fetch('/delete_logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(data.message);
                location.reload();
            } else {
                alert('오류가 발생했습니다.');
            }
        })
        .catch(error => console.error('Error deleting logs:', error));
});

function showLogDetail(logId) {
    fetch(`/log/${logId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const logDetail = document.getElementById('log-detail');
                const btnUpdateRanks = document.getElementById('update-ranks');
                const aboveLogList = document.getElementById('above-log-list');
                const logListContainer = document.querySelector('table');
                logDetail.querySelector('#log-title').textContent = data.title;
                logDetail.querySelector('#log-table-container').innerHTML = data.html_content;
    
                logDetail.classList.remove('hidden');
                btnUpdateRanks.classList.add('hidden');
                aboveLogList.classList.add('hidden');
                logListContainer.classList.add('hidden');
            } else {
                alert(data.error);
            }
        })
        .catch(error => console.error('Error loading log detail:', error));
}

function closeLogDetail() {
    const logDetail = document.getElementById('log-detail');
    const btnUpdateRanks = document.getElementById('update-ranks');
    const aboveLogList = document.getElementById('above-log-list');
    const logListContainer = document.querySelector('table');

    logDetail.classList.add('hidden');
    btnUpdateRanks.classList.remove('hidden');
    aboveLogList.classList.remove('hidden');
    logListContainer.classList.remove('hidden');
}
