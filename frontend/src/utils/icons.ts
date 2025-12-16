// Valid Material Symbols icons for the fintech app
// If an icon is not in this list, show a fallback

export const VALID_ICONS = [
  // General & Money
  'category', 'paid', 'attach_money', 'savings', 'account_balance', 'credit_card', 'payments', 'trending_up', 'receipt_long', 'currency_exchange', 'wallet',
  // Food & Drink
  'restaurant', 'local_cafe', 'fastfood', 'lunch_dining', 'local_bar', 'liquor', 'kitchen', 'bakery_dining', 'icecream',
  // Shopping
  'shopping_cart', 'shopping_bag', 'store', 'sell', 'percent', 'card_giftcard', 'checkroom', 'diamond',
  // Transport
  'directions_car', 'flight', 'train', 'directions_bus', 'local_taxi', 'local_gas_station', 'ev_station', 'local_parking', 'two_wheeler', 'directions_boat',
  // Home & Utilities
  'home', 'apartment', 'cottage', 'water_drop', 'lightbulb', 'bolt', 'wifi', 'phone_iphone', 'propane', 'mop', 'bed', 'chair', 'router',
  // Entertainment & Leisure
  'movie', 'theaters', 'sports_esports', 'music_note', 'headphones', 'casino', 'stadium', 'sports_soccer', 'pool', 'travel_explore',
  // Health & Wellness
  'medical_services', 'fitness_center', 'spa', 'medication', 'local_pharmacy', 'dentistry', 'psychology', 'monitor_heart',
  // Education & Work
  'school', 'menu_book', 'science', 'backpack', 'work', 'engineering', 'business_center', 'laptop_mac', 'print',
  // Family, Pets & Services
  'pets', 'family_restroom', 'child_care', 'cake', 'celebration', 'content_cut', 'local_laundry_service', 'build', 'construction', 'local_shipping', 'gavel',
  // Common additional icons
  'star', 'favorite', 'check_circle', 'error', 'warning', 'info', 'help', 'settings', 'person', 'group',
  'email', 'phone', 'location_on', 'schedule', 'event', 'calendar_today', 'notifications', 'search', 'add', 'remove',
  'edit', 'delete', 'share', 'download', 'upload', 'refresh', 'sync', 'cloud', 'folder', 'description',
  // Finance specific
  'trending_down', 'show_chart', 'bar_chart', 'pie_chart', 'analytics', 'assessment', 'price_check', 'request_quote',
  'handshake', 'volunteer_activism', 'redeem'
] as const;

export type ValidIcon = typeof VALID_ICONS[number];

// Default fallback icon when an invalid one is found
export const FALLBACK_ICON = 'category';

/**
 * Get a valid icon name. Returns the icon if valid, or fallback if not.
 * @param icon - The icon name to validate
 * @param fallback - Optional custom fallback icon (defaults to 'category')
 */
export function getValidIcon(icon: string | undefined | null, fallback: string = FALLBACK_ICON): string {
  if (!icon) return fallback;
  // Check if icon exists in our valid list
  if ((VALID_ICONS as readonly string[]).includes(icon)) {
    return icon;
  }
  return fallback;
}

/**
 * Check if an icon is valid
 */
export function isValidIcon(icon: string): boolean {
  return (VALID_ICONS as readonly string[]).includes(icon);
}
