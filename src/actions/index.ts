import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

const LABEL: Record<string, string> = {
    // interests
    'release-notes': 'Release Notes',
    'marketing-materials': 'Marketing Materials',
    'technical-documentation': 'Technical Documentation',
    'video-walkthroughs': 'Video Walkthroughs',
    'internal-comms': 'Internal Comms',
    'sops': 'SOPs',
    'onboarding': 'Onboarding',
    // frustrations
    'notification-overload': 'Notification overload',
    'decisions-buried': 'Decisions buried in threads',
    'cant-find-context': "Can't find old context",
    'threads-dont-match': "Threads don't match how work flows",
    'no-action-tracking': 'No action or commitment tracking',
    // intent
    'yes': 'Yes, definitely',
    'probably': 'Probably',
    'not-sure': 'Not sure',
    'probably-not': 'Probably not',
    'no': 'No',
};

const label = (v?: string) => (v && LABEL[v]) || v || '—';

async function postToDiscord(payload: object) {
    const url = import.meta.env.DISCORD_NOTIFICATION_URL;
    if (!url) return;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

export const server = {
    submitWaitlist: defineAction({
        input: z.object({
            email: z.string().email(),
            interests: z.string().optional(),
            intent: z.string().optional(),
        }),
        handler: async ({ email, interests, intent }) => {
            await postToDiscord({
                embeds: [{
                    title: '🎉 New Waitlist Signup',
                    color: 0xc8ff00,
                    fields: [
                        { name: 'Email', value: email, inline: false },
                        { name: 'Interested in', value: label(interests), inline: true },
                        { name: 'Would pay?', value: label(intent), inline: true },
                    ],
                    timestamp: new Date().toISOString(),
                }],
            });
            return { ok: true };
        },
    }),

    submitChatWaitlist: defineAction({
        input: z.object({
            email: z.string().email(),
            frustration: z.string().optional(),
            frustration_other: z.string().optional(),
            intent: z.string().optional(),
        }),
        handler: async ({ email, frustration, frustration_other, intent }) => {
            const frustrationLabel =
                frustration === 'other'
                    ? frustration_other || 'Other'
                    : label(frustration);

            await postToDiscord({
                embeds: [{
                    title: '💬 New Chat Waitlist Signup',
                    color: 0xc8ff00,
                    fields: [
                        { name: 'Email', value: email, inline: false },
                        { name: 'Biggest frustration', value: frustrationLabel, inline: false },
                        { name: 'Would pay?', value: label(intent), inline: true },
                    ],
                    timestamp: new Date().toISOString(),
                }],
            });
            return { ok: true };
        },
    }),
};
