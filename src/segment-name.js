export function segmentName({age, income, score}) {
  // These labels summarize sample centroids using fixed, descriptive bands.
  if (income >= 75) {
    if (score >= 60) return 'High-income high scorers';
    if (score < 35) {
      return age < 35 ? 'Younger high-income low scorers' : 'High-income low scorers';
    }
    return 'High-income moderate scorers';
  }
  if (income < 35) {
    if (score >= 60) return 'Lower-income high scorers';
    if (score < 35) return 'Lower-income low scorers';
    return 'Lower-income moderate scorers';
  }
  if (score >= 60) return age < 35 ? 'Young high scorers' : 'Mid-income high scorers';
  if (score < 35) return 'Mid-income low scorers';
  if (age < 35) return 'Young moderate scorers';
  if (age >= 60) return 'Older moderate scorers';
  return 'Midlife moderate scorers';
}
