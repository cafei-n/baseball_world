// =====================================
// グローバル
// =====================================

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

    showHistoricalRecords();

});

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

    d.setFullYear(
        d.getFullYear()-1
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

    select.innerHTML = "";

    const region =
        document.getElementById("regionFilter").value;

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

    let filteredTeams = teams;

    if(region){
        filteredTeams = teams.filter(team=>{
            const tags =
                regionMap[team] ?? "";
            return tags.includes(region);
        });
    }

    filteredTeams.forEach(team=>{

        let option =
            document.createElement(
                "option"
            );

        option.value=team;

        option.textContent =
            nameMap[team] ?? team;

        // TOP10を初期選択
        if(region){
            option.selected = true;
        }else{
            if(order.indexOf(team) < 10){
                option.selected = true;
            }
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

    chart = drawRankingChart(

        "chart",

        dailyData,

        nameMap,

        selected,

        start,

        end,

        type,

        chart

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

function changeRegion(){

    const select =
        document.getElementById("teamSelector");

    // 一度空にする
    select.innerHTML = "";

    // 国一覧を作り直す
    createTeamSelector();

    // グラフ更新
    showHistory();

}


 // =====================================
 // 世界ランキング歴代記録
 // =====================================

function showHistoricalRecords(){

    if(dailyData.length === 0){
        return;
    }

    // 日付ごとのランキングを作成
    const rankingByDate = {};

    dailyData.forEach(row=>{

        const date = row.date.substring(0,10);

        if(!rankingByDate[date]){
            rankingByDate[date] = [];
        }

        rankingByDate[date].push(row);

    });

    const dates = Object.keys(rankingByDate).sort();

    if(dates.length === 0){
        return;
    }

    // 順位順に整理
    dates.forEach(date=>{

        rankingByDate[date].sort(
            (a,b)=>a.rank-b.rank
        );

    });

    // =====================================
    // ① 世界1位の通算在任期間
    // =====================================

    const leadershipPeriods = [];
    let currentLeader = null;
    let periodStart = null;

    function closeLeadershipPeriod(endDate){

        if(!currentLeader || !periodStart || !endDate){
            return;
        }

        const start = new Date(periodStart + "T00:00:00Z");
        const end = new Date(endDate + "T00:00:00Z");

        const days = Math.round(
            (end - start) / 86400000
        ) + 1;

        if(days > 0){

            leadershipPeriods.push({
                team: currentLeader,
                start: periodStart,
                end: endDate,
                days: days
            });

        }

    }

    function addDays(date, days){

        const d = new Date(date + "T00:00:00Z");

        d.setUTCDate(d.getUTCDate() + days);

        return d.toISOString().substring(0,10);
    }

    dates.forEach((date, index)=>{

        const numberOne =
            rankingByDate[date].find(row=>row.rank === 1);

        const leader = numberOne ? numberOne.team : null;

        if(leader !== currentLeader){

            if(currentLeader){

                // 新しい1位が始まる前日までを前の在任期間とする
                const endDate = addDays(date, -1);

                closeLeadershipPeriod(endDate);

            }

            currentLeader = leader;
            periodStart = leader ? date : null;

        }

        // 最終日の処理
        if(index === dates.length - 1 && currentLeader){

            closeLeadershipPeriod(date);

        }

    });

    // 国ごとに通算日数を合計
    const totalLeadership = {};

    leadershipPeriods.forEach(period=>{

        if(!totalLeadership[period.team]){

            totalLeadership[period.team] = {
                team: period.team,
                days: 0,
                periods: []
            };

        }

        totalLeadership[period.team].days += period.days;
        totalLeadership[period.team].periods.push(period);

    });

    const leadershipRanking =
        Object.values(totalLeadership)
        .sort((a,b)=>b.days-a.days);

    const worldNumberOneElement =
        document.getElementById("recordWorldNumberOne");

    if(leadershipRanking.length > 0){

        const record = leadershipRanking[0];

        const periodHtml = record.periods
            .map(period=>
                `<div>${period.start} ～ ${period.end}（${period.days.toLocaleString()}日）</div>`
            )
            .join("");

        worldNumberOneElement.innerHTML = `
            <div class="record-country">
                ${nameMap[record.team] ?? record.team}
            </div>
            <div class="record-value">
                通算 ${record.days.toLocaleString()} 日
            </div>
            <div class="record-detail">
                世界1位だった期間（すべて）
                <div class="record-period">
                    ${periodHtml}
                </div>
            </div>
        `;

    }else{

        worldNumberOneElement.textContent =
            "世界1位の記録がありません。";

    }

    // =====================================
    // ② 歴代最高ポイント
    // 全期間のランキングデータから最高値を取得
    // =====================================

    const validPointRows = dailyData.filter(row =>
        Number.isFinite(Number(row.point))
    );

    const highestPointElement =
        document.getElementById("recordHighestPoint");

    if(validPointRows.length > 0){

        const highestPoint = validPointRows.reduce(
            (max, row) => Math.max(max, Number(row.point)),
            -Infinity
        );

        // 最高ポイントを記録した国・日付を取得
        const highestPointRows = validPointRows.filter(row =>
            Number(row.point) === highestPoint
        );

        // 同じ国が複数日に記録している場合は、最初と最後の日付をまとめる
        const highestPointByTeam = {};

        highestPointRows.forEach(row=>{

            const date = row.date.substring(0,10);

            if(!highestPointByTeam[row.team]){
                highestPointByTeam[row.team] = {
                    team: row.team,
                    dates: []
                };
            }

            if(!highestPointByTeam[row.team].dates.includes(date)){
                highestPointByTeam[row.team].dates.push(date);
            }

        });

        highestPointElement.innerHTML =
            Object.values(highestPointByTeam)
            .map(record=>{

                record.dates.sort();

                const periodText =
                    record.dates.length === 1
                    ? record.dates[0]
                    : `${record.dates[0]} ～ ${record.dates[record.dates.length - 1]}`;

                return `
                    <div class="record-country">
                        ${nameMap[record.team] ?? record.team}
                    </div>
                    <div class="record-value">
                        ${highestPoint.toLocaleString("ja-JP", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })} ポイント
                    </div>
                    <div class="record-detail">
                        記録時期：${periodText}
                    </div>
                `;

            })
            .join("");

    }else{

        highestPointElement.textContent =
            "ポイント記録がありません。";

    }

    // =====================================
    // ③～⑥ 年間順位・ポイント記録
    // 各年の最終ランキングを前年と比較
    // =====================================

    const yearEndRanking = {};

    dates.forEach(date=>{

        const year = date.substring(0,4);

        // 同じ年に複数の日付があれば最後の日付で上書き
        yearEndRanking[year] = {
            date: date,
            rows: rankingByDate[date]
        };

    });

    const years = Object.keys(yearEndRanking)
        .map(Number)
        .sort((a,b)=>a-b);

    let bestRankRise = null;
    let bestPointRise = null;
    let bestRankFall = null;
    let bestPointFall = null;

    years.forEach(year=>{

        const previousYear = String(year - 1);
        const currentYear = String(year);

        // 前年のランキングがなければ比較できない
        if(!yearEndRanking[previousYear] ||
           !yearEndRanking[currentYear]){
            return;
        }

        const previousSnapshot =
            yearEndRanking[previousYear];

        const currentSnapshot =
            yearEndRanking[currentYear];

        const previousMap = {};

        previousSnapshot.rows.forEach(row=>{

            previousMap[row.team] = row;

        });

        currentSnapshot.rows.forEach(current=>{

            const previous = previousMap[current.team];

            // 両年に存在する国だけを比較
            if(!previous){
                return;
            }

            // 順位上昇：前年順位 - 今年順位
            const rankRise = previous.rank - current.rank;

            // 順位下降：今年順位 - 前年順位
            const rankFall = current.rank - previous.rank;

            // ポイント増減
            const pointChange =
                Math.round(
                    (Number(current.point) -
                     Number(previous.point)) * 100
                ) / 100;

            const recordBase = {
                team: current.team,
                previousYear: previousYear,
                currentYear: currentYear,
                previousDate: previousSnapshot.date,
                currentDate: currentSnapshot.date,
                previousRank: previous.rank,
                currentRank: current.rank,
                previousPoint: Number(previous.point),
                currentPoint: Number(current.point)
            };

            if(rankRise > 0 &&
               (!bestRankRise || rankRise > bestRankRise.value)){

                bestRankRise = {
                    ...recordBase,
                    value: rankRise
                };

            }

            if(pointChange > 0 &&
               (!bestPointRise || pointChange > bestPointRise.value)){

                bestPointRise = {
                    ...recordBase,
                    value: pointChange
                };

            }

            if(rankFall > 0 &&
               (!bestRankFall || rankFall > bestRankFall.value)){

                bestRankFall = {
                    ...recordBase,
                    value: rankFall
                };

            }

            if(pointChange < 0){

                const fall = Math.abs(pointChange);

                if(!bestPointFall || fall > bestPointFall.value){

                    bestPointFall = {
                        ...recordBase,
                        value: fall
                    };

                }

            }

        });

    });

    // =====================================
    // 記録カード表示
    // =====================================

    function displayAnnualRecord(elementId, record, type){

        const element = document.getElementById(elementId);

        if(!record){

            element.innerHTML = `
                <div class="record-detail">
                    該当する記録がありません。
                </div>
            `;

            return;
        }

        let valueText = "";
        let detailText = "";

        if(type === "rankRise"){

            valueText = `${record.value} 順位上昇`;

            detailText =
                `${record.previousRank}位 → ${record.currentRank}位`;

        }else if(type === "rankFall"){

            valueText = `${record.value} 順位下降`;

            detailText =
                `${record.previousRank}位 → ${record.currentRank}位`;

        }else if(type === "pointRise"){

            valueText = `+${record.value.toFixed(2)} ポイント`;

            detailText =
                `${record.previousPoint.toFixed(2)} → ${record.currentPoint.toFixed(2)} ポイント`;

        }else{

            valueText = `-${record.value.toFixed(2)} ポイント`;

            detailText =
                `${record.previousPoint.toFixed(2)} → ${record.currentPoint.toFixed(2)} ポイント`;

        }

        element.innerHTML = `
            <div class="record-country">
                ${nameMap[record.team] ?? record.team}
            </div>
            <div class="record-value">
                ${valueText}
            </div>
            <div class="record-detail">
                対象期間：${record.previousYear}年末 ～ ${record.currentYear}年末
                <br>
                比較日：${record.previousDate} → ${record.currentDate}
                <br>
                ${detailText}
            </div>
        `;

    }

    displayAnnualRecord(
        "recordRankRise",
        bestRankRise,
        "rankRise"
    );

    displayAnnualRecord(
        "recordPointRise",
        bestPointRise,
        "pointRise"
    );

    displayAnnualRecord(
        "recordRankFall",
        bestRankFall,
        "rankFall"
    );

    displayAnnualRecord(
        "recordPointFall",
        bestPointFall,
        "pointFall"
    );

}