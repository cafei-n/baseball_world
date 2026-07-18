// =============================
// グローバル変数
// =============================

let dailyData = [];
let nameMap = {};
let chart = null;


const params = new URLSearchParams(window.location.search);
let currentTeam = params.get("team");


// =============================
// データ読み込み
// =============================

Promise.all([
    fetch("data/ranking_daily.csv").then(r=>r.text()),
    fetch("data/team_name_ja.csv").then(r=>r.text()),

]).then(([dailyCsv,nameCsv])=>{

    loadNames(nameCsv);

    loadDailyRanking(dailyCsv);

    createTeamSelector();

    showCountry();

    drawHistory();

});

function drawHistory(){

    let type =
        document.getElementById(
            "graphType"
        ).value;

    let data =
        dailyData.filter(
            x=>x.team==currentTeam
        );

    let labels =
        data.map(x=>x.date);

    let values;

    if(type=="rank"){

        values =
            data.map(x=>x.rank);

    }

    else{

        values =
            data.map(x=>x.point);

    }

    if(chart){

        chart.destroy();

    }

    chart = new Chart(

        document.getElementById(
            "historyChart"
        ),

        {

            type:"line",

            data:{

                labels:labels,

                datasets:[{

                    label:
                        type=="rank"
                        ?
                        "順位"
                        :
                        "ポイント",

                    data:values,

                    tension:0.2,

                    borderWidth:2

                }]

            },

            options:{

                responsive:true,

                maintainAspectRatio:true,

                interaction:{
                    mode:"nearest"
                },

                scales:{

                    y:{

                        reverse:
                            type=="rank"

                    }

                }
            }
        }
    );
}

// =====================================
// 日本語名
// =====================================

function loadNames(csv){

    const lines =
        csv.trim().split("\n");

    for(let i=1;i<lines.length;i++){
        const c =
            lines[i].split(",");

        nameMap[c[0].trim()]
            =
        c[1].trim();
    }
}

// =====================================
// daily読み込み
// =====================================

function loadDailyRanking(csv){

    const lines =
        csv.trim().split("\n");

    for(let i=1;i<lines.length;i++){

        const c =
            lines[i].split(",");

        dailyData.push({
            date:c[0],
            rank:Number(c[1]),
            team:c[2],
            point:Number(c[3])
        });
    }
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


function getLatestDate(){

    return dailyData
        .map(x=>x.date)
        .sort()
        .pop();
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

function toggleMenu(){

    const menu =
        document.getElementById("menu");

    if(menu.style.display=="block"){
        menu.style.display="none";
    }

    else{
        menu.style.display="block";
    }
}

function changeCountry(){

    currentTeam =
        document.getElementById(
        "teamSelector"
        ).value;

    showCountry();

    drawHistory();

}