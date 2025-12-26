"use server";

import { actionResponse, ActionResult } from "@/lib/action-response";
import { isAdmin } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { products as productsSchema, user as userSchema } from "@/lib/db/schema";
import { getErrorMessage } from "@/lib/error-utils";
import { and, count, gte, lt, sql } from "drizzle-orm";

interface IStats {
  today: number;
  yesterday: number;
  growthRate: number;
  total?: number;
}

export interface IOverviewStats {
  users: IStats;
  submissions: IStats;
}

export interface IDailyGrowthStats {
  reportDate: string;
  newUsersCount: number;
  newSubmissionsCount: number;
}

function calculateGrowthRate(today: number, yesterday: number): number {
  if (yesterday === 0) {
    return today > 0 ? Infinity : 0;
  }
  return ((today - yesterday) / yesterday) * 100;
}

export const getOverviewStats = async (): Promise<ActionResult<IOverviewStats>> => {
  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    // User stats
    const totalUsersResult = await db.select({ value: count() }).from(userSchema);
    const totalUsers = totalUsersResult[0].value;

    const todayUsersResult = await db
      .select({ value: count() })
      .from(userSchema)
      .where(gte(userSchema.createdAt, todayStart));
    const todayUsers = todayUsersResult[0].value;

    const yesterdayUsersResult = await db
      .select({ value: count() })
      .from(userSchema)
      .where(and(gte(userSchema.createdAt, yesterdayStart), lt(userSchema.createdAt, todayStart)));
    const yesterdayUsers = yesterdayUsersResult[0].value;

    // Submission stats
    const totalSubmissionsResult = await db.select({ value: count() }).from(productsSchema);
    const totalSubmissions = totalSubmissionsResult[0].value;

    const todaySubmissionsResult = await db
      .select({ value: count() })
      .from(productsSchema)
      .where(gte(productsSchema.submittedAt, todayStart));
    const todaySubmissions = todaySubmissionsResult[0].value;

    const yesterdaySubmissionsResult = await db
      .select({ value: count() })
      .from(productsSchema)
      .where(
        and(
          gte(productsSchema.submittedAt, yesterdayStart),
          lt(productsSchema.submittedAt, todayStart),
        ),
      );
    const yesterdaySubmissions = yesterdaySubmissionsResult[0].value;

    const stats: IOverviewStats = {
      users: {
        today: todayUsers,
        yesterday: yesterdayUsers,
        growthRate: calculateGrowthRate(todayUsers, yesterdayUsers),
        total: totalUsers ?? 0,
      },
      submissions: {
        today: todaySubmissions,
        yesterday: yesterdaySubmissions,
        growthRate: calculateGrowthRate(todaySubmissions, yesterdaySubmissions),
        total: totalSubmissions ?? 0,
      },
    };
    return actionResponse.success(stats);
  } catch (error) {
    return actionResponse.error(getErrorMessage(error));
  }
};

export const getDailyGrowthStats = async (
  period: "7d" | "30d" | "90d",
): Promise<ActionResult<IDailyGrowthStats[]>> => {
  if (!(await isAdmin())) {
    return actionResponse.forbidden("Admin privileges required.");
  }
  try {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "7d":
        startDate = new Date(new Date().setDate(now.getDate() - 7));
        break;
      case "30d":
        startDate = new Date(new Date().setMonth(now.getMonth() - 1));
        break;
      case "90d":
        startDate = new Date(new Date().setMonth(now.getMonth() - 3));
        break;
      default:
        throw new Error("Invalid period specified.");
    }

    const userDateTrunc = sql`date_trunc('day', ${userSchema.createdAt})`;

    const dailyUsers = await db
      .select({
        date: userDateTrunc,
        count: count(userSchema.id),
      })
      .from(userSchema)
      .where(gte(userSchema.createdAt, startDate))
      .groupBy(userDateTrunc);

    const submissionDateTrunc = sql`date_trunc('day', ${productsSchema.submittedAt})`;

    const dailySubmissions = await db
      .select({
        date: submissionDateTrunc,
        count: count(productsSchema.id),
      })
      .from(productsSchema)
      .where(gte(productsSchema.submittedAt, startDate))
      .groupBy(submissionDateTrunc);

    const dailyUsersMap = new Map(
      dailyUsers.map((r) => {
        let dateStr: string;
        if (r.date instanceof Date) {
          dateStr = r.date.toISOString().split("T")[0];
        } else {
          dateStr = new Date(r.date as string).toISOString().split("T")[0];
        }
        return [dateStr, r.count];
      }),
    );
    const dailySubmissionsMap = new Map(
      dailySubmissions.map((r) => {
        let dateStr: string;
        if (r.date instanceof Date) {
          dateStr = r.date.toISOString().split("T")[0];
        } else {
          dateStr = new Date(r.date as string).toISOString().split("T")[0];
        }
        return [dateStr, r.count];
      }),
    );

    const result: IDailyGrowthStats[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split("T")[0];
      result.push({
        reportDate: dateStr,
        newUsersCount: dailyUsersMap.get(dateStr) || 0,
        newSubmissionsCount: dailySubmissionsMap.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return actionResponse.success(result);
  } catch (error) {
    return actionResponse.error(getErrorMessage(error));
  }
};
