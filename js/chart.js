function drawRankingChart(

    canvasId,
    dailyData,
    nameMap,
    teams,
    start,
    end,
    type,
    oldChart

){

    let datasets=[];

    teams.forEach(team=>{

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


    if(oldChart){
        oldChart.destroy();
    }

    return new Chart(
        document.getElementById(canvasId),
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
                        reverse:type=="rank",
                        title:{
                            display:true,
                            text:
                                type=="rank"
                                ?"順位"
                                :"ポイント"
                        }
                    }
                }
            }
        }
    );
}