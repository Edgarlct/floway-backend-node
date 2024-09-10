import { DateTime } from 'luxon';
export class DateTools {
  static SQL_FORMAT = 'yyyy-MM-dd HH:mm:ss';

  static getNow(sqlFormat:boolean = false): string|DateTime {
    const now = DateTime.now().setZone("Europe/Paris");
    return sqlFormat ? now.toFormat(DateTools.SQL_FORMAT) : now;
  }
}
