let tournamentData = [];
let tournamentList = [];
let selectedYear = "";
let selectedTournament = "";
let tournamentMatches = [];


window.onload = function(){

    loadTournamentPage();

};

async function loadTournamentPage(){

    const nameCsv =
        await fetch(
            "data/team_name_ja.csv"
        )
        .then(r=>r.text());

    loadNames(nameCsv);

    const aliasCsv =
        await fetch(
            "data/country_alias.csv"
        )
        .then(r=>r.text());


    loadAlias(aliasCsv);

    const dailyCsv =
        await fetch(
            "data/ranking_daily.csv"
        )
        .then(r=>r.text());


    loadDailyRanking(dailyCsv);

    const tournamentCsv =
        await fetch(
            "data/ranking_config.csv"
        )
        .then(r=>r.text());

    loadTournamentNames(
        tournamentCsv
    );

    const wbscCsv =
        await fetch(
            "data/wbsc_results.csv"
        )
        .then(r=>r.text());


    const wbcCsv =
        await fetch(
            "data/wbc_results.csv"
        )
        .then(r=>r.text());


    tournamentData =
        [
            ...parseCSV(wbscCsv),
            ...parseCSV(wbcCsv)
        ];

    tournamentData.forEach(game=>{
        game.displayTournament =
            getTournamentName(
                game.tournament
            );
    });


    createYearList();
}

function parseCSV(text){

    const lines =
        text.trim().split("\n");

    const headers =
        parseCSVLine(lines[0]);

    return lines.slice(1).map(line=>{

        const values =
            parseCSVLine(line);

        let obj = {};

        headers.forEach((h,i)=>{

            obj[h.trim()] =
                values[i]
                ? values[i].trim()
                : "";
        });

        return obj;

    });

}

function createYearList(){

    const years =
        [...new Set(

            tournamentData.map(
                d => d.date.substring(0,4)
            )
        )]
        .sort()
        .reverse();

    const select =
        document.getElementById(
            "yearSelect"
        );

    select.innerHTML = "";

    years.forEach(year=>{

        let option =
            document.createElement(
                "option"
            );

        option.value =
            year;

        option.textContent =
            year + "年";

        select.appendChild(
            option
        );

    });

    selectedYear =
        years[0];
    select.value =
        selectedYear;
    createTournamentList();

}

function changeYear(){

    selectedYear =
        document.getElementById(
            "yearSelect"
        ).value;
    createTournamentList();
}

function createTournamentList(){

    const yearData =
        tournamentData.filter(
            d =>
            d.date.startsWith(
                selectedYear
            )
        );

    tournamentList =
    [
        ...new Set(

            yearData.map(d=>{

                return d.displayTournament;

            })

        )
    ];

    const select =
        document.getElementById(
            "tournamentSelect"
        );

    select.innerHTML =
        "";

    tournamentList.forEach(t=>{

        let option =
            document.createElement(
                "option"
            );

        option.value =
            t;

        const age =
            "制限なし";


        option.textContent =
            t;

        select.appendChild(
            option
        );
    });

    selectedTournament =
        tournamentList[0];

    select.value =
        selectedTournament;
    showTournament();

}

function showTournament(){

    selectedTournament =
        document.getElementById(
            "tournamentSelect"
        ).value;

    tournamentMatches =
        tournamentData.filter(d=>{

            if(
                selectedTournament === "World Baseball Classic"
            ){

                return (
                    d.tournament.includes("World Baseball Classic")
                    &&
                    !d.tournament.includes("Exhibition")
                    &&
                    d.date.startsWith(
                        selectedYear
                    )
                );

            }

            return (
                d.displayTournament
                ===
                selectedTournament
                &&
                d.date.startsWith(
                    selectedYear
                )
            );

        });

    showTournamentInfo();

    showMatchList();

}

function showTournamentInfo(){

    const tbody =
        document.getElementById(
            "tournamentInfo"
        );

    if(
        tournamentMatches.length === 0
    ){
        tbody.innerHTML =
            "";
        return;
    }

    const start =
        tournamentMatches
        .map(d=>d.date.substring(0,10))
        .sort()[0];

    const end =
        tournamentMatches
        .map(d=>d.date.substring(0,10))
        .sort()
        .slice(-1)[0];

    const teams =
        getTournamentTeams();

    tbody.innerHTML = `

        <tr>

            <th>
                大会名
            </th>

            <td>
                ${selectedTournament}
            </td>

        </tr>

        <tr>

            <th>
                開催年
            </th>

            <td>
                ${selectedYear}
            </td>

        </tr>

        <tr>

            <th>
                開催期間
            </th>

            <td>
                ${start}
                ～ 
                ${end}
            </td>

        </tr>

        <tr>

            <th>
                参加国数
            </th>

            <td>
                ${teams.length}
                チーム
            </td>

        </tr>
    `;
}

