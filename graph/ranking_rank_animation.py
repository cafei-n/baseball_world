import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.animation import FuncAnimation, FFMpegWriter
import os
import numpy as np
import matplotlib.pyplot as plt
import japanize_matplotlib
import datetime

# =========================
# 設定
# =========================

HISTORY_FILE = "../data/ranking_history.csv"
RANKING_FILE = "../data/initial_ranking.csv"
TEAM_NAME_FILE = "../data/team_name_ja.csv"
CONFIG_FILE = "../data/ranking_config.csv"

# 画面に表示する国名数
LABEL_TOP = 20
# 線を計算・描画する国数
HISTORY_TOP = LABEL_TOP +5
# 縦軸の表示範囲
VIEW_TOP = LABEL_TOP

#大会名表示マージン
TOURNAMENT_MARGIN_DAYS = 5

# =========================
# 動画設定
# =========================

END_DATE = "2026-07-15"


VIDEO_CONFIG = [
    {
        "name":"1month",
        "days":30,
        "output":"../movie/ranking_month.mp4"
    },
    {
        "name":"1year",
        "days":365,
        "output":"../movie/ranking_year.mp4"
    },

    {
        "name":"4year",
        "days":365*4,
        "output":"../movie/ranking_4year.mp4"
    }
]

# 現在の日時を取得
start = datetime.datetime.now()
# フォーマットして出力
print(start.strftime('%Y年%m月%d日 %H:%M:%S')) # 例: 2023年10月05日 14:30:45

# =========================
# 初期ランキング読み込み
# =========================

initial = pd.read_csv(
    RANKING_FILE,
    encoding="utf-8-sig"
)

print("初期ランキング")
print(initial.head())

ratings = dict(
    zip(
        initial["team"],
        initial["point"]
    )
)

# =========================
# 国名日本語変換
# =========================

team_name_df = pd.read_csv(
    TEAM_NAME_FILE,
    encoding="utf-8-sig"
)

team_name_ja = dict(
    zip(
        team_name_df["team"],
        team_name_df["japanese"]
    )
)

# =========================
# 大会名日本語変換
# =========================

config_df = pd.read_csv(
    CONFIG_FILE,
    encoding="utf-8-sig"
)

tournament_config = config_df[
    config_df["type"] == "importance"
]

def get_tournament_name(tournament):

    for _, row in tournament_config.iterrows():

        keywords = str(row["keyword"]).split("|")

        for keyword in keywords:

            if keyword in tournament:

                return row["japanese"]

    return tournament

age_config = config_df[
    config_df["type"] == "age"
]

def get_age_name(tournament):

    for _, row in age_config.iterrows():

        if row["keyword"] in tournament:

            return row["japanese"]

    return ""

# =========================
# 履歴読み込み
# =========================

df = pd.read_csv(
    HISTORY_FILE,
    encoding="utf-8-sig"
)

df_all = df.copy()

df_all = pd.read_csv(
    HISTORY_FILE,
    encoding="utf-8-sig"
)

df["tournament_jp"] = df["tournament"].apply(
    get_tournament_name
)

df["age_jp"] = df["tournament"].apply(
    get_age_name
)

df_all["tournament_jp"] = df_all["tournament"].apply(
    get_tournament_name
)

df_all["age_jp"] = df_all["tournament"].apply(
    get_age_name
)

df_all["date"] = pd.to_datetime(
    df_all["date"],
    format="mixed"
)

df_all["date"] = df_all["date"].dt.normalize()

df["date"] = pd.to_datetime(
    df["date"],
    format="mixed"
)

df["date"] = df["date"].dt.normalize()

df = df.sort_values(
    "date"
)

# =========================
# 日付から大会名取得
# =========================

def get_current_tournament(current_date):

    games = df[
        df["date"] == current_date
    ]

    if len(games) == 0:
        return ""

    tournament = games.iloc[0]["tournament_jp"]

    age = games.iloc[0]["age_jp"]

    year = current_date.year

    if age == "":
        return f"{year} {tournament}"

    else:
        return f"{year} {tournament} {age}"

# =========================
# 動画出力
# =========================

end_date = pd.to_datetime(
    END_DATE
)

