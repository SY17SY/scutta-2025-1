let currentOffset = 0;
const limit = 10;
let allPlayers = [];
let currentCategory = 'wins';

document.addEventListener('DOMContentLoaded', () => {
    loadRankings(currentCategory);
});

function toggleMenu(show) {
    const menu = document.getElementById('menu');
    const overlay = document.getElementById('menu-overlay');

    if (show) {
        menu.classList.add('active');
        overlay.classList.add('active');
    } else {
        menu.classList.remove('active');
        overlay.classList.remove('active');
    }
}

document.getElementById('menu-toggle').addEventListener('click', () => toggleMenu(true));

function loadRankings(category, append = false) {
    if (!append) {
        currentOffset = 0;
        currentCategory = category;
        allPlayers = []; // 초기화
    }

    fetch(`/rankings?category=${category}&offset=${currentOffset}&limit=${limit}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('데이터를 불러오는 중 문제가 발생했습니다.');
            }
            return response.json();
        })
        .then(data => {
            const rankedData = data.map((player, index) => ({
                ...player,
                current_rank: index + 1 + currentOffset, // 순위 계산
            }));

            allPlayers = append ? [...allPlayers, ...rankedData] : rankedData;

            updateTable(rankedData, append);
            currentOffset += limit;
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
}

function updateTable(data, append) {
    const tableBody = document.getElementById('table-body');
    if (!append) {
        tableBody.innerHTML = '';
    }

    data.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="border border-gray-300 p-2">${player.current_rank}</td>
            <td class="border border-gray-300 p-2">${player.rank || '무'}</td>
            <td class="border border-gray-300 p-2">${player.name || ' '}</td>
            <td class="border border-gray-300 p-2">${player.category_value || 0}</td>
            <td class="border border-gray-300 p-2">${player.match_count || 0}</td>
        `;
        tableBody.appendChild(row);
    });
}

function loadMore() {
    loadRankings(currentCategory, true);
}

function searchByName(query) {
    const tableBody = document.getElementById('table-body');
    const filteredPlayers = allPlayers.filter(player =>
        player.name.toLowerCase().includes(query.toLowerCase())
    );

    tableBody.innerHTML = '';

    filteredPlayers.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="border border-gray-300 p-2">${player.current_rank}</td>
            <td class="border border-gray-300 p-2">${player.rank || '무'}</td>
            <td class="border border-gray-300 p-2">${player.name || ' '}</td>
            <td class="border border-gray-300 p-2">${player.category_value?.toFixed(2) || 0}</td>
            <td class="border border-gray-300 p-2">${player.match_count || 0}</td>
        `;
        tableBody.appendChild(row);
    });

    if (filteredPlayers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">검색 결과가 없습니다.</td></tr>';
    }
}

function selectCategory(button, category) {
    document.querySelectorAll('.flex.mb-4 button').forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');

    const columnNames = {
        wins: '승리',
        losses: '패배',
        winRate: '승률',
        matches: '승률',
        opponents: '상대',
        achievements: '업적',
    };
    const dynamicColumn = document.getElementById('dynamic-column');
    dynamicColumn.textContent = columnNames[category] || '정보';

    loadRankings(category, false);
}

let matchCounter = 1;

function toggleScore(button, matchId) {
    const buttons = document.querySelectorAll(`#${matchId} .score-input`);
    buttons.forEach(btn => btn.classList.remove('selected'));
    button.classList.add('selected');
}

function addMatch() {
    matchCounter++;
    const matchList = document.getElementById('match-list');
    const newMatch = document.createElement('div');
    newMatch.id = `match-${matchCounter}`;
    newMatch.className = 'match-row flex items-center justify-between mb-2';
    newMatch.innerHTML = `
        <input type="text" placeholder="Winner" class="winner-input border rounded w-1/3 p-1 text-center mr-2">
        <div class="flex gap-2">
            <button class="score-input px-4 py-1 border rounded" onclick="toggleScore(this, 'match-${matchCounter}')">3:0</button>
            <button class="score-input px-4 py-1 border rounded" onclick="toggleScore(this, 'match-${matchCounter}')">2:1</button>
        </div>
        <input type="text" placeholder="Loser" class="loser-input border rounded w-1/3 p-1 text-center ml-2">
    `;
    matchList.appendChild(newMatch);
}

function submitMatches() {
    const matches = [];
    const rows = document.querySelectorAll('.match-row');
    
    rows.forEach(row => {
        const winner = row.querySelector('.winner-input')?.value.trim() || '';
        const loser = row.querySelector('.loser-input')?.value.trim() || '';
        const score = row.querySelector('.score-input.selected')?.textContent || '';

        if (winner && loser && score) {
            matches.push({ winner, loser, score });
        }
    });

    if (matches.length === 0) {
        alert("모든 필드를 채워주세요.");
        return;
    }
    
    fetch('/submit_match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matches)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            alert(data.message);
            document.getElementById('match-list').innerHTML = `
                <div id="match-1" class="flex items-center justify-between mb-2">
                    <input type="text" placeholder="Winner" class="winner-input border rounded w-1/3 p-1 text-center mr-2">
                    <div class="flex gap-2">
                        <button class="px-4 py-1 score-input border rounded" onclick="toggleScore(this, 'match-1')">3:0</button>
                        <button class="px-4 py-1 score-input border rounded" onclick="toggleScore(this, 'match-1')">2:1</button>
                    </div>
                    <input type="text" placeholder="Loser" class="loser-input border rounded w-1/3 p-1 text-center ml-2">
                </div>
            `;
            matchCounter = 1;
        }
    })
    .catch(error => console.error('Error:', error));
}