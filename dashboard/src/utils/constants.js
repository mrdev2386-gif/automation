// Constants for the WhatsApp Automation Dashboard

export const INTENT_TYPES = {
    MENU_REQUEST: 'menu_request',
    TABLE_BOOKING: 'table_booking',
    TIMING_QUERY: 'timing_query',
    LOCATION_QUERY: 'location_query',
    GREETING: 'greeting',
    FALLBACK: 'fallback',
};

export const BOOKING_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
};

export const MESSAGE_DIRECTION = {
    INCOMING: 'incoming',
    OUTGOING: 'outgoing',
};

export const DATE_FORMATS = {
    DISPLAY: 'MMM DD, YYYY',
    API: 'YYYY-MM-DD',
};

export const TIME_FORMATS = {
    DISPLAY: 'h:mm A',
    API: 'HH:mm',
};
