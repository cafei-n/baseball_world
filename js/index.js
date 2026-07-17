// =====================================
// グローバル変数
// =====================================

let dailyData = [];
let nameMap = {};
let currentDate = "";

// =====================================
// データ読み込み
// =====================================

Promise.all([

    fetch("data/ranking.csv").then(r=>r.text()),

    fetch("data/ranking_daily.csv").then(r=>r.text()),

    fetch("data/team_name_ja.csv").then(r=>r.text())

])
.then(([rankingCsv,dailyCsv,nameCsv])=>{

    loadNames(nameCsv);

    loadDailyRanking(dailyCsv);

    showLastUpdate();

    showLatestRanking(rankingCsv);

});


// 日本語読み込み

function loadNames(nameCsv){

    const lines=nameCsv.trim().split("\n");

    for(let i=1;i<lines.length;i++){
        const cols=lines[i].split(",");
        nameMap[cols[0].trim()]=cols[1].trim();
    }
}

// daily読み込み
function loadDailyRanking(dailyCsv){

    const lines=dailyCsv.trim().split("\n");

    for(let i=1;i<lines.length;i++){
        const cols=lines[i].split(",");
        dailyData.push({
            date:cols[0],
            rank:Number(cols[1]),
            team:cols[2],
            point:cols[3]
        });
    }
}

function showLastUpdate(){

    if(dailyData.length==0){
        return;
    }

    const latest =
        dailyData
        .map(x=>x.date)
        .sort()
        .pop();

    document.getElementById(
        "lastUpdate"
    ).textContent =
        "最終更新：" + latest.substring(0,10);

}

// =====================================
// 指定日以前の最新ランキング取得
// =====================================

function getRanking(date){

    let result = dailyData.filter(x => x.date <= date);

    if(result.length == 0){
        return [];
    }

    let latest = result
        .map(x => x.date)
        .sort()
        .pop();

    return result
        .filter(x => x.date == latest)
        .sort((a,b)=>a.rank-b.rank);

}

// 最新ランキング読み込み
function showLatestRanking(){

    let latest = dailyData
        .map(x=>x.date)
        .sort()
        .pop();

    currentDate = latest;

    displayRanking(
        getRanking(latest)
    );

}

//日付指定ランキング読み込み
function showDateRanking(){

    let date =
        document.getElementById(
            "dateSelect"
        ).value;

    currentDate = date;

    displayRanking(
        getRanking(date)
    );

}

// =====================================
// 比較日取得
// =====================================

function getCompareDate(date){

    let d = new Date(date);

    let period =
        document.getElementById(
            "comparePeriod"
        ).value;

    if(period=="month"){
        d.setMonth(
            d.getMonth()-1
        );
    }

    else if(period=="year"){
        d.setFullYear(
            d.getFullYear()-1
        );
    }

    else{
        d.setFullYear(
            d.getFullYear()-4
        );
    }

    return d
        .toISOString()
        .substring(0,10);
}

// =====================================
// ランキング表示
// =====================================

function displayRanking(data){

    const tbody =
        document.getElementById("ranking");

    tbody.innerHTML = "";

    // 比較ランキング作成
    let compareRanking = {};

    if(currentDate!=""){

        let compareDate =
            getCompareDate(currentDate);

        let oldRanking =
            getRanking(compareDate);

        oldRanking.forEach(row=>{

            compareRanking[row.team]={
                rank: row.rank,
                point: Number(row.point)
            };
        });
    }

    // 表作成
    data
    .sort((a,b)=>a.rank-b.rank)
    .forEach(row=>{

        let rankChange="";
        let rankClass="";

        let pointChange="";
        let pointClass="";

        if(compareRanking[row.team] === undefined){

            rankChange="NEW";
            rankClass="change-new";

            pointChange="NEW";
            pointClass="point-same";
        }
        else{
            // 順位変化
            let rankDiff =
                compareRanking[row.team].rank
                -
                row.rank;

            if(rankDiff > 0){
                rankChange="▲"+rankDiff;
                rankClass="change-up";
            }
            else if(rankDiff < 0){
                rankChange="▼"+(-rankDiff);
                rankClass="change-down";
            }
            else{
                rankChange="-";
                rankClass="change-same";
            }

            // ポイント変化
            let pointDiff =
                Number(row.point)
                -
                compareRanking[row.team].point;

            pointDiff =
                Math.round(pointDiff*100)/100;

            if(pointDiff > 0){
                pointChange="▲"+pointDiff;
                pointClass="point-up";
            }
            else if(pointDiff < 0){
                pointChange="▼"+Math.abs(pointDiff);
                pointClass="point-down";
            }
            else{
                pointChange="-";
                pointClass="point-same";
            }
        }

        const tr =
            document.createElement("tr");

        tr.innerHTML = `
            <td class="rank">
                ${row.rank}
            </td>
            <td>
                ${nameMap[row.team] ?? row.team}
            </td>
            <td>
                ${row.point}
            </td>
            <td class="${pointClass}">
                ${pointChange}
            </td>
            <td class="${rankClass}">
                ${rankChange}
            </td>
        `;

        tbody.appendChild(tr);
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