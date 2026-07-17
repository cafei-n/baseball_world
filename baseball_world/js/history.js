// =====================================
// グローバル
// =====================================

let dailyData = [];

let nameMap = {};

let chart;



// =====================================
// 読み込み
// =====================================

Promise.all([

    fetch("data/ranking_daily.csv")
        .then(r=>r.text()),

    fetch("data/team_name_ja.csv")
        .then(r=>r.text())
])

.then(([dailyCsv,nameCsv])=>{

    loadNames(nameCsv);

    loadDailyRanking(dailyCsv);

    showLastUpdate();

    setupDate();

    createTeamSelector();

    showHistory();

});

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
// 初期日付設定
// 最新日～1年前
// =====================================

function setupDate(){

    let latest =
        getLatestDate();

    let end =
        latest.substring(0,10);

    let d =
        new Date(end);

    d.setMonth(
        d.getMonth()-1
    );

    let start =
        d.toISOString()
        .substring(0,10);

    document.getElementById(
        "startDate"
    ).value=start;

    document.getElementById(
        "endDate"
    ).value=end;
}

// =====================================
// 最新日
// =====================================

function getLatestDate(){

    return dailyData
        .map(x=>x.date)
        .sort()
        .pop();
}

// =====================================
// 最新TOP20取得
// =====================================

function getTop(){

    let latest =
        getLatestDate();

    return dailyData
        .filter(x=>
            x.date==latest
        )
        .sort(
            (a,b)=>a.rank-b.rank
        )
        .slice(0,10);
}

// =====================================
// チーム選択作成
// =====================================

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

        // TOP10を初期選択
        if(
            order.indexOf(team)<10
        ){
            option.selected=true;
        }

        select.appendChild(option);
    });
}

// =====================================
// グラフ表示
// =====================================

function showHistory(){

    let start =
        document.getElementById(
            "startDate"
        ).value;

    let end =
        document.getElementById(
            "endDate"
        ).value;

    let type =
        document.getElementById(
            "graphType"
        ).value;

    let selected =
        Array.from(
            document
            .getElementById(
                "teamSelector"
            )
            .selectedOptions
        )
        .map(
            option=>option.value
        );

    let datasets=[];

    selected.forEach(team=>{

        let data =
            dailyData
            .filter(x=>
                x.team==team &&
                x.date.substring(0,10)>=start &&
                x.date.substring(0,10)<=end
            )
            .map(x=>({
                x:new Date(x.date),
                y:
                type=="rank"
                ?
                x.rank
                :
                x.point
            }));

        datasets.push({
            label:
            nameMap[team] ?? team,
            data:data,
            borderWidth:2,
            fill:false
        });
    });

    if(chart){
        chart.destroy();
    }

    chart =
    new Chart(
        document
        .getElementById("chart"),
        {
            type:"line",

            data:{
                datasets:datasets
            },

            options:{
                responsive:true,
                maintainAspectRatio:false,
                interaction:{
                    mode:"nearest",
                    intersect:false
                },

                scales:{
                    x:{
                        type:"time",
                        time:{
                            unit:"month"
                        }
                    },

                    y:{
                        reverse:
                        type=="rank",
                        title:{
                            display:true,
                            text:
                            type=="rank"
                            ?
                            "順位"
                            :
                            "ポイント"
                        }
                    }
                }
            }
        }
    );
}

// =====================================
// 動画切替
// =====================================

function updateMovie(){

    let type =
        document.getElementById(
            "movieType"
        ).value;

    let period =
        document.getElementById(
            "moviePeriod"
        ).value;

    let filename = "";

    if(type=="ranking"){

        if(period=="month"){
            filename =
                "movie/ranking_month.mp4";
        }

        else if(period=="year"){
            filename =
                "movie/ranking_year.mp4";
        }

        else{
            filename =
                "movie/ranking_4year.mp4";
        }
    }

    else{
        if(period=="month"){
            filename =
                "movie/point_month.mp4";
        }

        else if(period=="year"){
            filename =
                "movie/point_year.mp4";
        }
        else{
            filename =
                "movie/point_4year.mp4";
        }
    }

    const video =
        document.getElementById(
            "rankingMovie"
        );

    video.src = filename;

    video.load();

    video.play();
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