for config in VIDEO_CONFIG:

    print("====================")
    print(
        "作成開始:",
        config["name"]
    )
    print("====================")

    # =========================
    # 描画準備
    # =========================

    fig, ax = plt.subplots(
        figsize=(16,9)
    )

    # =========================
    # 期間設定
    # =========================

    start_date = (
        end_date
        -
        pd.Timedelta(
            days=config["days"]
        )
    )

    # =========================
    # 期間フィルター
    # =========================

    df = df_all[
        (df_all["date"] >= start_date)
        &
        (df_all["date"] <= end_date)
    ].copy()

    dates = sorted(
        df["date"].unique()
    )

    # =========================
    # 全日付フレーム作成
    # =========================

    all_dates = pd.date_range(
        start_date,
        end_date,
        freq="D"
    )

    # =========================
    # ポイント履歴作成
    # =========================

    daily_rankings = {}
    points = ratings.copy()

    # 開始日前まで反映

    before_start = df_all[
        df_all["date"] < start_date
    ]

    for _, row in before_start.iterrows():

        points[row["team"]] = row["after"]

    date_groups = {
        d:g
        for d,g
        in df.groupby("date")
    }

    for d in all_dates:

        if d in date_groups:

            for _, row in date_groups[d].iterrows():

                points[row["team"]] = row["after"]

        ranking = sorted(
            points.items(),
            key=lambda x:x[1],
            reverse=True
        )[:HISTORY_TOP]

        daily_rankings[d] = {
            team:rank
            for rank,(team,point)
            in enumerate(
                ranking,
                start=1
            )
        }

    result=[]

    for d, ranking in daily_rankings.items():

        for team, rank in ranking.items():

            result.append(
                {
                    "date":d,
                    "team":team,
                    "rank":rank
                }
            )

    rank_history = pd.DataFrame(
        result
    )

    # =========================
    # チームごとの履歴(DataFrame)
    # =========================

    team_history = {}

    for team, group in rank_history.groupby("team"):

        team_history[team] = group.sort_values(
            "date"
        )

    # =========================
    # チーム固定カラー
    # =========================

    all_teams = sorted(
        team_history.keys()
    )

    cmap = plt.get_cmap(
        "tab20"
    )

    team_colors = {}

    for i, team in enumerate(all_teams):

        team_colors[team] = cmap(
            i % 20
        )

    # =========================
    # 順位補間フレーム作成
    # =========================

    smooth_frames = 20

    animation_frames = []

    previous = None

    for current_date in all_dates:

        current = daily_rankings[
            current_date
        ]

        # 初日
        if previous is None:

            animation_frames.append(
                (
                    current_date,
                    current
                )
            )

            previous = current

            continue

        changed = (
            previous != current
        )

        if changed:
            teams = (
                set(previous)
                |
                set(current)
            )

            for t in np.linspace(
                0,
                1,
                smooth_frames
            ):

                frame = {}

                for team in teams:

                    old = previous.get(
                        team,
                        HISTORY_TOP + 3
                    )

                    new = current.get(
                        team,
                        HISTORY_TOP + 3
                    )

                    frame[team] = (
                        old
                        +
                        (new-old)*t
                    )

                interp_date = (
                    current_date
                    -
                    pd.Timedelta(
                        days=1
                    )
                    +
                    pd.Timedelta(
                        days=t
                    )
                )

                animation_frames.append(
                    (
                        interp_date,
                        frame
                    )
                )

        else:
            animation_frames.append(
                (
                    current_date,
                    previous.copy()
                )
            )
        
        previous = current
    
    def update(frame):

        ax.clear()

        current_date, ranks = (
            animation_frames[frame]
        )

        tournament_text = get_current_tournament(
            current_date
        )

    # =========================
    # 大会名表示
    # =========================

        tournament_now = df[
            (df["date"] >= current_date)
            &
            (df["date"] <= current_date + pd.Timedelta(days=5))
        ]

        tournaments = []

        for _, row in tournament_now.drop_duplicates(
            subset=["tournament_jp", "age_jp"]
        ).iterrows():

            name = row["tournament_jp"]

            if row["age_jp"] != "":
                name += " " + row["age_jp"]

            tournaments.append(
                name
            )

        if len(tournaments) > 0:

            tournament_text = "\n".join(
                sorted(set(tournaments))
            )

        else:
            tournament_text = ""

        # 現在フレーム時点のTOP
        top_labels = [
            team
            for team, rank in sorted(
                ranks.items(),
                key=lambda x:x[1]
            )[:LABEL_TOP]
        ]

        for team in team_history.keys():

            dates_plot = []
            ranks_plot = []

            for d, frame_ranks in animation_frames[:frame+1]:

                if team in frame_ranks:

                    dates_plot.append(d)
                    ranks_plot.append(
                        frame_ranks[team]
                    )

            if len(dates_plot) < 1:
                continue

            ax.plot(
                dates_plot,
                ranks_plot,
                color=team_colors[team],
                linewidth=2
            )

            if team in top_labels:

                label_rank = ranks.get(
                    team,
                    HISTORY_TOP + 3
                )

                ax.text(
                    current_date,
                    label_rank,
                    team_name_ja.get(
                        team,
                        team
                    ),
                    va="center",
                    color="white",
                    fontsize=9,
                    bbox=dict(
                        facecolor=team_colors[team],
                        edgecolor="black",
                        boxstyle="round,pad=0.3"
                    )
                )

        ax.set_ylim(
            LABEL_TOP +1,
            0
        )

        ax.set_yticks(
            range(
                1,
                LABEL_TOP +1
            )
        )

    # 横軸の日数設定
        window_days = 6

        ax.set_xlim(
            current_date - pd.Timedelta(days=window_days),
            current_date + pd.Timedelta(days=1)
        )

        ax.set_ylabel(
            "World Ranking"
        )

        ax.set_xlabel(
            "Date"
        )

        ax.grid()

        title = current_date.strftime(
            "%Y-%m-%d"
        )

        if tournament_text != "":
            title += "  " + tournament_text

        title = current_date.strftime(
            "%Y-%m-%d"
        )

        if tournament_text:
            title += "\n" + tournament_text

        ax.set_title(title)

    # =========================
    # アニメーション作成
    # =========================

    ani = FuncAnimation(
        fig,
        update,
        frames=len(animation_frames),
        interval=1000
    )

    ani.save(
        config["output"],
        writer=FFMpegWriter(
            fps=20
        )
    )

    print(
        "完成:",
        config["output"]
    )
