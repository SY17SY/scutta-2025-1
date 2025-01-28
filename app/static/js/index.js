let currentOffset = 0;
const limit = 10;
let allPlayers = [];
let currentCategory = 'win_order';

document.addEventListener('DOMContentLoaded', () => {
    loadRankings(currentCategory);
});

document.getElementById('menu-toggle').addEventListener('click', () => toggleMenu(true));

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
        <input type="text" placeholder="승리" class="winner-input border rounded w-1/3 p-1 text-center mr-2">
        <div class="flex gap-2">
            <button class="score-input px-4 py-1 border rounded" onclick="toggleScore(this, 'match-${matchCounter}')">3:0</button>
            <button class="score-input px-4 py-1 border rounded" onclick="toggleScore(this, 'match-${matchCounter}')">2:1</button>
        </div>
        <input type="text" placeholder="패배" class="loser-input border rounded w-1/3 p-1 text-center ml-2">
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
            matches.push({ winner, loser, score, league: false });
        }
    });

    if (matches.length === 0) {
        alert("모두 입력해 주세요.");
        return;
    }

    fetch('/check_players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matches })
    })
    .then(response => response.json())
    .then(data => {
        if (data.unknownPlayers.length > 0) {
            alert(`${data.unknownPlayers.join(', ')}이(가) 없습니다.`);
        }

        const validMatches = matches.filter(match =>
            !data.unknownPlayers.includes(match.winner) &&
            !data.unknownPlayers.includes(match.loser)
        );

        if (validMatches.length > 0) {
            fetch('/submit_matches', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validMatches)
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message);
                    document.getElementById('match-list').innerHTML = `
                        <div id="match-1" class="flex items-center justify-between mb-2">
                            <input type="text" placeholder="승리" class="winner-input border rounded w-1/3 p-1 text-center mr-2">
                            <div class="flex gap-2">
                                <button class="px-4 py-1 score-input border rounded" onclick="toggleScore(this, 'match-1')">3:0</button>
                                <button class="px-4 py-1 score-input border rounded" onclick="toggleScore(this, 'match-1')">2:1</button>
                            </div>
                            <input type="text" placeholder="패배" class="loser-input border rounded w-1/3 p-1 text-center ml-2">
                        </div>
                    `;
                    matchCounter = 1;
                    location.reload();
                } else {
                    alert(data.error);
                }
            })
            .catch(error => console.error('Error:', error));
        }
    })
    .catch(error => console.error('Error:', error));
}

function selectCategory(button, category) {
    document.querySelectorAll(".category-buttons button").forEach((btn) => btn.classList.remove("selected"));
    button.classList.add("selected");

    currentCategory = category;

    const dynamicColumn = document.getElementById("dynamic-column");
    const dynamicColumn2 = document.getElementById("dynamic-column-2");
    if (dynamicColumn) {
        dynamicColumn.textContent = getCategoryDisplayName(category);
        dynamicColumn2.textContent = getCategoryDisplayName2(category);
    }

    const searchInput = document.querySelector('input[oninput="searchByName(this.value)"]');
    const query = searchInput ? searchInput.value.trim() : '';

    if (query) {
        searchByName(query);
    } else {
        loadRankings(category);
    }
}

function loadRankings(category, append = false) {
    if (!append) {
        currentOffset = 0;
        currentCategory = category;
        allPlayers = [];
    }

    fetch(`/rankings?category=${category}&offset=${currentOffset}&limit=${limit}`)
        .then((response) => {
            if (!response.ok) {
                throw new Error('데이터를 불러오는 중 문제가 발생했습니다.');
            }
            return response.json();
        })
        .then((data) => {
            if (data.length === 0 && append) {
                return;
            }

            allPlayers = append ? [...allPlayers, ...data] : data;
            updateTable(data, append);
            currentOffset += limit;
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('데이터를 불러오는 데 실패했습니다.');
        });
}

function getCategoryDisplayName(category) {
    const categoryDisplayNames = {
        win_order: "승리",
        loss_order: "패배",
        rate_order: "승률",
        match_order: "경기",
        opponent_order: "상대",
        achieve_order: "업적",
        betting_order: "베팅",
    };
    return categoryDisplayNames[category];
}

function getCategoryDisplayName2(category) {
    const categoryDisplayNames = {
        win_order: "경기",
        loss_order: "경기",
        rate_order: "경기",
        match_order: "승률",
        opponent_order: "경기",
        achieve_order: "베팅",
        betting_order: "업적",
    };
    return categoryDisplayNames[category];
}

function updateTable(data, append) {
    const tableBody = document.getElementById("table-body");
    const dynamicColumn = document.getElementById("dynamic-column");
    const dynamicColumn2 = document.getElementById("dynamic-column-2");
    dynamicColumn.textContent = getCategoryDisplayName(currentCategory);
    dynamicColumn2.textContent = getCategoryDisplayName2(currentCategory);

    if (!append) {
        tableBody.innerHTML = '';
    }

    data.forEach((player) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="border border-gray-300 p-2">${player.current_rank || ""}</td>
            <td class="border border-gray-300 p-2">
                <a href="/player/${player.id}">${player.name || " "}  (${player.rank || "무"})</a>
            </td>
            <td class="border border-gray-300 p-2">${player.category_value}</td>
            <td class="border border-gray-300 p-2 text-gray-500">${player.category_value_2}</td>
        `;
        tableBody.appendChild(row);
    });
}

function loadMore() {
    loadRankings(currentCategory, true);
}

let searchTimeout;
let activeRequest = null;

function searchByName(query) {
    const tableBody = document.getElementById("table-body");

    if (!query.trim()) {
        loadRankings(currentCategory, false);
        return;
    }

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        if (activeRequest) {
            activeRequest.abort();
        }

        const controller = new AbortController();
        activeRequest = controller;

        fetch(`/search_players?query=${encodeURIComponent(query)}&category=${currentCategory}`, {
            signal: controller.signal,
        })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("검색 데이터를 불러오는 중 문제가 발생했습니다.");
                }
                return response.json();
            })
            .then((data) => {
                tableBody.innerHTML = '';
                if (data.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="5" class="border border-gray-300 p-2">검색 결과가 없습니다.</td></tr>';
                    return;
                }

                data.forEach((player) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td class="border border-gray-300 p-2">${player.current_rank || ""}</td>
                        <td class="border border-gray-300 p-2">
                            <a href="/player/${player.id}">${player.name || " "}  (${player.rank || "무"})</a>
                        </td>
                        <td class="border border-gray-300 p-2">${player.category_value}</td>
                        <td class="border border-gray-300 p-2 text-gray-500">${player.category_value_2}</td>
                    `;
                    tableBody.appendChild(row);
                });
            })
            .catch((error) => {
                if (error.name !== "AbortError") {
                    console.error("Error:", error);
                    tableBody.innerHTML = '<tr><td colspan="5" class="border border-gray-300 p-2">검색 결과를 가져오지 못했습니다.</td></tr>';
                }
            })
            .finally(() => {
                activeRequest = null;
            });
    }, 300);
}