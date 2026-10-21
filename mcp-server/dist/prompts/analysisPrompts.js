import { z } from 'zod';
export function registerAnalysisPrompts(server) {
    // Prompt: daily_festival_briefing
    server.prompt('daily_festival_briefing', 'Generate a comprehensive briefing summarizing current team standings, completed programmes, and today’s key events.', {}, () => {
        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: 'Please use the `get_festival_overview` and `get_live_standings` tools to provide a comprehensive daily briefing of the Wattaqa Arts Fest. Highlight the leader, the margin of points between teams, and any notable recent victories.',
                    },
                },
            ],
        };
    });
    // Prompt: team_performance_audit
    server.prompt('team_performance_audit', 'Detailed audit and analysis of a specific team performance, strengths in arts vs sports, and medal count.', {
        teamCode: z.string().describe('The team code to analyze (e.g. "SMD", "AQS", "INF")'),
    }, ({ teamCode }) => {
        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Analyze the performance of team "${teamCode}". Check their candidate list, registered programmes, and prize results. Break down their score by Arts Stage, Non-Stage, and Sports, and suggest which upcoming events offer the best point opportunities.`,
                    },
                },
            ],
        };
    });
}
