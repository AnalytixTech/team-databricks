import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: string;
  label?: string;
  showIcon?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOverdue: boolean;
  totalHours: number;
}

export default function CountdownTimer({ 
  targetDate, 
  label = 'Return Due In',
  showIcon = true 
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        // Overdue
        const overdueDiff = Math.abs(difference);
        const days = Math.floor(overdueDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((overdueDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((overdueDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((overdueDiff % (1000 * 60)) / 1000);

        setTimeRemaining({
          days,
          hours,
          minutes,
          seconds,
          isOverdue: true,
          totalHours: Math.floor(overdueDiff / (1000 * 60 * 60)),
        });
      } else {
        // Time remaining
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeRemaining({
          days,
          hours,
          minutes,
          seconds,
          isOverdue: false,
          totalHours: Math.floor(difference / (1000 * 60 * 60)),
        });
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeRemaining) {
    return null;
  }

  const getColorClasses = () => {
    if (timeRemaining.isOverdue) {
      return 'bg-red-100 text-red-800 border-red-300';
    } else if (timeRemaining.totalHours < 24) {
      return 'bg-orange-100 text-orange-800 border-orange-300';
    } else if (timeRemaining.days < 3) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
    return 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getIcon = () => {
    if (timeRemaining.isOverdue || timeRemaining.totalHours < 24) {
      return <AlertTriangle className="h-5 w-5" />;
    }
    return <Clock className="h-5 w-5" />;
  };

  return (
    <div className={`rounded-lg border p-4 ${getColorClasses()}`}>
      <div className="flex items-center gap-3">
        {showIcon && getIcon()}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {timeRemaining.isOverdue ? 'Overdue By' : label}
          </p>
          <div className="mt-2 flex items-center gap-4">
            {timeRemaining.days > 0 && (
              <div>
                <span className="text-2xl font-bold">{timeRemaining.days}</span>
                <span className="text-sm ml-1">day{timeRemaining.days !== 1 ? 's' : ''}</span>
              </div>
            )}
            <div>
              <span className="text-2xl font-bold">{timeRemaining.hours}</span>
              <span className="text-sm ml-1">hr{timeRemaining.hours !== 1 ? 's' : ''}</span>
            </div>
            <div>
              <span className="text-2xl font-bold">{timeRemaining.minutes}</span>
              <span className="text-sm ml-1">min</span>
            </div>
            {timeRemaining.days === 0 && (
              <div>
                <span className="text-2xl font-bold">{timeRemaining.seconds}</span>
                <span className="text-sm ml-1">sec</span>
              </div>
            )}
          </div>
          {timeRemaining.isOverdue && (
            <p className="text-xs mt-2 font-medium">
              ⚠️ Please return the car as soon as possible to avoid additional charges
            </p>
          )}
          {!timeRemaining.isOverdue && timeRemaining.totalHours < 24 && (
            <p className="text-xs mt-2 font-medium">
              ⚠️ Less than 24 hours remaining!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

