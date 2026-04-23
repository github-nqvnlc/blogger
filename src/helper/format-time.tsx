export const formatDate = (date: string, unit?: "day" | "week" | "month" | "year") => {
  const [year, month, day] = date.split("-");
  if (!unit) return `${day}/${month}/${year.slice(-2)}`;
  if (!year || !month) return date;
  if (unit === "month") return `${month}/${year.slice(-2)}`;
  if (unit === "day" && day) return `${day}/${month}`;

  return `${month}/${year.slice(-2)}`;
};
