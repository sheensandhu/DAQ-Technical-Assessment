import { cn } from "@/lib/utils";

interface TemperatureProps {
  temp: number;
}

/**
 * Get temperature color class based on value ranges
 * Safe (20-80): Green
 * Nearing unsafe (20-25 or 75-80): Yellow
 * Unsafe (<20 or >80): Red
 */
const getTemperatureColorClass = (temp: number): string => {
  if (temp < 20 || temp > 80) return "text-destructive";
  if ((temp >= 20 && temp < 25) || (temp > 75 && temp <= 80)) return "text-yellow-500";
  return "text-emerald-500";
};

/**
 * Numeric component that displays the temperature value.
 * 
 * @param {number} props.temp - The temperature value to be displayed.
 * @returns {JSX.Element} The rendered Numeric component.
 */
function Numeric({ temp }: TemperatureProps) {
  const colorClass = getTemperatureColorClass(temp);
  
  return (
    <div className={cn(
      "text-4xl font-bold transition-colors duration-200",
      colorClass
    )}>
      {`${temp.toFixed(3)}°C`}
    </div>
  );
}

export default Numeric;
