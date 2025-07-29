import SQLHandler from "../handler/dbs/SQLHandler";

export async function fetchFriendIds(user_id: string): Promise<string[]> {
  const sql_instance = SQLHandler.getInstance();
  const blocked_friend_notificaiton = await sql_instance.query(`
                SELECT user_id
                FROM friend_notification_settings
                WHERE friend_id = ? AND is_notification_block IS TRUE
            `, [user_id]);

  const blocked_friend_ids = blocked_friend_notificaiton.map(row => row.user_id);

  const friends = await sql_instance.query(`
                SELECT receiver_id, applicant_id 
                FROM friend 
                WHERE is_waiting IS NOT TRUE
                AND (applicant_id = ? OR receiver_id = ?)
            `, [user_id, user_id]);


  if (!friends || friends.length === 0) {
    return [];
  }

  const user_ids = friends.reduce((acc, friend) => {
    if (friend.applicant_id !== user_id && !blocked_friend_ids.includes(friend.applicant_id)) {
      acc.push(friend.applicant_id);
    }
    if (friend.receiver_id !== user_id && !blocked_friend_ids.includes(friend.receiver_id)) {
      acc.push(friend.receiver_id);
    }
    return acc;
  }, []);

  return Array.from(new Set(user_ids)); // Remove duplicates
}
