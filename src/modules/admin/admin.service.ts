import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";

type DailyStat = { date: Date | string; total: number };
type MonthlyStat = { month: Date | string; total: number };

@Injectable()
export class AdminService {
  constructor(private readonly database: DatabaseService) {}

  async getDashboardSummary() {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const startMonth = new Date(
      startOfCurrentMonth.getFullYear(),
      startOfCurrentMonth.getMonth() - 11,
      1,
    );

    const toMonthKey = (date: Date) => {
      const y = date.getFullYear();
      const m = `${date.getMonth() + 1}`.padStart(2, "0");
      return `${y}-${m}`;
    };

    const [sackRows, boxRows, totalUsers, totalVehicles] = await Promise.all([
      this.database.$queryRaw<MonthlyStat[]>`
        SELECT DATE_TRUNC('month', counting_date) AS month,
               COALESCE(SUM(total_count), 0)::int AS total
        FROM counting_sessions
        WHERE session_type = 'sack'
          AND counting_date >= ${startMonth}
          AND counting_date <= ${endOfCurrentMonth}
        GROUP BY DATE_TRUNC('month', counting_date)
        ORDER BY DATE_TRUNC('month', counting_date) ASC
      `,
      this.database.$queryRaw<MonthlyStat[]>`
        SELECT DATE_TRUNC('month', counting_date) AS month,
               COALESCE(SUM(total_count), 0)::int AS total
        FROM counting_sessions
        WHERE session_type = 'box'
          AND counting_date >= ${startMonth}
          AND counting_date <= ${endOfCurrentMonth}
        GROUP BY DATE_TRUNC('month', counting_date)
        ORDER BY DATE_TRUNC('month', counting_date) ASC
      `,
      this.database.user.count(),
      this.database.vehicle.count(),
    ]);

    const normalizeSeries = (rows: MonthlyStat[]) =>
      rows.map((row) => ({
        month: toMonthKey(
          row.month instanceof Date ? row.month : new Date(String(row.month)),
        ),
        total: Number(row.total) || 0,
      }));

    const initMonthly = (): Record<string, number> => {
      const map: Record<string, number> = {};
      const cursor = new Date(startMonth);
      for (let i = 0; i < 12; i += 1) {
        map[toMonthKey(cursor)] = 0;
        cursor.setMonth(cursor.getMonth() + 1);
      }
      return map;
    };

    const sackMonthly = initMonthly();
    const boxMonthly = initMonthly();

    for (const row of normalizeSeries(sackRows)) {
      if (row.month in sackMonthly) sackMonthly[row.month] = row.total;
    }
    for (const row of normalizeSeries(boxRows)) {
      if (row.month in boxMonthly) boxMonthly[row.month] = row.total;
    }

    const currentMonthKey = toMonthKey(startOfCurrentMonth);
    const sackCurrentMonth = sackMonthly[currentMonthKey] || 0;
    const boxCurrentMonth = boxMonthly[currentMonthKey] || 0;

    const toSeries = (map: Record<string, number>) =>
      Object.keys(map)
        .sort()
        .map((month) => ({ month, total: map[month] }));

    return {
      sacks: {
        thisMonth: sackCurrentMonth,
        last12Months: toSeries(sackMonthly),
      },
      boxes: {
        thisMonth: boxCurrentMonth,
        last12Months: toSeries(boxMonthly),
      },
      totalUsers,
      totalVehicles,
      range: {
        startMonth: toMonthKey(startMonth),
        endMonth: toMonthKey(startOfCurrentMonth),
      },
    };
  }
}
