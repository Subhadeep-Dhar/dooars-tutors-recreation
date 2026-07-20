export class StrictIntentGuard {
  /**
   * Conservatively determines if a query contains explicit strict intent
   * (e.g., budget, radius, board, gender) that would make a silent
   * semantic fallback unsafe.
   */
  public static hasStrictIntent(query: string): boolean {
    if (typeof query !== 'string') return false;
    const q = query.toLowerCase();

    // 1. Budget constraints
    if (/(?:₹|rs\.?|rupees?|under|less than|max)\s*\d+/i.test(q)) return true;
    if (/\b(?:budget)\b/i.test(q)) return true;

    // 2. Geo & Spatial constraints (radius, near me, nearest, textual place)
    if (/\d+\s*(?:km|kilometers?|miles?)\b/i.test(q)) return true;
    if (/\b(?:near|nearest|within|around)\b/i.test(q)) return true;

    // 3. Gender
    if (/\b(?:male|female|man|woman|lady|boy|girl)\b/i.test(q)) return true;

    // 4. Classes/Grades
    if (/\b(?:class|grade|kg|nursery)\s*\d*\b/i.test(q)) return true;

    // 5. Boards
    if (/\b(?:cbse|icse|isc|state board|wbbse|wbchse)\b/i.test(q)) return true;

    // 6. Service Modes
    if (/\b(?:online|offline|home tutor|at home|home tuition|student home|tutor home|center)\b/i.test(q)) return true;

    // 7. Provider Kind
    if (/\b(?:individual|organisation|institute|coaching)\b/i.test(q)) return true;

    // 8. Canonical Subjects and Activities
    // Based on TaxonomyNormalizer and common subjects to prevent category leakage.
    const subjectAliases = [
      'math', 'maths', 'mathematics', 'science', 'english', 'bengali', 'bangla',
      'physics', 'chemistry', 'biology', 'computer', 'cs', 'history', 'geography',
      'economics', 'commerce', 'accountancy', 'yoga', 'dance', 'music', 'guitar',
      'art', 'drawing'
    ];

    for (const subject of subjectAliases) {
      const regex = new RegExp(`\\b${subject}\\b`, 'i');
      if (regex.test(q)) return true;
    }

    return false;
  }
}
