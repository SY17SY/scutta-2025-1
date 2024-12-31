document.getElementById('update-ranks').addEventListener('click', () => {
    fetch('/update_ranks', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('부수 업데이트가 완료되었습니다.');
                loadLogs();
            } else {
                alert('오류가 발생했습니다.');
            }
        })
        .catch(error => console.error('Error updating ranks:', error));
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
                alert('선택한 로그가 삭제되었습니다.');
                loadLogs();
            } else {
                alert('오류가 발생했습니다.');
            }
        })
        .catch(error => console.error('Error deleting logs:', error));
});

document.getElementById('select-all').addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.log-checkbox');
    checkboxes.forEach(cb => cb.checked = e.target.checked);
});

function loadLogs() {
    fetch('/logs')
        .then(response => response.json())
        .then(data => {
            const logList = document.getElementById('log-list');
            logList.innerHTML = '';
            data.forEach(log => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="border border-gray-300 p-2 text-center">
                        <input type="checkbox" class="log-checkbox" value="${log.id}">
                    </td>
                    <td class="border border-gray-300 p-2 cursor-pointer" onclick="showLogDetail(${log.id})">
                        ${log.title}
                    </td>
                `;
                logList.appendChild(row);
            });
        })
        .catch(error => console.error('Error loading logs:', error));
}

function showLogDetail(logId) {
    fetch(`/log/${logId}`)
        .then(response => response.json())
        .then(data => {
            const logDetail = document.getElementById('log-detail');
            const logListContainer = document.querySelector('table');
            logDetail.querySelector('#log-title').textContent = data.title;
            logDetail.querySelector('#log-table-container').innerHTML = data.html_content;

            logDetail.classList.remove('hidden');
            logListContainer.classList.add('hidden');
        })
        .catch(error => console.error('Error loading log detail:', error));
}

function closeLogDetail() {
    const logDetail = document.getElementById('log-detail');
    const logListContainer = document.querySelector('table');

    logDetail.classList.add('hidden');
    logListContainer.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', loadLogs);
