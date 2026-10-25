const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids in Relay are UUIDs; checking first turns typos into clear errors, not database ones. */
export const isUuid = (value: string) => UUID.test(value);
