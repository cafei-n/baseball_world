// =============================
// グローバル変数
// =============================

let chart = null;
let historyData = [];

const params = new URLSearchParams(window.location.search);
let currentTeam = params.get("team");


// =============================
// データ読み込み
// =============================

Promise.all([
    fetch("data/ranking_daily.csv").then(r=>r.text()),
    fetch("data/team_name_ja.csv").then(r=>r.text()),
    fetch("data/ranking_history.csv").then(r=>r.text()),
    fetch("data/ranking_config.csv").then(r=>r.text())

]).then(([dailyCsv,nameCsv,historyCsv,configCsv])=>{

    loadNames(nameCsv);

    loadTournamentNames(configCsv);

    loadDailyRanking(dailyCsv);

    loadHistory(historyCsv);

    setupDate();

    createTeamSelector();

    showCountry();
    
    drawHistory();

    showRecentGames();

    showTournamentStats();

    showAgeStats();

});

function drawHistory(){

    let start =
        document.getElementById("startDate").value;

    let end =
        document.getElementById("endDate").value;

    let type =
        document.getElementById("graphType").value;

    let data =
        dailyData
        .filter(x=>
            x.team==currentTeam &&
            x.date.substring(0,10)>=start &&
            x.date.substring(0,10)<=end
        )
        .map(x=>({
            x:new Date(x.date),
            y:type=="rank"
                ? x.rank
                : x.point
        }));

    chart = drawRankingChart(

        "chart",

        dailyData,

        nameMap,

        [currentTeam],

        start,

        end,

        type,

        chart

    );

}

function setupDate(){

    let latest =
        getLatestDate();

    document.getElementById("endDate").value =
        latest.substring(0,10);

    let d =
        new Date(latest);

    d.setFullYear(d.getFullYear()-1);

    document.getElementById("startDate").value =
        d.toISOString().substring(0,10);

}

function showCountry(){

    if(!currentTeam){
        let latest = getLatestDate();
        currentTeam =
            dailyData
                .filter(x=>x.date==latest)
                .sort((a,b)=>a.rank-b.rank)[0]
                .team;
    }

    if(!currentTeam){
        document.getElementById("countryName").textContent="国が指定されていません";
        return;
    }

    const history = dailyData.filter(x=>x.team==currentTeam);

    if(history.length==0){
        document.getElementById("countryName").textContent="データがありません";
        return;
    }

    history.sort((a,b)=>a.date.localeCompare(b.date));

    const latest = history[history.length-1];

    document.getElementById("countryName").textContent =
        nameMap[currentTeam] ?? currentTeam;

    document.getElementById("updateDate").textContent =
        "更新日 : " + latest.date;

    document.getElementById("currentRank").textContent =
        latest.rank;

    document.getElementById("bestRank").textContent =
        Math.min(...history.map(x=>x.rank));

    document.getElementById("worstRank").textContent =
        Math.max(...history.map(x=>x.rank));

    document.getElementById("currentPoint").textContent =
        latest.point.toFixed(2);

    document.getElementById("bestPoint").textContent =
        Math.max(...history.map(x=>x.point)).toFixed(2);

    document.getElementById("worstPoint").textContent =
        Math.min(...history.map(x=>x.point)).toFixed(2);

}

function createTeamSelector(){

    const select =
        document.getElementById(
            "teamSelector"
        );

    // 全チーム取得
    let teams =
        [...new Set(
            dailyData.map(x=>x.team)
        )];

    // 名前順ではなく最新ランキング順
    let latest =
        getLatestDate();

    let latestRanking =
        dailyData
        .filter(x=>x.date==latest)
        .sort(
            (a,b)=>a.rank-b.rank
        );

    let order =
        latestRanking.map(x=>x.team);

    teams.sort((a,b)=>{
        return order.indexOf(a)
             -
             order.indexOf(b);
    });

    teams.forEach(team=>{

        let option =
            document.createElement(
                "option"
            );

        option.value=team;

        option.textContent =
            nameMap[team] ?? team;

        // 初期選択
        if(currentTeam){
            option.selected =
                team==currentTeam;
        }
        else if(order.indexOf(team)==0){
            option.selected=true;
        }

        select.appendChild(option);
    });
}

function changeCountry(){

    currentTeam =
        document.getElementById(
        "teamSelector"
        ).value;

    showCountry();

    drawHistory();

    showRecentGames();

    showTournamentStats();

    showAgeStats();

}

function showRecentGames(){

    const tbody =
        document.getElementById("recentGames");

    tbody.innerHTML = "";

    let games =
        historyData
        .filter(x=>x.team==currentTeam)
        .sort((a,b)=>
            new Date(b.date)-new Date(a.date)
        )
        .slice(0,10);

    games.forEach(game=>{

        const tr =
            document.createElement("tr");

        const age =
            getAgeCategory(game.tournament);

        const ageText =
            age=="制限なし"
            ? ""
            : age;

        let resultClass="";

        if(game.result=="W"){
            resultClass="color:green;font-weight:bold;";
        }
        else if(game.result=="L"){
            resultClass="color:red;font-weight:bold;";
        }
        else{
            resultClass="color:gray;font-weight:bold;";
        }

        let pointClass="";

        if(game.change>0){
            pointClass="point-up";
        }
        else if(game.change<0){
            pointClass="point-down";
        }
        else{
            pointClass="point-same";
        }

        let pointText =
            (game.change>=0?"+":"")
            +game.change.toFixed(2);

        tr.innerHTML=`

            <td>${game.date.substring(0,10)}</td>

            <td style="${resultClass}">
                ${game.result}
            </td>

            <td>
                ${game.my_score}-${game.opponent_score}
            </td>

            <td>
                ${nameMap[game.opponent] ?? game.opponent}
            </td>

            <td>
                <div>
                    ${game.after.toFixed(2)}
                </div>
                <div class="${pointClass}">
                    ${(game.change>=0?"+":"") + game.change.toFixed(2)}
                </div>
            </td>

            <td>
                <div>${ageText}</div>
                <div>${getTournamentName(game.tournament)}</div>
            </td>

        `;

        tbody.appendChild(tr);

    });

}

