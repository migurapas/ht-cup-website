import tournamentData from "./data/data.json"
import teamsData from "./data/teams.json"

type Team = {
    id: number
    name: string
    player1: string
    player2: string
}

type MatchTeam = {
    id: number
    goals: number
    points: number
}

type Match = {
    team1: MatchTeam
    team2: MatchTeam
    status: string
}

type StandingsRow = {
    id: number
    name: string
    played: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    goalDiff: number
    points: number
}

type KoSide = {
    ref: string
    goals: number
}

type KoMatch = {
    slot: string
    matchup: string
    team1: KoSide
    team2: KoSide
    winner: string | null
    status: string
}

type KoFinal = {
    matchup: string
    team1: KoSide
    team2: KoSide
    winner: string | null
    status: string
}

function Tournament() {
    const teamsById: Record<number, Team> = Object.fromEntries(
        teamsData.teams.map(t => [t.id, t])
    )

    const allTeams = teamsData.teams.map(team => (
        <li className="team-card" key={team.id}>
            <h2 className="team-name">{team.name}</h2>
            <p className="team-player">{team.player1}</p>
            <p className="team-player">{team.player2}</p>
        </li>
    ))

    const matchesAll: Match[] = Object.values(tournamentData.group_stage).flat() as Match[]

    const standingsMap = new Map<number, StandingsRow>()

    for (const t of teamsData.teams) {
        standingsMap.set(t.id, {
            id: t.id,
            name: t.name,
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            goalDiff: 0,
            points: 0
        })
    }

    for (const m of matchesAll) {
        if (m.status !== "played") continue

        const aId = m.team1.id
        const bId = m.team2.id

        const aGoals = Number(m.team1.goals ?? 0)
        const bGoals = Number(m.team2.goals ?? 0)

        const a = standingsMap.get(aId)
        const b = standingsMap.get(bId)
        if (!a || !b) continue

        a.played += 1
        b.played += 1

        a.goalsFor += aGoals
        a.goalsAgainst += bGoals

        b.goalsFor += bGoals
        b.goalsAgainst += aGoals

        if (aGoals > bGoals) {
            a.wins += 1
            b.losses += 1
            a.points += 3
        } else if (aGoals < bGoals) {
            b.wins += 1
            a.losses += 1
            b.points += 3
        } else {
            a.draws += 1
            b.draws += 1
            a.points += 1
            b.points += 1
        }
    }

    const standings = Array.from(standingsMap.values())
        .map(r => ({ ...r, goalDiff: r.goalsFor - r.goalsAgainst }))
        .sort((x, y) => {
            if (y.points !== x.points) return y.points - x.points
            if (y.goalDiff !== x.goalDiff) return y.goalDiff - x.goalDiff
            if (y.goalsFor !== x.goalsFor) return y.goalsFor - x.goalsFor
            return x.name.localeCompare(y.name)
        })

    const top4 = standings.slice(0, 4).map(r => r.id)

    const placeMap: Record<string, number | undefined> = {
        place_1: top4[0],
        place_2: top4[1],
        place_3: top4[2],
        place_4: top4[3]
    }

    const koSemi = tournamentData.knockout_stage.semi_finals as KoMatch[]
    const koFinal = tournamentData.knockout_stage.final as KoFinal

    const resolveRefToTeamId = (ref: string) => {
        const v = placeMap[ref]
        return typeof v === "number" ? v : undefined
    }

    const winnerFromGoals = (aGoals: number, bGoals: number) => {
        if (aGoals > bGoals) return "team1"
        if (aGoals < bGoals) return "team2"
        return null
    }

    const semiWinners: Record<string, number | undefined> = {}

    for (const sf of koSemi) {
        const t1Id = resolveRefToTeamId(sf.team1.ref)
        const t2Id = resolveRefToTeamId(sf.team2.ref)

        const g1 = Number(sf.team1.goals ?? 0)
        const g2 = Number(sf.team2.goals ?? 0)

        if (sf.status === "played" && typeof t1Id === "number" && typeof t2Id === "number") {
            const w = winnerFromGoals(g1, g2)
            if (w === "team1") semiWinners[`winner_${sf.slot.toLowerCase()}`] = t1Id
            if (w === "team2") semiWinners[`winner_${sf.slot.toLowerCase()}`] = t2Id
        }
    }

    const resolveKoTeam = (ref: string) => {
        const id = resolveRefToTeamId(ref)
        if (typeof id === "number") return { id, team: teamsById[id] }
        return { id: undefined as number | undefined, team: undefined as Team | undefined }
    }

    const resolveFinalTeam = (ref: string) => {
        const id = semiWinners[ref]
        if (typeof id === "number") return { id, team: teamsById[id] }
        return { id: undefined as number | undefined, team: undefined as Team | undefined }
    }

    const standingsTable = (
        <section className="table-section">
            <div className="table-wrap">
                <table className="table">
                    <thead>
                    <tr>
                        <th>#</th>
                        <th>Team</th>
                        <th>P</th>
                        <th>W</th>
                        <th>D</th>
                        <th>L</th>
                        <th>GF</th>
                        <th>GA</th>
                        <th>GD</th>
                        <th>Pts</th>
                    </tr>
                    </thead>
                    <tbody>
                    {standings.map((row, i) => (
                        <tr key={row.id}>
                            <td>{i + 1}</td>
                            <td className="table-team">
                                <div className="table-teamname">{row.name}</div>
                                <div className="table-players">
                                    {teamsById[row.id]?.player1} · {teamsById[row.id]?.player2}
                                </div>
                            </td>
                            <td>{row.played}</td>
                            <td>{row.wins}</td>
                            <td>{row.draws}</td>
                            <td>{row.losses}</td>
                            <td>{row.goalsFor}</td>
                            <td>{row.goalsAgainst}</td>
                            <td>{row.goalDiff}</td>
                            <td className="table-points">{row.points}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </section>
    )

    const matchdays = Object.entries(tournamentData.group_stage).map(
        ([matchdayKey, matches]) => (
            <section className="matchday" key={matchdayKey}>
                <h2 className="matchday-title">{matchdayKey.replace("_", " ")}</h2>

                <ul className="matches">
                    {(matches as Match[]).map((m, idx) => {
                        const t1 = teamsById[m.team1.id]
                        const t2 = teamsById[m.team2.id]

                        return (
                            <li className="match-card" key={`${matchdayKey}-${idx}`}>
                                <div className="match-row">
                                    <div className="match-teambox match-teambox-left">
                                        <div className="match-teamname">{t1?.name ?? m.team1.id}</div>
                                        <div className="match-players">
                                            <div>{t1?.player1}</div>
                                            <div>{t1?.player2}</div>
                                        </div>
                                    </div>

                                    <span className="match-score">
                    {m.team1.goals} : {m.team2.goals}
                  </span>

                                    <div className="match-teambox match-teambox-right">
                                        <div className="match-teamname">{t2?.name ?? m.team2.id}</div>
                                        <div className="match-players">
                                            <div>{t2?.player1}</div>
                                            <div>{t2?.player2}</div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </section>
        )
    )

    const koBoxes = (() => {
        const sf1 = koSemi[0]
        const sf2 = koSemi[1]

        const sf1T1 = resolveKoTeam(sf1.team1.ref)
        const sf1T2 = resolveKoTeam(sf1.team2.ref)

        const sf2T1 = resolveKoTeam(sf2.team1.ref)
        const sf2T2 = resolveKoTeam(sf2.team2.ref)

        const fT1 = resolveFinalTeam(koFinal.team1.ref)
        const fT2 = resolveFinalTeam(koFinal.team2.ref)

        const KoBox = (title: string, left: Team | undefined, lg1: number, right: Team | undefined, lg2: number) => (
            <section className="ko-box">
                <h2 className="ko-title">{title}</h2>
                <div className="ko-match">
                    <div className="match-teambox match-teambox-left">
                        <div className="match-teamname">{left?.name ?? "TBD"}</div>
                        <div className="match-players">
                            <div>{left?.player1}</div>
                            <div>{left?.player2}</div>
                        </div>
                    </div>

                    <span className="match-score">{lg1} : {lg2}</span>

                    <div className="match-teambox match-teambox-right">
                        <div className="match-teamname">{right?.name ?? "TBD"}</div>
                        <div className="match-players">
                            <div>{right?.player1}</div>
                            <div>{right?.player2}</div>
                        </div>
                    </div>
                </div>
            </section>
        )

        return (
            <section className="ko-section">
                <div className="ko-stage">
                    {KoBox("Semi Final 1", sf1T1.team, sf1.team1.goals, sf1T2.team, sf1.team2.goals)}
                    {KoBox("Semi Final 2", sf2T1.team, sf2.team1.goals, sf2T2.team, sf2.team2.goals)}
                    {KoBox("Final", fT1.team, koFinal.team1.goals, fT2.team, koFinal.team2.goals)}
                </div>
            </section>
        )
    })()

    return (
        <>
            <section className="teams-section">
                <ul className="teams-grid">{allTeams}</ul>
            </section>

            {standingsTable}

            <div className="matchdays">{matchdays}</div>

            {koBoxes}
        </>
    )
}

export default Tournament
