export interface IEvent {
    type: "audio" | "internal" | "text";
    friend_id?: string | null; // Optional, can be null if not applicable
    timestamp: number; // Unix timestamp
    audio_name?: string; // Optional, only for audio events
    text_content?: string; // Optional, only for text events
}