function loadHistory(csv){

    const lines = csv.trim().split("\n");

    for(let i=1;i<lines.length;i++){

        const c = parseCSVLine(lines[i]);

        historyData.push({

            date:c[0],
            game_id:c[1],
            team:c[2],

            before_rank:Number(c[3]),
            before:Number(c[4]),
            after:Number(c[5]),
            change:Number(c[6]),

            opponent:c[7],
            opponent_before:Number(c[8]),

            result:c[9],

            my_score:Number(c[10]),
            opponent_score:Number(c[11]),

            tournament:c[12]
        });

    }

}

function getTournamentCategory(name){

    if(name.includes("World Baseball Classic Qualifiers")){
        return "WBC予選";
    }

    if(name.includes("World Baseball Classic")){
        return "ワールド・ベースボール・クラシック";
    }

    if(name.includes("Premier12")){
        return "プレミア12";
    }

    if(
        name.includes("Olympic") ||
        name.includes("Olympics")
    ){
        return "オリンピック";
    }

    if(
        name.includes("World Cup")
    ){
        return "ワールドカップ";
    }
    if(
        name.includes("European Championship") ||
        name.includes("European Baseball Championship")
    ){
        return "欧州野球選手権";
    }
    if(
        name.includes("Asian Baseball Championship") ||
        name.includes("Asian Championship")
    ){
        return "アジア野球選手権";
    }
    if(
        name.includes("Pan American Championship")
    ){
        return "パンアメリカン野球選手権";
    }

    return "その他";
}

function showTournamentStats(){

    const tbody =
        document.getElementById(
            "tournamentStats"
        );

    tbody.innerHTML = "";

    const stats = {};

    historyData
        .filter(x=>x.team==currentTeam)
        .forEach(game=>{

            const category =
                getTournamentCategory(
                    game.tournament
                );

            if(!stats[category]){

                stats[category]={

                    games:0,
                    win:0,
                    lose:0,
                    draw:0,
                    point:0

                };

            }

            stats[category].games++;

            if(game.result=="W"){
                stats[category].win++;
            }
            else if(game.result=="L"){
                stats[category].lose++;
            }
            else{
                stats[category].draw++;
            }

            stats[category].point += game.change;

        });

    const order=[
        "WBC予選",
        "ワールド・ベースボール・クラシック",
        "オリンピック",
        "プレミア12",
        "ワールドカップ",
        "欧州野球選手権",
        "アジア野球選手権",
        "パンアメリカン野球選手権",
        "その他"
    ];

    order.forEach(name=>{

        if(!stats[name]){
            return;
        }

        const s = stats[name];

        const winRate =
            s.games==0
            ?0
            :(s.win+s.draw*0.5)/s.games;

        const tr =
            document.createElement("tr");

        let pointClass="";

        if(s.point>0){
            pointClass="point-up";
        }
        else if(s.point<0){
            pointClass="point-down";
        }
        else{
            pointClass="point-same";
        }

        tr.innerHTML=`

            <td>${name}</td>

            <td>${s.games}</td>

            <td>${s.win}</td>

            <td>${s.lose}</td>

            <td>${s.draw}</td>

            <td>${(winRate*100).toFixed(1)}%</td>

            <td class="${pointClass}">
                ${(s.point>=0?"+":"")}${s.point.toFixed(2)}
            </td>

        `;

        tbody.appendChild(tr);

    });

}

function showAgeStats(){

    const tbody =
        document.getElementById(
            "ageStats"
        );

    tbody.innerHTML="";

    const stats={};

    historyData
        .filter(x=>x.team==currentTeam)
        .forEach(game=>{

            const category=
                getAgeCategory(
                    game.tournament
                );

            if(!stats[category]){

                stats[category]={

                    games:0,
                    win:0,
                    lose:0,
                    draw:0,
                    point:0

                };

            }

            stats[category].games++;

            if(game.result=="W"){
                stats[category].win++;
            }
            else if(game.result=="L"){
                stats[category].lose++;
            }
            else{
                stats[category].draw++;
            }

            stats[category].point+=game.change;

        });

    const order=[
        "制限なし",
        "U-23",
        "U-18",
        "U-15",
        "U-12",
        "U-10",
        "ユース"
    ];

    order.forEach(name=>{

        if(!stats[name]){
            return;
        }

        const s=stats[name];

        const winRate=
            s.games==0
            ?0
            :(s.win+s.draw*0.5)/s.games;

        let pointClass="";

        if(s.point>0){
            pointClass="point-up";
        }
        else if(s.point<0){
            pointClass="point-down";
        }
        else{
            pointClass="point-same";
        }

        const tr=document.createElement("tr");

        tr.innerHTML=`

            <td>${name}</td>

            <td>${s.games}</td>

            <td>${s.win}</td>

            <td>${s.lose}</td>

            <td>${s.draw}</td>

            <td>${(winRate*100).toFixed(1)}%</td>

            <td class="${pointClass}">
                ${(s.point>=0?"+":"")}${s.point.toFixed(2)}
            </td>

        `;

        tbody.appendChild(tr);

    });

}