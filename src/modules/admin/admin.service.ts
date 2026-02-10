import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";

type DailyStat = { date: string; total: number };

@Injectable()
export class AdminService {
  constructor(private readonly database: DatabaseService) {}

  async getDashboardSummary() {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startDate = new Date(startOfToday);
    startDate.setDate(startDate.getDate() - 6);

    const toDateKey = (date: Date) => {
      const y = date.getFullYear();
      const m = `${date.getMonth() + 1}`.padStart(2, "0");
      const d = `${date.getDate()}`.padStart(2, "0");
      return `${y}-${m}-${d}`;
    };

    const [sackRows, boxRows, totalUsers, totalVehicles] = await Promise.all([
      this.database.$queryRaw<DailyStat[]>`
        SELECT DATE(counting_date) AS date,
               COALESCE(SUM(total_count), 0)::int AS total
        FROM counting_sessions
        WHERE session_type = 'sack'
          AND counting_date >= ${startDate}
          AND counting_date <= ${endOfToday}
        GROUP BY DATE(counting_date)
        ORDER BY DATE(counting_date) ASC
      `,
      this.database.$queryRaw<DailyStat[]>`
        SELECT DATE(counting_date) AS date,
               COALESCE(SUM(total_count), 0)::int AS total
        FROM counting_sessions
        WHERE session_type = 'box'
          AND counting_date >= ${startDate}
          AND counting_date <= ${endOfToday}
        GROUP BY DATE(counting_date)
        ORDER BY DATE(counting_date) ASC
      `,
      this.database.user.count(),
      this.database.vehicle.count(),
    ]);

    const normalizeSeries = (rows: DailyStat[]) =>
      rows.map((row) => ({
        date:
          row.date instanceof Date ? toDateKey(row.date) : String(row.date),
        total: Number(row.total) || 0,
      }));

    const initDaily = (): Record<string, number> => {
      const map: Record<string, number> = {};
      const cursor = new Date(startDate);
      for (let i = 0; i < 7; i += 1) {
        map[toDateKey(cursor)] = 0;
        cursor.setDate(cursor.getDate() + 1);
      }
      return map;
    };

    const sackDaily = initDaily();
    const boxDaily = initDaily();

    for (const row of normalizeSeries(sackRows)) {
      if (row.date in sackDaily) sackDaily[row.date] = row.total;
    }
    for (const row of normalizeSeries(boxRows)) {
      if (row.date in boxDaily) boxDaily[row.date] = row.total;
    }

    const todayKey = toDateKey(startOfToday);
    const sackToday = sackDaily[todayKey] || 0;
    const boxToday = boxDaily[todayKey] || 0;

    const toSeries = (map: Record<string, number>): DailyStat[] =>
      Object.keys(map)
        .sort()
        .map((date) => ({ date, total: map[date] }));

    return {
      sacks: {
        today: sackToday,
        last7Days: toSeries(sackDaily),
      },
      boxes: {
        today: boxToday,
        last7Days: toSeries(boxDaily),
      },
      totalUsers,
      totalVehicles,
      range: {
        startDate: toDateKey(startDate),
        endDate: toDateKey(startOfToday),
      },
    };
  }
}