function showMatchList(){

    const tbody =
        document.getElementById(
            "matchList"
        );

    tbody.innerHTML =
        "";

    tournamentMatches
    .sort(
        (a,b)=>
        a.date.localeCompare(
            b.date
        )
    )
    .forEach(game=>{

        const tr =
            document.createElement(
                "tr"
            );

        tr.innerHTML = `

            <td>
                ${game.date.substring(0,10)}
            </td>

            <td>
                <a href="country.html?team=${encodeURIComponent(aliasMap[game.away] || game.away)}">
                    ${
                        nameMap[
                            aliasMap[game.away] || game.away
                        ]
                        ||
                        aliasMap[game.away]
                        ||
                        game.away
                    }
                </a>
            </td>

            <td>
                ${game.away_score}
                -
                ${game.home_score}
            </td>

            <td>
                <a href="country.html?team=${encodeURIComponent(aliasMap[game.home] || game.home)}">
                    ${
                        nameMap[
                            aliasMap[game.home] || game.home
                        ]
                        ||
                        aliasMap[game.home]
                        ||
                        game.home
                    }
                </a>
            </td>

            <td>
                ${game.stadium || ""}
            </td>
        `;
        tbody.appendChild(
            tr
        );

    });

}



let teamRankingData = [];
let currentSort =
    {
        key: "endRank",
        asc: true
    };

let rankChart = null;

function getTournamentTeams(){

    let teams =
        [];
    tournamentMatches.forEach(game=>{

        if(
            game.home &&
            !teams.includes(game.home)
        ){
            teams.push(
                game.home
            );
        }

        if(
            game.away &&
            !teams.includes(game.away)
        ){
            teams.push(
                game.away
            );
        }
    });

    return teams;

}

function getRankingAtDate(
    country,
    date
){

    console.log(
        "検索:",
        country,
        date
    );

    console.log(
        "dailyData検索件数:",
        dailyData.filter(
            d=>d.team === country
        ).length
    );

    const target =
        aliasMap[country]
        ||
        country;

    const data =
        dailyData
        .filter(
            d =>
            (
                d.team === country
                ||
                d.team === target
            )
            &&
            d.date.substring(0,10)
            <=
            date
        )
        .sort(
            (a,b)=>
            a.date.localeCompare(b.date)
        );

    if(
        data.length === 0
    ){
        return null;
    }

    return data[data.length-1];

}

function createTeamRanking(){

    const teams =
        getTournamentTeams();

    const dates =
        tournamentMatches
        .map(d=>d.date.substring(0,10))
        .filter(d=>d);

    if(
        dates.length === 0
    ){
        console.log(
            "日付データなし"
        );
        return;
    }

    const startDate =
        dates.sort()[0];

    const endDate =
        dates.sort()
        .slice(-1)[0];

    const beforeDate =
        new Date(startDate);

    beforeDate.setDate(
        beforeDate.getDate() - 1
    );

    const startRankingDate =
        beforeDate
        .toISOString()
        .substring(0,10);

    teamRankingData =
        teams.map(team=>{

            const before =
                getRankingAtDate(
                    team,
                    startRankingDate
                );

            const after =
                getRankingAtDate(
                    team,
                    endDate
                );

            let wins = 0;
            let losses = 0;
            let draws = 0;

            tournamentMatches.forEach(game=>{

                if(game.home === team){

                    const home =
                        Number(game.home_score);
                    const away =
                        Number(game.away_score);

                    if(home > away){
                        wins++;
                    }
                    else if(home < away){
                        losses++;
                    }else{
                        draws++;
                    }
                }

                if(game.away === team){

                    const away =
                        Number(game.away_score);
                    const home =
                        Number(game.home_score);

                    if(away > home){
                        wins++;
                    }
                    else if(away < home){
                        losses++;
                    }else{
                        draws++;
                    }
                }

            });

            return {
                country:
                    team,

                startRank:
                    before
                    ?
                    Number(before.rank)
                    :
                    "-",

                endRank:
                    after
                    ?
                    Number(after.rank)
                    :
                    "-",

                startPoint:
                    before
                    ?
                    Number(before.point)
                    :
                    0,

                endPoint:
                    after
                    ?
                    Number(after.point)
                    :
                    0,

                change:
                    after && before
                    ?
                    Number(after.point)
                    -
                    Number(before.point)
                    :
                    0,

                rankChange:
                    before && after
                    ?
                    (
                        Number(before.rank)
                        -
                        Number(after.rank)
                        > 0
                        ?
                        "▲"
                        +
                        (
                            Number(before.rank)
                            -
                            Number(after.rank)
                        )
                        :
                        Number(before.rank)
                        -
                        Number(after.rank)
                        < 0
                        ?
                        "▼"
                        +
                        Math.abs(
                            Number(before.rank)
                            -
                            Number(after.rank)
                        )
                        :
                        "-"
                    )
                    :
                    "",

                rankClass:
                    before && after
                    ?
                    (
                        Number(before.rank)
                        >
                        Number(after.rank)
                        ?
                        "change-up"
                        :
                        Number(before.rank)
                        <
                        Number(after.rank)
                        ?
                        "change-down"
                        :
                        "change-same"
                    )
                    :
                    "",

                changeClass:
                    after && before
                    ?
                    (
                        Number(after.point)
                        >
                        Number(before.point)
                        ?
                        "point-up"
                        :
                        Number(after.point)
                        <
                        Number(before.point)
                        ?
                        "point-down"
                        :
                        "point-same"
                    )
                    :
                    "point-same",

                wins:
                    wins,

                losses:
                    losses,
                
                draws:
                    draws
            };
        });

    showTeamRanking();
}

