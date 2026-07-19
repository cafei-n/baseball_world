let scheduleData = [];
let gameDates = [];
let currentDate = "";

Promise.all([

    fetch("data/wbsc_results.csv").then(r=>r.text()),
    fetch("data/wbc_results.csv").then(r=>r.text()),
    fetch("data/team_name_ja.csv").then(r=>r.text()),
    fetch("data/ranking_config.csv").then(r=>r.text()),
    fetch("data/country_alias.csv").then(r=>r.text())

]).then(([wbscCsv,wbcCsv,nameCsv,configCsv,aliasCsv])=>{

    loadNames(nameCsv);

    loadTournamentNames(configCsv);

    loadAlias(aliasCsv);

    loadSchedule(wbscCsv);

    loadSchedule(wbcCsv);

    scheduleData.sort(
        (a,b)=>new Date(a.date)-new Date(b.date)
    );

    createGameDates();

    setupDate();

    showSchedule();

});

function loadSchedule(csv){

    const lines = csv.trim().split("\n");

    for(let i=1;i<lines.length;i++){

        const c = parseCSVLine(lines[i]);

        scheduleData.push({

            tournament:c[0],

            date:c[1],

            home:c[2],

            away:c[3],

            home_score:c[4],

            away_score:c[5],

            stadium:c[10],

            location:c[11],

            duration:c[12],

            game_id:c[13]

        });

    }

}

function setupDate(){

    const today =
        new Date();

    const todayStr =
        today.toISOString().substring(0,10);


    const pastDates =
        gameDates.filter(d =>
            d <= todayStr
        );


    currentDate =
        pastDates[pastDates.length - 1];


    document.getElementById("dateSelect").value =
        currentDate;

}

function showSchedule(){

    currentDate =
        document.getElementById("dateSelect").value;

    const area =
        document.getElementById("scheduleList");

    area.innerHTML = "";

    const games =
        scheduleData.filter(x =>
            x.date.substring(0,10) == currentDate
        );

    if(games.length == 0){

        area.innerHTML =
            "<p>この日の試合はありません。</p>";

        return;
    }

    // 大会ごとにまとめる
    const groups = {};

    games.forEach(game=>{

        const name =
            getTournamentName(game.tournament);

        if(!groups[name]){
            groups[name]=[];
        }

        groups[name].push(game);

    });

    // 表示
    for(const tournament in groups){

        const block =
            document.createElement("div");

        block.className = "tournament-block";

        block.innerHTML = `<h3>${tournament}</h3>`;

        const age = getAgeCategory(groups[tournament][0].tournament);

        block.innerHTML = `
            <h3>
                ${
                    age != "制限なし"
                    ? `<div class="age">${age}</div>`
                    : ""
                }
                <div>${tournament}</div>
            </h3>
        `;

        const table =
            document.createElement("table");

        table.className = "schedule-table";

        // ←ここで一度だけ作る
        table.innerHTML = `
            <thead>
                <tr>
                    <th class="team">ビジター</th>
                    <th class="score">スコア</th>
                    <th class="team">ホーム</th>
                    <th class="stadium">会場</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

        const tbody = table.querySelector("tbody");

        groups[tournament].forEach(game=>{

            const today = new Date();
            today.setHours(0,0,0,0);

            const gameDate = new Date(game.date);
            gameDate.setHours(0,0,0,0);

            const futureGame = gameDate >= today;

            let scoreText;

            if(futureGame){
                scoreText = "vs";
            }
            else{
                scoreText = `${game.away_score} - ${game.home_score}`;
            }

            const tr =
                document.createElement("tr");

            const awayTeam = aliasMap[game.away] ?? game.away;
            const homeTeam = aliasMap[game.home] ?? game.home;

            const awayName = nameMap[awayTeam] ?? awayTeam;
            const homeName = nameMap[homeTeam] ?? homeTeam;

            tr.innerHTML = `

                <td class="team">
                    <a href="country.html?team=${encodeURIComponent(homeName)}">
                    ${homeName}
                </td>

                <td class="score">
                    ${scoreText}
                </td>

                <td class="team">
                    <a href="country.html?team=${encodeURIComponent(awayTeam)}">
                        ${awayName}
                    </a>
                </td>

                <td class="stadium">
                    ${game.stadium}
                </td>

            `;

            tbody.appendChild(tr);

        });

        block.appendChild(table);

        area.appendChild(block);

    }

}

function previousDate(){

    currentDate =
        document.getElementById("dateSelect").value;

    let prev = null;

    for(const d of gameDates){

        if(d < currentDate){

            prev = d;

        }else{

            break;

        }

    }

    if(prev){

        currentDate = prev;

        document.getElementById("dateSelect").value =
            currentDate;

        showSchedule();

    }

}

function nextDate(){

    currentDate =
        document.getElementById("dateSelect").value;

    const next =
        gameDates.find(d => d > currentDate);

    if(next){

        currentDate = next;

        document.getElementById("dateSelect").value =
            currentDate;

        showSchedule();

    }

}

function createGameDates(){

    gameDates =
        [...new Set(
            scheduleData.map(x =>
                x.date.substring(0,10)
            )
        )];

}