// Utility Types
export type ModerationActionType = 'BAN' | 'UNBAN' | 'MUTE' | 'UNMUTE';


export interface PunishmentDuration {
    duration: number;
    startTime: Date;
    endTime: Date | null;
}

/**
 * 
 * @param durationString 
 * @returns null for infinite
 */
export function parseDuration(durationString?: string): PunishmentDuration | null {
    if (!durationString)
        return {
            duration: 0,
            startTime: new Date(),
            endTime: null,
        };

    durationString = durationString.trim();

    // Match numbers followed by units (mo must come first to avoid matching m first)
    const pattern = /(\d+)(mo|y|w|d|h|m|s)/g;
    const units: Record<string, number> = {
        mo: 30 * 86400,    // months (30 days)
        y: 365 * 86400,    // years
        w: 7 * 86400,      // weeks
        d: 86400,          // days
        h: 3600,           // hours
        m: 60,             // minutes
        s: 1               // seconds
    };

    // Go through entire input
    let duration = 0;
    let matchedLength = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(durationString))) {
        const [full, valueStr, unit] = match;

        if (!(unit in units)) {
            break;
        }

        const value = parseInt(valueStr, 10);
        duration += value * units[unit];
        matchedLength += full.length;
    }

    if (duration === 0) {
        return {
            duration: 0,
            startTime: new Date(),
            endTime: null,
        };
    }

    return {
        duration: duration,
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + duration * 1000),
    };
}

// Duration formatter utility
export function formatDuration(seconds: number): string {
    if (seconds >= 86400) {
        const days = Math.floor(seconds / 86400);
        return `${days} day${days !== 1 ? 's' : ''}`;
    } else if (seconds >= 3600) {
        const hours = Math.floor(seconds / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
        return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
}