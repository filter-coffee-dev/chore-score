import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES, getUserId } from '../shared/db';
import { notFound, ok, serverError, Completion } from '../shared/types';
import { pickTaunt } from '../shared/taunts';

function calculateStreak(completions: Completion[], householdMembers: string[]): number {
  if (completions.length === 0) return 0;

  const dayKey = (iso: string) => iso.slice(0, 10);
  const allDays = [...new Set(completions.map((c) => dayKey(c.completedAt)))].sort().reverse();

  let streak = 0;
  const today = dayKey(new Date().toISOString());
  let current = today;

  for (const day of allDays) {
    if (day !== current) break;
    const dayCompletions = completions.filter((c) => dayKey(c.completedAt) === day);
    const usersWhoCompletedToday = new Set(dayCompletions.map((c) => c.userId));
    const bothContributed = householdMembers.every((m) => usersWhoCompletedToday.has(m));
    if (!bothContributed) break;
    streak++;
    const prev = new Date(current);
    prev.setDate(prev.getDate() - 1);
    current = dayKey(prev.toISOString());
  }

  return streak;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = getUserId(event);

    const userResult = await docClient.send(new GetCommand({
      TableName: TABLES.USERS,
      Key: { userId },
    }));
    const householdId = userResult.Item?.householdId;
    if (!householdId) return notFound('No household found');

    const householdResult = await docClient.send(new GetCommand({
      TableName: TABLES.HOUSEHOLDS,
      Key: { householdId },
    }));
    const household = householdResult.Item;
    if (!household) return notFound('Household not found');

    const completionsResult = await docClient.send(new QueryCommand({
      TableName: TABLES.COMPLETIONS,
      KeyConditionExpression: 'householdId = :hid',
      ExpressionAttributeValues: { ':hid': householdId },
    }));
    const completions = (completionsResult.Items ?? []) as Completion[];

    // Tally scores
    const scoreMap: Record<string, { name: string; points: number; count: number }> = {};
    for (const c of completions) {
      if (!scoreMap[c.userId]) {
        scoreMap[c.userId] = { name: c.userName, points: 0, count: 0 };
      }
      scoreMap[c.userId].points += c.pointsEarned;
      scoreMap[c.userId].count++;
    }

    // Ensure both members appear
    const members = [
      { id: household.member1Id as string, name: household.member1Name as string },
      ...(household.member2Id ? [{ id: household.member2Id as string, name: household.member2Name as string }] : []),
    ];

    // Fetch each member's avatar from Users table
    const memberUserResults = await Promise.all(
      members.map((m) => docClient.send(new GetCommand({ TableName: TABLES.USERS, Key: { userId: m.id } })))
    );

    const scores = members.map((m, i) => ({
      userId: m.id,
      userName: m.name,
      totalPoints: scoreMap[m.id]?.points ?? 0,
      totalCompletions: scoreMap[m.id]?.count ?? 0,
      avatar: (memberUserResults[i].Item?.avatar ?? 'guy') as 'guy' | 'girl',
    }));

    const memberIds = members.map((m) => m.id);
    const streak = calculateStreak(completions, memberIds);

    const myScore = scores.find((s) => s.userId === userId)?.totalPoints ?? 0;
    const partnerScore = scores.find((s) => s.userId !== userId)?.totalPoints ?? 0;
    const taunt = pickTaunt(myScore, partnerScore);

    return ok({ scores, streak, taunt });
  } catch (err) {
    console.error(err);
    return serverError('Failed to get scores');
  }
};