function showTeamRanking(){

    const tbody =
        document.getElementById(
            "teamRanking"
        );

    tbody.innerHTML =
        "";

    let data =
        [...teamRankingData];

    data.sort(
        sortFunction
    );

    data.forEach(team=>{

        const tr =
            document.createElement(
                "tr"
            );

        let changeText =
            team.change >= 0
            ?
            "+" + team.change.toFixed(1)
            :
            team.change.toFixed(1);

        tr.innerHTML = `

            <td>
                ${team.startRank}
            </td>

            <td>
                ${team.endRank}

                ${
                    team.startRank !== "-"
                    ?
                    `
                    <br>
                    <span class="${team.rankClass}">
                        ${
                            team.rankChange
                        }
                    </span>
                    `
                    :
                    ""
                }

            </td>

            <td>
                <a href="country.html?team=${encodeURIComponent(aliasMap[team.country] || team.country)}">
                    ${
                        nameMap[
                            aliasMap[team.country] || team.country
                        ]
                        ||
                        aliasMap[team.country]
                        ||
                        team.country
                    }
                </a>
            </td>

            <td>
                ${team.startPoint.toFixed(1)}
            </td>

            <td>
                ${team.endPoint.toFixed(1)}
            </td>

            <td class="${team.changeClass}">
                ${
                    team.change > 0
                    ?
                    "▲"
                    +
                    team.change.toFixed(1)
                    :
                    team.change < 0
                    ?
                    "▼"
                    +
                    Math.abs(team.change).toFixed(1)
                    :
                    "-"
                }
            </td>

            <td>
                ${team.wins}勝
                ${team.losses}敗
                ${team.draws}分
            </td>
        `;

        tbody.appendChild(
            tr
        );

    });

}

function sortTeams(key){

    if(
        currentSort.key === key
    ){
        currentSort.asc =
            !currentSort.asc;
    }
    else{
        currentSort.key =
            key;

        // 勝敗・ポイントなどは多い順
        if(
            key === "wins" ||
            key === "endPoint" ||
            key === "change"
        ){
            currentSort.asc =
                false;
        }
        else{
            currentSort.asc =
                true;
        }
    }
    showTeamRanking();
}

function sortFunction(a,b){

    const key =
        currentSort.key;

    let result;

    if(
        typeof a[key] === "number"
    ){
        result =
            a[key]
            -
            b[key];
    }
    else{
        result =
            String(a[key])
            .localeCompare(
                String(b[key])
            );

    }

    return currentSort.asc
        ?
        result
        :
        -result;

}

async function createRankChart(){

    const teams =
        getTournamentTeams();

    const labels =
        [
            ...new Set(
                tournamentMatches
                .map(
                    d=>d.date
                )
            )
        ]
        .sort();

    let datasets =
        [];

    teams.forEach(team=>{

        let values =
            [];

        labels.forEach(date=>{

            const rank =
                getRankingAtDate(
                    team,
                    date
                );

            values.push(
                rank
                ?
                Number(rank.rank)
                :
                null
            );
        });

        datasets.push({

            label:
                nameMap[
                    aliasMap[team] || team
                ]
                ||
                aliasMap[team]
                ||
                team,
            data:
                values,
            tension:
                0.3
        });
    });

    const ctx =
        document
        .getElementById(
            "rankChart"
        );

    if(rankChart){
        rankChart.destroy();
    }

    rankChart =
        new Chart(
            ctx,
            {
                type:
                    "line",

                data:
                {
                    labels:
                        labels,
                    datasets:
                        datasets
                },

                options:
                {
                    scales:
                    {
                        y:
                        {
                            reverse:
                                true,

                            title:
                            {
                                display:
                                    true,
                                text:
                                    "順位"
                            }

                        }

                    }

                }

            });

}

const oldLoadTournamentPage =
    loadTournamentPage;

loadTournamentPage =
    async function(){

        await oldLoadTournamentPage();

};

const oldShowTournament =
    showTournament;

showTournament =
    function(){

        oldShowTournament();

        setTimeout(
            ()=>{

                createTeamRanking();

                createRankChart();

            },
            100
        );

};